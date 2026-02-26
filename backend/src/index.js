const express = require('express');
const cors = require('cors');
const db = require('./db');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// --- Core API ---

app.get('/api/health', (req, res) => res.json({ status: 'ok', service: 'DCBI Backend (v1.1.0 Foundation)' }));

app.get('/api/entities', (req, res) => res.json(db.get('entities')));

app.get('/api/users', (req, res) => res.json(db.get('users')));

app.get('/api/claims', (req, res) => {
    const userId = req.query.userId;
    let claims = db.get('claims');
    if (userId) claims = claims.filter(c => c.userId == userId);
    res.json(claims);
});

// --- Administration CRUD ---

const setupCrud = (collection) => {
    app.get(`/api/${collection}`, (req, res) => res.json(db.get(collection)));
    app.post(`/api/${collection}`, (req, res) => {
        console.log(`[CRUD] POST /api/${collection}`, req.body);
        const item = { ...req.body, id: collection.charAt(0).toUpperCase() + Date.now() };
        db.insert(collection, item);
        res.status(201).json(item);
    });
    app.patch(`/api/${collection}/:id`, (req, res) => {
        console.log(`[CRUD] PATCH /api/${collection}/${req.params.id}`, req.body);
        const updated = db.update(collection, req.params.id, req.body);
        if (!updated) {
            console.error(`[CRUD] 404: ${collection} item ${req.params.id} not found`);
            return res.status(404).json({ error: 'Item not found' });
        }
        res.json(updated);
    });
    app.delete(`/api/${collection}/:id`, (req, res) => {
        const data = db.read();
        const index = data[collection].findIndex(i => i.id == req.params.id);
        if (index !== -1) {
            data[collection].splice(index, 1);
            db.save(data);
            res.status(204).end();
        } else {
            res.status(404).json({ error: 'Item not found' });
        }
    });
};

setupCrud('projects');
setupCrud('departments');
setupCrud('expenseTypes');
setupCrud('entities');
setupCrud('users');
setupCrud('receipts');

app.get('/api/receipts', (req, res) => {
    const { userId, status } = req.query;
    let receipts = db.get('receipts');
    if (userId) receipts = receipts.filter(r => r.userId == userId);
    if (status) receipts = receipts.filter(r => r.status == status);
    res.json(receipts);
});

// Create Claim
app.post('/api/claims', (req, res) => {
    const claimData = req.body;
    const entity = db.get('entities').find(e => e.id == claimData.entityId);

    if (!entity) return res.status(404).json({ error: 'Entity not found' });

    // Basic Validation based on PRD v1.1.0/Entity Mandatory Fields
    const mandatory = entity.mandatoryFields;
    const errors = [];

    if (!claimData.title) errors.push('Title is required');

    claimData.expenses?.forEach((exp, idx) => {
        if (mandatory.project && !exp.project) errors.push(`Line ${idx + 1}: Project is mandatory for this entity`);
        if (mandatory.department && !exp.department) errors.push(`Line ${idx + 1}: Department is mandatory for this entity`);
        if (mandatory.costCenter && !exp.costCenter) errors.push(`Line ${idx + 1}: Cost Center is mandatory for this entity`);

        // Entertainment Logic
        if (exp.type === 'Entertainment') {
            if (!exp.clients) errors.push(`Line ${idx + 1}: Clients Joined is required for Entertainment`);
            if (!exp.purpose) errors.push(`Line ${idx + 1}: Purpose is required for Entertainment`);
            if (!exp.attendees || exp.attendees <= 0) errors.push(`Line ${idx + 1}: Attendee count must be > 0`);
        }
    });

    if (errors.length > 0) return res.status(400).json({ errors });

    const newClaim = {
        ...claimData,
        id: 'C-' + Date.now(),
        createdAt: new Date().toISOString(),
        version: 1
    };

    db.insert('claims', newClaim);

    // Audit Log
    db.insert('auditLogs', {
        id: 'AL-' + Date.now(),
        claimId: newClaim.id,
        action: 'CREATE',
        actorId: claimData.userId,
        newStatus: newClaim.claimStatus,
        timestamp: new Date().toISOString()
    });

    res.status(201).json(newClaim);
});

// Update Status (Approval/Accrual)
app.patch('/api/claims/:id/status', (req, res) => {
    const { id } = req.params;
    const { claimStatus, approvalStatus, actorId, comment } = req.body;

    const claim = db.get('claims').find(c => c.id == id);
    if (!claim) return res.status(404).json({ error: 'Claim not found' });

    const actor = db.get('users').find(u => u.id == actorId);
    if (!actor) return res.status(404).json({ error: 'Actor (User) not found' });

    const prevClaimStatus = claim.claimStatus;
    const prevApprovalStatus = claim.approvalStatus;

    // --- 1. Multi-Entity Approval Validation (PRD 2.1) ---
    if (approvalStatus && approvalStatus !== prevApprovalStatus) {
        const isManager = actor.roles.includes('MANAGER');
        if (!isManager) return res.status(403).json({ error: 'Only managers can change approval status' });

        // Check explicit cross-entity assignment
        const sameEntity = actor.entityId == claim.entityId;
        const explicitlyAssigned = actor.assignedEntities?.some(eid => eid == claim.entityId);

        if (!sameEntity && !explicitlyAssigned) {
            // Unauthorized approval attempt
            db.insert('auditLogs', {
                id: 'AL-' + Date.now(),
                claimId: id,
                action: 'UNAUTHORIZED_APPROVAL_ATTEMPT',
                actorId,
                details: { info: 'Cross-entity approval without explicit assignment', entityId: claim.entityId },
                timestamp: new Date().toISOString()
            });
            return res.status(403).json({ error: 'Unauthorized: No explicit assignment for this entity' });
        }
    }

    // --- 2. State Machine Enforcement (PRD 3.1) ---
    if (claimStatus && claimStatus !== prevClaimStatus) {
        const isAccountant = actor.roles.includes('ACCOUNTANT');

        if (claimStatus === 'ACCRUED') {
            if (!isAccountant) return res.status(403).json({ error: 'Only accountants can accrue claims' });
        }

        if (claimStatus === 'CLOSED') {
            if (!isAccountant) return res.status(403).json({ error: 'Only accountants can close claims' });
            if (prevApprovalStatus !== 'APPROVED') {
                return res.status(403).json({ error: 'Sync blocked: Claim must be APPROVED' });
            }

            // --- 3. D365FO Integration Simulation (PRD 3.3) ---
            const syncKey = `${id}-${claim.version}`;
            const syncLogs = db.get('auditLogs').filter(l => l.action == 'D365FO_SYNC_SUCCESS' && l.details?.syncKey == syncKey);

            if (syncLogs.length > 0) {
                return res.status(409).json({ error: 'Duplicate Sync Attempt: This version is already posted to D365FO.' });
            }

            console.log(`[ERP] Calling D365FO for Claim ${id}...`);

            if (Math.random() < 0.1) {
                db.insert('auditLogs', {
                    id: 'AL-' + Date.now(),
                    claimId: id,
                    action: 'D365FO_SYNC_FAILURE',
                    actorId,
                    details: { error: 'OData Service Timeout', syncKey },
                    timestamp: new Date().toISOString()
                });
                return res.status(504).json({ error: 'D365FO Service Timeout. Please retry sync.' });
            }

            db.insert('auditLogs', {
                id: 'AL-' + Date.now(),
                claimId: id,
                action: 'D365FO_SYNC_SUCCESS',
                actorId,
                details: { journalId: 'JRN-' + Math.floor(Math.random() * 99999), syncKey },
                timestamp: new Date().toISOString()
            });
        }
    }

    const updated = db.update('claims', id, {
        claimStatus: claimStatus || prevClaimStatus,
        approvalStatus: approvalStatus || prevApprovalStatus,
        version: claim.version + 1,
        updatedAt: new Date().toISOString()
    });

    // Log to Audit Trail
    db.insert('auditLogs', {
        id: 'AL-' + Date.now(),
        claimId: id,
        action: 'STATUS_UPDATE',
        actorId,
        roleAtTime: actor.roles.join(','),
        previousStatus: prevClaimStatus,
        newStatus: claimStatus || prevClaimStatus,
        previousApprovalStatus: prevApprovalStatus,
        newApprovalStatus: approvalStatus || prevApprovalStatus,
        details: { comment },
        timestamp: new Date().toISOString()
    });

    res.json(updated);
});

// Get Audit History
app.get('/api/claims/:id/history', (req, res) => {
    const { id } = req.params;
    const logs = db.get('auditLogs').filter(l => l.claimId == id).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    res.json(logs);
});

// Update Claim Content (Drafts & Manager Comments)
app.patch('/api/claims/:id', (req, res) => {
    const { id } = req.params;
    const { actorId, ...body } = req.body;
    const claim = db.get('claims').find(c => c.id == id);

    if (!claim) return res.status(404).json({ error: 'Claim not found' });

    const actor = db.get('users').find(u => u.id == actorId);
    if (!actor) return res.status(404).json({ error: 'Actor (User) not found' });

    const isOwner = actor.id == claim.userId;
    const isManager = actor.roles.includes('MANAGER');

    // Validation
    if (claim.claimStatus == 'NEW' || claim.approvalStatus == 'REJECTED') {
        if (!isOwner) return res.status(403).json({ error: 'Only the owner can edit this claim' });
    } else if (claim.claimStatus == 'SUBMITTED') {
        if (!isManager) return res.status(403).json({ error: 'Only managers can add comments to submitted claims' });
    } else {
        return res.status(403).json({ error: 'This claim is locked and cannot be edited' });
    }

    const updated = db.update('claims', id, {
        ...body,
        id, // preserve ID
        version: claim.version + 1,
        updatedAt: new Date().toISOString()
    });

    // Audit Log for edit
    db.insert('auditLogs', {
        id: 'AL-' + Date.now(),
        claimId: id,
        action: isManager && claim.claimStatus == 'SUBMITTED' ? 'MANAGER_COMMENT' : 'EDIT_DRAFT',
        actorId,
        timestamp: new Date().toISOString()
    });

    res.json(updated);
});

app.get('/api/claims/:id/match-suggestions', (req, res) => {
    const { id } = req.params;
    const claim = db.get('claims').find(c => c.id == id);
    if (!claim) return res.status(404).json({ error: 'Claim not found' });

    // Mock AI Logic: Find receipts that match expense lines by amount/date
    const suggestions = claim.expenses.map(exp => {
        if (exp.description?.includes('Lufthansa')) {
            return { expenseId: exp.id, receiptId: 'rec_air_1', confidence: 0.98, fileName: 'LH_Ticket_Feb24.pdf' };
        }
        if (exp.description?.includes('Hilton')) {
            return { expenseId: exp.id, receiptId: 'rec_hotel_1', confidence: 0.95, fileName: 'London_Hilton_Invoice.pdf' };
        }
        return { expenseId: exp.id, receiptId: null, confidence: 0 };
    });

    res.json(suggestions);
});

app.listen(PORT, () => {
    console.log(`DCBI Expense Tool Backend (JSON-DB) running on port ${PORT}`);
});
