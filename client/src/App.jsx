import React, { useState, useMemo, useEffect } from 'react';
import { supabase } from './lib/supabase';

// --- INITIAL MOCK DATA ---

const INITIAL_USERS = [
  { id: '1', name: 'Adam Staff', email: 'adam@dcbi.com', roles: ['STAFF'], entityId: 'E1', approverId: '3' },
  { id: '2', name: 'Sarah Accountant', email: 'sarah@dcbi.com', roles: ['ACCOUNTANT'], entityId: 'E1', assignedEntities: ['E1', 'E2'] },
  { id: '3', name: 'Mark Manager', email: 'mark@dcbi.com', roles: ['MANAGER'], entityId: 'E1' },
  { id: '4', name: 'Super Admin', email: 'admin@dcbi.com', roles: ['ADMIN'], entityId: 'E1' },
  { id: '5', name: 'John StaffManager', email: 'john@dcbi.com', roles: ['STAFF', 'MANAGER'], entityId: 'E1', approverId: '4' },
  { id: '6', name: 'Emily StaffAcc', email: 'emily@dcbi.com', roles: ['STAFF', 'ACCOUNTANT'], entityId: 'E1', assignedEntities: ['E1'], approverId: '3' },
  { id: '7', name: 'Chris StaffAdmin', email: 'chris@dcbi.com', roles: ['STAFF', 'ADMIN'], entityId: 'E1', approverId: '3' },
];

const INITIAL_ENTITIES = [
  { id: 'E1', name: 'DCBI Global Ltd.', code: 'D001', address: '123 Business Way, London', country: 'United Kingdom', countryIso3: 'GBR', logo: '🌐', mandatoryFields: { project: true, department: true } },
  { id: 'E2', name: 'DCBI Core SAS', code: 'C092', address: '45 Finance Ave, Paris', country: 'France', countryIso3: 'FRA', logo: '💳', mandatoryFields: { project: false, department: true } },
];

const INITIAL_EXPENSE_TYPES = [
  { id: 'T1', label: 'Flight', defaultAccount: '600100', defaultVat: 0, requiresEntertainment: false },
  { id: 'T2', label: 'Hotel', defaultAccount: '600200', defaultVat: 7, requiresEntertainment: false },
  { id: 'T3', label: 'Entertainment', defaultAccount: '600300', defaultVat: 19, requiresEntertainment: true },
];

const MOCK_PROJECTS = ['PRJ-24-XT (Customer X)', 'PRJ-24-RD (Internal R&D)', 'PRJ-24-MK (Marketing)'];
const MOCK_DEPARTMENTS = ['D-SALES', 'D-PROD', 'D-MGMT'];

const CLAIM_STATUS = { NEW: 'NEW', SUBMITTED: 'SUBMITTED', ACCRUED: 'ACCRUED', CLOSED: 'CLOSED' };
const APPROVAL_STATUS = { NA: 'N/A', PENDING: 'PENDING APPROVAL', REJECTED: 'REJECTED', APPROVED: 'APPROVED' };

// --- COMPONENTS ---

const LoginPage = ({ users, onLogin }) => {
  const [search, setSearch] = useState('');
  const filteredUsers = (users || []).filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.roles.some(r => r.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: 'var(--bg-main)', padding: '2rem' }}>
      <div className="card" style={{ width: '700px', textAlign: 'center' }}>
        <h1>DCBI Expense Tool</h1>
        <p style={{ margin: '1rem 0 0.5rem', color: 'var(--text-secondary)' }}>Select Profile for Technical Audit</p>

        <div style={{ marginBottom: '1.5rem' }}>
          <input
            type="text"
            placeholder="Search users or roles..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', padding: '0.8rem', borderRadius: '8px', border: '1px solid #ddd' }}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.5rem', maxHeight: '50vh', overflowY: 'auto', padding: '0.5rem' }}>
          {filteredUsers.map(u => (
            <button key={u.id} className="btn btn-outline" style={{ display: 'block', width: '100%', padding: '1rem', textAlign: 'left' }} onClick={() => onLogin(u)}>
              <div style={{ fontWeight: 'bold' }}>{u.name}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--primary)', marginTop: '4px' }}>{u.roles.join(' + ')}</div>
              <div style={{ fontSize: '0.65rem', color: '#888' }}>{u.email}</div>
            </button>
          ))}
          {filteredUsers.length === 0 && <p style={{ gridColumn: 'span 2', padding: '2rem', color: '#999' }}>No users found matching "{search}"</p>}
        </div>

        <div style={{ borderTop: '1px solid #eee', paddingTop: '1.5rem' }}>
          <button className="btn btn-primary" style={{ width: '100%', background: '#0078d4', borderColor: '#0078d4' }} onClick={() => alert('Redirecting to Azure AD Tenant: DCBI_GLOBAL_MOCK... (SSO Simulation)')}>
            🛡️ Login with Corporate SSO (Azure AD)
          </button>
        </div>
      </div>
    </div>
  );
};

const Sidebar = ({ user, currentView, onViewChange, onLogout }) => {
  const hasRole = (role) => user.roles.includes(role);
  return (
    <aside className="sidebar">
      <div>
        <h1 style={{ fontSize: '1.2rem', color: 'var(--primary)', marginBottom: '0.5rem' }}>DCBI Tool</h1>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Operator: <strong>{user.name}</strong></p>
      </div>
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
        <div className={`nav-item ${currentView === 'dashboard' ? 'active' : ''}`} onClick={() => onViewChange('dashboard')}>🏠 Dashboard</div>
        {(hasRole('STAFF') || hasRole('ADMIN') || hasRole('ACCOUNTANT')) && (
          <div className={`nav-item ${currentView === 'receipts-backlog' ? 'active' : ''}`} onClick={() => onViewChange('receipts-backlog')}>📚 Receipts Library</div>
        )}
        {hasRole('STAFF') && (
          <>
            <div className={`nav-item ${currentView === 'my-claims' ? 'active' : ''}`} onClick={() => onViewChange('my-claims')}>📄 My Expenses</div>
            <div className={`nav-item ${currentView === 'imports' ? 'active' : ''}`} onClick={() => onViewChange('imports')}>💳 Bank Statements</div>
          </>
        )}
        {(hasRole('MANAGER') || hasRole('ACCOUNTANT') || hasRole('ADMIN')) && (
          <div className={`nav-item ${currentView === 'approvals' ? 'active' : ''}`} onClick={() => onViewChange('approvals')}>✅ Approvals Queue</div>
        )}
        {(hasRole('ACCOUNTANT') || hasRole('ADMIN')) && (
          <div className={`nav-item ${currentView === 'finance' ? 'active' : ''}`} onClick={() => onViewChange('finance')}>🏦 Compliance Hub</div>
        )}
        {hasRole('ADMIN') && (
          <div className={`nav-item ${currentView === 'admin' ? 'active' : ''}`} onClick={() => onViewChange('admin')}>⚙️ Control Center</div>
        )}
      </nav>
      <div style={{ marginTop: 'auto' }}><button className="btn btn-outline" style={{ width: '100%' }} onClick={onLogout}>Logout</button></div>
    </aside>
  );
};

const ClaimReport = ({ claim, user, entity }) => (
  <div className="card print-only" style={{ padding: '2rem', border: 'none', background: 'white', color: 'black' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '3px solid #000', paddingBottom: '1rem' }}>
      <div style={{ flex: 2 }}>
        <h1 style={{ margin: 0, color: '#333' }}>Expense Claim Audit Report</h1>
        <p style={{ margin: '0.5rem 0' }}>Ref: <strong>{claim.id}</strong> | Version: {claim.version}</p>
        <p>Title: <strong>{claim.title}</strong></p>
      </div>
      <div style={{ textAlign: 'right', flex: 1 }}>
        <h2 style={{ margin: 0 }}>{entity.name}</h2>
        <p style={{ fontSize: '0.8rem' }}>{entity.address}<br />{entity.country} ({entity.countryIso3})</p>
        <p style={{ marginTop: '1rem' }}>Employee: <strong>{user.name}</strong></p>
      </div>
    </div>

    <div style={{ marginTop: '2rem' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
        <thead>
          <tr style={{ background: '#f0f0f0', borderBottom: '1px solid #000' }}>
            <th style={{ padding: '8px', textAlign: 'left' }}>Date</th>
            <th style={{ textAlign: 'left' }}>Category</th>
            <th style={{ textAlign: 'left' }}>G/L Account</th>
            <th style={{ textAlign: 'left' }}>Description</th>
            <th style={{ textAlign: 'right' }}>Amount</th>
            <th style={{ textAlign: 'right' }}>VAT</th>
          </tr>
        </thead>
        <tbody>
          {claim.expenses.map(e => (
            <tr key={e.id} style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: '8px' }}>{e.date}</td>
              <td>{e.type}</td>
              <td style={{ fontFamily: 'monospace' }}>{e.glAccount || '600000'}</td>
              <td>{e.description}</td>
              <td style={{ textAlign: 'right' }}>€{Number(e.amount).toFixed(2)}</td>
              <td style={{ textAlign: 'right' }}>€{((Number(e.amount) * (e.vatRate || 0)) / 100).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ marginTop: '2.5rem', display: 'flex', justifyContent: 'flex-end' }}>
        <div style={{ width: '250px', borderTop: '2px solid #333', paddingTop: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span>Total Expenses:</span>
            <span>€{claim.expenses.reduce((acc, e) => acc + Number(e.amount), 0).toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '1.2rem' }}>
            <span>Net Payable:</span>
            <span>€{(claim.expenses.reduce((acc, e) => acc + Number(e.amount), 0) - Number(claim.advanceAmount)).toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div style={{ marginTop: '4rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem' }}>
        <div style={{ borderTop: '1px solid #999', paddingTop: '0.5rem', textAlign: 'center' }}>
          <small>Manager Approval (E-Signed)</small><br />
          <strong>{claim.managerApprovedAt ? 'APPROVED' : 'PENDING'}</strong>
        </div>
        <div style={{ borderTop: '1px solid #999', paddingTop: '0.5rem', textAlign: 'center' }}>
          <small>Accountant Verification</small><br />
          <strong>{claim.accountantApprovedAt ? 'VERIFIED' : 'PENDING'}</strong>
        </div>
      </div>
    </div>
  </div>
);

const DetailView = ({ claim, owner, currentUser, entity, onBack, onStatusUpdate, onEdit, onSave, mode, expenseTypes, onPreview }) => {
  const [activeTab, setActiveTab] = useState('details');
  const [syncing, setSyncing] = useState(false);
  const [history, setHistory] = useState([]);

  React.useEffect(() => {
    fetchHistory();
  }, [claim.id]);

  const fetchHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('claims')
        .select('history')
        .eq('id', claim.id)
        .single();

      if (error) throw error;
      setHistory(data?.history || []);
    } catch (err) {
      console.error('History fetch error:', err);
    }
  };

  const wrappedStatusUpdate = async (id, update) => {
    // If we're a manager and updating status, also save any pending comments
    if (mode === 'manager') {
      const updatedExpenses = claim.expenses.map(e => {
        const commentEl = document.getElementById(`comment-${e.id}`);
        return commentEl ? { ...e, comment: commentEl.value } : e;
      });
      await onSave({ ...claim, expenses: updatedExpenses, actorId: currentUser.id });
    }
    await onStatusUpdate(id, update);
    fetchHistory();
  };

  const handleSync = async () => {
    setSyncing(true);
    await wrappedStatusUpdate(claim.id, { claimStatus: CLAIM_STATUS.CLOSED });
    setSyncing(false);
  };

  return (
    <div className="view">
      <div className="header no-print">
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          Claim Detail: {claim.title}
          {syncing && <span className="spinner"></span>}
        </h2>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-outline" onClick={onBack}>Back</button>
          <button className="btn btn-outline" onClick={() => window.print()}>🖨️ Print Audit Report</button>
          {mode === 'staff' && (claim.claimStatus === CLAIM_STATUS.NEW || claim.approvalStatus === APPROVAL_STATUS.REJECTED) && (
            <button className="btn btn-primary" onClick={() => onEdit(claim)}>
              {claim.approvalStatus === APPROVAL_STATUS.REJECTED ? '✏️ Edit & Resubmit' : '✏️ Edit Draft'}
            </button>
          )}
          {mode === 'manager' && claim.approvalStatus === APPROVAL_STATUS.PENDING && (
            <>
              <button className="btn btn-outline" style={{ color: 'var(--error)' }} onClick={() => wrappedStatusUpdate(claim.id, { approvalStatus: APPROVAL_STATUS.REJECTED })}>Reject Claim</button>
              <button className="btn btn-primary" onClick={() => wrappedStatusUpdate(claim.id, { approvalStatus: APPROVAL_STATUS.APPROVED })}>Approve Claim</button>
            </>
          )}
          {mode === 'finance' && (
            <>
              {(claim.claimStatus === CLAIM_STATUS.SUBMITTED || claim.approvalStatus === APPROVAL_STATUS.REJECTED) && (
                <button className="btn btn-warning" onClick={() => wrappedStatusUpdate(claim.id, { claimStatus: CLAIM_STATUS.ACCRUED })}>Accrue (Month-End)</button>
              )}
              {claim.approvalStatus === APPROVAL_STATUS.APPROVED && claim.claimStatus !== CLAIM_STATUS.CLOSED && (
                <button className="btn btn-primary" disabled={syncing} onClick={handleSync}>
                  {syncing ? 'Syncing to D365FO...' : 'Sync & Close'}
                </button>
              )}
            </>
          )}
        </div>
      </div>

      <div className="no-print">
        {claim.approvalStatus === APPROVAL_STATUS.REJECTED && (
          <div className="alert alert-error" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem', border: '1px solid #f44336', color: '#f44336', background: '#ffebee', borderRadius: '4px' }}>
            <span style={{ fontSize: '1.2rem' }}>⚠️</span>
            <div>
              <strong>Action Required: Claim Rejected</strong><br />
              <small>Please review the manager's feedback below, correct the discrepancies, and resubmit.</small>
            </div>
          </div>
        )}
        <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1.5rem' }}>
          <span className={`badge badge-${claim.claimStatus.toLowerCase()}`}>Claim: {claim.claimStatus}</span>
          <span className={`badge badge-${claim.approvalStatus.replace(' ', '-').toLowerCase()}`}>Approval: {claim.approvalStatus}</span>
          <span>Advance: €{claim.advanceAmount}</span>
        </div>

        <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--border)', marginBottom: '1.5rem' }}>
          <div className={`nav-item ${activeTab === 'details' ? 'active' : ''}`} onClick={() => setActiveTab('details')}>Details & Receipts</div>
          <div className={`nav-item ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>Audit History</div>
        </div>

        {activeTab === 'details' ? (
          <div className="card">
            {claim.expenses.map(e => {
              const typeCfg = (expenseTypes || []).find(t => t.label === e.type);
              const mapping = entity.expenseMappings?.[typeCfg?.id];
              return (
                <div key={e.id} style={{ borderBottom: '1px solid #f0f0f0', paddingBottom: '1.5rem', marginBottom: '1.5rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 3fr 1fr 1fr', gap: '1rem', padding: '0.5rem 0' }}>
                    <strong>{e.type}</strong>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span>{e.description || 'No description provided'}</span>
                      <small style={{ color: '#888' }}>
                        {e.project && `Project: ${e.project}`} {e.department && ` | Dept: ${e.department}`}
                      </small>
                    </div>
                    <strong>€{e.amount}</strong>
                    <div className="attachment-container">
                      {e.receipt ? (
                        <span style={{ color: 'var(--primary)', cursor: 'pointer', textDecoration: 'underline' }} onClick={() => onPreview && onPreview(e.receipt)}>📎 {e.receipt}</span>
                      ) : (
                        <span style={{ color: '#999' }}>No receipt</span>
                      )}
                    </div>
                  </div>

                  <div style={{ marginBottom: '0.8rem', fontSize: '0.75rem', color: '#666' }}>
                    {entity.name} Mapping: G/L <strong>{mapping?.glAccount || typeCfg?.defaultAccount || 'N/A'}</strong> | VAT <strong>{mapping?.vatRate ?? typeCfg?.defaultVat ?? 0}%</strong>
                  </div>

                  {/* Line Comments Visibility (PRD 5.1/5.2) */}
                  {(e.comment || mode === 'manager' || claim.approvalStatus === APPROVAL_STATUS.REJECTED) && (
                    <div style={{ marginTop: '0.8rem', padding: '0.75rem', background: '#fff9c4', borderRadius: '4px', borderLeft: '3px solid #fbc02d' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                        <strong style={{ fontSize: '0.8rem' }}>Manager Feedback:</strong>
                        {mode === 'manager' && (
                          <button className="btn btn-outline" style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem' }} onClick={() => {
                            const updatedExpenses = claim.expenses.map(item => item.id == e.id ? { ...item, comment: document.getElementById(`comment-${e.id}`).value } : item);
                            onSave({ ...claim, expenses: updatedExpenses, actorId: currentUser.id });
                          }}>Save Comment</button>
                        )}
                      </div>
                      {mode === 'manager' && claim.approvalStatus === APPROVAL_STATUS.PENDING ? (
                        <textarea id={`comment-${e.id}`} defaultValue={e.comment} placeholder="Provide feedback or reason for rejection..." style={{ width: '100%', border: '1px solid #ddd', borderRadius: '4px', padding: '0.5rem', fontSize: '0.85rem' }} rows={2} />
                      ) : (
                        <p style={{ margin: 0, fontSize: '0.85rem' }}>{e.comment || 'No feedback provided.'}</p>
                      )}
                    </div>
                  )}

                  {/* Accountant Specific Adjustment Row (PRD 7.3) */}
                  {mode === 'finance' && (
                    <div style={{ background: '#f9f9f9', padding: '0.75rem', borderRadius: '4px', marginTop: '0.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '1rem', fontSize: '0.85rem' }}>
                      <div className="form-group">
                        <label>G/L Account</label>
                        <input type="text" defaultValue={mapping?.glAccount || typeCfg?.defaultAccount || '600000'} style={{ padding: '0.2rem' }} />
                      </div>
                      <div className="form-group">
                        <label>VAT Rate (%)</label>
                        <input type="number" defaultValue={mapping?.vatRate ?? typeCfg?.defaultVat ?? 0} style={{ padding: '0.2rem' }} />
                      </div>
                      <div className="form-group">
                        <label>Project</label>
                        <input type="text" defaultValue={e.project} style={{ padding: '0.2rem' }} />
                      </div>
                      <div className="form-group" style={{ alignSelf: 'end' }}>
                        <button className="btn btn-outline" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }} onClick={() => alert('Dimension Update Persisted (Logged to Audit Trail)')}>Update Dimensions</button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="card">
            <h3>Audit Trail</h3>
            <ul style={{ listStyle: 'none', marginTop: '1rem' }}>
              {history.map(log => (
                <li key={log.id} style={{ padding: '0.8rem 0', borderBottom: '1px solid #f0f0f0', display: 'flex', gap: '1rem' }}>
                  <small style={{ color: '#666', minWidth: '150px' }}>{new Date(log.timestamp).toLocaleString()}</small>
                  <span><strong>{log.action}</strong> by {log.actorId === owner.id ? 'Staff' : (log.actorId === currentUser.id ? 'Self' : 'Reviewer')}</span>
                  {log.details?.error && <span style={{ color: 'var(--error)' }}>({log.details.error})</span>}
                </li>
              ))}
            </ul>
          </div>
        )
        }
      </div >

      <ClaimReport claim={claim} user={owner} entity={entity} />
    </div >
  );
};

const ClaimForm = ({ user, claim, entities, projects, departments, expenseTypes, receipts, onCancel, onSave, onDraft, onPreview }) => {
  const availableEntities = entities || [];
  const [selectedEntityId, setSelectedEntityId] = useState(claim?.entityId || (availableEntities.length === 1 ? availableEntities[0].id : ''));
  const activeEntity = availableEntities.find(e => e.id === selectedEntityId) || {};

  const availableCurrencies = useMemo(() => {
    if (!activeEntity.id) return [];
    const curs = [];
    if (activeEntity.primary_currency) curs.push(activeEntity.primary_currency);
    if (activeEntity.secondary_currency) curs.push(activeEntity.secondary_currency);
    return [...new Set(curs)];
  }, [activeEntity]);

  const [selectedCurrency, setSelectedCurrency] = useState(claim?.currency || (availableCurrencies.length === 1 ? availableCurrencies[0] : ''));

  const [formData, setFormData] = useState(claim || {
    id: 'DRAFT-' + Date.now(),
    title: '',
    userId: user.id,
    entityId: selectedEntityId,
    currency: selectedCurrency,
    advanceAmount: 0,
    claimStatus: CLAIM_STATUS.NEW,
    approvalStatus: APPROVAL_STATUS.NA,
    expenses: []
  });

  useEffect(() => {
    setFormData(prev => ({ ...prev, entityId: selectedEntityId, currency: selectedCurrency }));
  }, [selectedEntityId, selectedCurrency]);

  const [showLibrary, setShowLibrary] = useState(true);
  const fileInputRef = React.useRef(null);
  const claimFileInputRef = React.useRef(null);

  const mandatory = activeEntity.mandatoryFields || {};

  const isFormValid = useMemo(() => {
    if (!formData.title || !formData.entityId || (availableCurrencies.length > 0 && !formData.currency)) return false;
    return formData.expenses.every(e => {
      const typeCfg = expenseTypes.find(t => t.label === e.type);
      const mapping = activeEntity.expenseMappings?.[typeCfg?.id];
      const glAccount = mapping?.glAccount || typeCfg?.defaultAccount;
      const basicValid = e.type && e.amount > 0 && e.receipt &&
        (!mandatory.project || e.project) &&
        (!mandatory.department || e.department);
      if (typeCfg?.requiresEntertainment) {
        return basicValid && e.clients && e.purpose && e.attendees;
      }
      return basicValid;
    });
  }, [formData, mandatory, expenseTypes, activeEntity, availableCurrencies]);

  const updateExpense = (id, field, value) => {
    const updated = formData.expenses.map(e => e.id === id ? { ...e, [field]: value } : e);
    setFormData({ ...formData, expenses: updated });
  };

  return (
    <div className="view">
      <div className="frozen-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ color: 'var(--primary)' }}>{formData.title || 'New Expense Claim'}</h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Positions: <strong>{formData.expenses.length}</strong> | Total: <strong>€{formData.expenses.reduce((acc, e) => acc + Number(e.amount), 0)}</strong>
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-outline" onClick={onCancel}>Cancel</button>
            <button className="btn btn-outline" onClick={() => onDraft(formData)}>Save Draft</button>
            <button className="btn btn-primary" disabled={!isFormValid} onClick={() => onSave({ ...formData, claimStatus: CLAIM_STATUS.SUBMITTED, approvalStatus: APPROVAL_STATUS.PENDING })}>Submit for Approval</button>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>
        <div style={{ flex: showLibrary ? '3' : '1', transition: 'flex 0.3s ease' }}>
          <div className="card" style={{ marginBottom: '1.5rem', display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
            <div className="form-group">
              <label>Claim Title *</label>
              <input type="text" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} placeholder="e.g. Q1 Travel Expenses" />
            </div>
            <div className="form-group">
              <label>Advance Amount Received (€)</label>
              <input type="number" value={formData.advanceAmount} onChange={e => setFormData({ ...formData, advanceAmount: e.target.value })} />
            </div>
          </div>

          <div className="card" style={{ marginBottom: '1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            <div className="form-group">
              <label>Legal Entity *</label>
              <select value={selectedEntityId} onChange={e => { setSelectedEntityId(e.target.value); setSelectedCurrency(''); }} disabled={!!claim}>
                <option value="">Select Entity</option>
                {availableEntities.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Claim Currency *</label>
              <select value={selectedCurrency} onChange={e => setSelectedCurrency(e.target.value)} disabled={availableCurrencies.length === 0 || !!claim}>
                <option value="">{availableCurrencies.length > 0 ? 'Select Currency' : 'N/A'}</option>
                {availableCurrencies.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          {selectedEntityId && (availableCurrencies.length === 0 || selectedCurrency) && (
            <>
              {formData.expenses.map((exp, idx) => {
                const typeCfg = expenseTypes.find(t => t.label === exp.type);
                const mapping = activeEntity.expenseMappings?.[typeCfg?.id];
                const localGL = mapping?.glAccount || typeCfg?.defaultAccount || 'N/A';
                const localVAT = mapping?.vatRate ?? typeCfg?.defaultVat ?? 0;
                return (
                  <div
                    key={exp.id}
                    className="card"
                    style={{ marginBottom: '1rem', borderLeft: '4px solid var(--primary)', transition: 'transform 0.2s', position: 'relative' }}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      try {
                        const receiptData = JSON.parse(e.dataTransfer.getData('receipt'));
                        const newExpenses = [...formData.expenses];
                        newExpenses[idx] = {
                          ...newExpenses[idx],
                          receipt: receiptData.file_name,
                          amount: receiptData.amount_suggestion,
                          backlogId: receiptData.id,
                          description: `Allocated from ${receiptData.file_name}`
                        };
                        setFormData({ ...formData, expenses: newExpenses });
                      } catch (err) { console.error('Drop error:', err); }
                    }}
                  >
                    <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr', gap: '1rem' }}>
                      <div className="form-group">
                        <label>Type *</label>
                        <select value={exp.type} onChange={e => updateExpense(exp.id, 'type', e.target.value)}>
                          <option value="">Choose Type</option>
                          {expenseTypes.map(t => <option key={t.id} value={t.label}>{t.label}</option>)}
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Amount *</label>
                        <input type="number" value={exp.amount} onChange={e => updateExpense(exp.id, 'amount', e.target.value)} />
                      </div>
                      <div className="form-group">
                        <label>Payment</label>
                        <select value={exp.payment} onChange={e => updateExpense(exp.id, 'payment', e.target.value)}>
                          <option value="COMPANY_CREDITCARD">Company Creditcard</option>
                          <option value="REIMBURSABLE">Reimbursable</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Receipt Attachment</label>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <input value={exp.receipt || ''} readOnly placeholder="Drag here or click →" onClick={() => document.getElementById(`file-upload-${exp.id}`).click()} style={{ cursor: 'pointer' }} />
                          <input id={`file-upload-${exp.id}`} type="file" accept="image/*,application/pdf" style={{ display: 'none' }} onChange={(e) => {
                            const file = e.target.files[0];
                            if (file) {
                              const newExpenses = [...formData.expenses];
                              newExpenses[idx].receipt = file.name;
                              setFormData({ ...formData, expenses: newExpenses });

                              // Cache file locally for preview
                              const reader = new FileReader();
                              reader.onload = (ev) => {
                                localStorage.setItem(`receipt_blob_${file.name}`, ev.target.result);
                              };
                              reader.readAsDataURL(file);
                            }
                          }} />
                          <button className="btn btn-primary" style={{ fontSize: '0.75rem' }} onClick={() => document.getElementById(`file-upload-${exp.id}`).click()}>Library</button>
                        </div>
                      </div>
                    </div>

                    {/* Entity-Specific Dimensions */}
                    <div style={{ padding: '0.5rem 1rem', background: '#f8f8f8', borderTop: '1px solid #eee', fontSize: '0.75rem', color: '#666', borderBottomLeftRadius: '4px', borderBottomRightRadius: '4px' }}>
                      Financial Dimensions for {activeEntity.name}: <strong>GL {localGL}</strong> | <strong>VAT {localVAT}%</strong>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginTop: '0.5rem' }}>
                      <div className="form-group">
                        <label>Project {mandatory.project && '*'}</label>
                        <select value={exp.project} onChange={e => updateExpense(exp.id, 'project', e.target.value)}>
                          <option value="">Select Project</option>
                          {projects.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Department {mandatory.department && '*'}</label>
                        <select value={exp.department} onChange={e => updateExpense(exp.id, 'department', e.target.value)}>
                          <option value="">Select Dept</option>
                          {departments.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Description</label>
                        <input type="text" value={exp.description || ''} onChange={e => updateExpense(exp.id, 'description', e.target.value)} />
                      </div>
                    </div>

                    <div style={{ textAlign: 'right', marginTop: '0.5rem' }}>
                      <button className="btn" style={{ color: 'var(--error)', padding: '0.2rem' }} onClick={() => setFormData({ ...formData, expenses: formData.expenses.filter(i => i.id !== exp.id) })}>Remove Position</button>
                    </div>
                  </div>
                );
              })}
              <button className="btn btn-outline" style={{ width: '100%' }} onClick={() => setFormData({ ...formData, expenses: [...formData.expenses, { id: Date.now(), type: '', amount: 0, currency: selectedCurrency, payment: 'COMPANY_CREDITCARD', receipt: null, project: '', department: '' }] })}>+ Add New Position</button>
            </>
          )}
        </div>

        {showLibrary && (
          <div className="card" style={{ flex: '1', position: 'sticky', top: '100px', height: 'calc(100vh - 150px)', overflowY: 'auto', borderLeft: '2px dashed #ddd' }}>
            <div className="header" style={{ marginBottom: '1rem' }}>
              <h3>Receipts Library</h3>
              <button className="btn btn-outline" style={{ padding: '2px 8px' }} onClick={() => setShowLibrary(false)}>×</button>
            </div>
            <p style={{ fontSize: '0.75rem', color: '#666', marginBottom: '1rem' }}>Drag a receipt onto an expense card.</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {(receipts || []).map(r => (
                <div
                  key={r.id}
                  draggable
                  onDragStart={(e) => e.dataTransfer.setData('receipt', JSON.stringify(r))}
                  style={{ padding: '0.8rem', border: '1px solid #eee', borderRadius: '6px', cursor: 'grab', background: 'white' }}
                >
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <span style={{ fontSize: '1.5rem', cursor: 'pointer' }} onClick={() => onPreview && onPreview(r.file_name)}>📄</span>
                    <div style={{ overflow: 'hidden' }}>
                      <strong style={{ display: 'block', fontSize: '0.85rem', cursor: 'pointer' }} onClick={() => onPreview && onPreview(r.file_name)}>{r.file_name}</strong>
                      <small style={{ color: 'var(--primary)', fontWeight: 'bold' }}>€{r.amount_suggestion}</small>
                      <div style={{ fontSize: '0.7rem', color: '#888' }}>{r.vendor_suggestion}</div>
                    </div>
                  </div>
                </div>
              ))}
              {(receipts || []).length === 0 && <p style={{ textAlign: 'center', color: '#888', padding: '2rem' }}>No unallocated receipts found.</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const ImportPortal = ({ entities, user, onImportComplete }) => {
  const [step, setStep] = useState('upload');
  const [transactions, setTransactions] = useState([]);

  const handleSimulateUpload = () => {
    // Simulated bank statement data
    const mockData = [
      { id: 'tx1', date: '2024-02-15', vendor: 'Lufthansa', amount: 480.00, currency: 'EUR', suggestedType: 'Flight' },
      { id: 'tx2', date: '2024-02-16', vendor: 'Hilton London', amount: 215.40, currency: 'EUR', suggestedType: 'Hotel' },
      { id: 'tx3', date: '2024-02-18', vendor: 'Starbucks', amount: 15.50, currency: 'EUR', suggestedType: 'Meal' },
      { id: 'tx4', date: '2024-02-19', vendor: 'Amazon Web Services', amount: 1200.00, currency: 'EUR', suggestedType: 'IT Services' }
    ];
    setTransactions(mockData);
    setStep('staging');
  };

  const createDraftClaim = () => {
    const newClaim = {
      id: 'DRAFT-' + Date.now(),
      title: 'Imported Statement: ' + new Date().toLocaleDateString(),
      userId: user.id,
      entityId: user.entityId,
      advanceAmount: 0,
      claimStatus: CLAIM_STATUS.NEW,
      approvalStatus: APPROVAL_STATUS.NA,
      expenses: transactions.map((tx, idx) => ({
        id: Date.now() + idx,
        type: tx.suggestedType,
        amount: tx.amount,
        currency: tx.currency,
        date: tx.date,
        description: tx.vendor,
        paymentMethod: 'COMPANY_CARD',
        receipt: 'auto_matched.png', // Pre-attaching mock receipt for imported lines
        project: '',
        department: ''
      }))
    };
    onImportComplete(newClaim);
  };

  return (
    <div className="view">
      <div className="header"><h2>Bank Statement Import</h2></div>
      {step === 'upload' ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📄</div>
          <h3>Upload Statement</h3>
          <p style={{ color: '#666', marginBottom: '1.5rem' }}>Drag Excel/PDF statements here or use our simulation</p>
          <button className="btn btn-primary" onClick={handleSimulateUpload}>Upload & Extract (OCR Simulation)</button>
        </div>
      ) : (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div>
              <h3>Review Extracted Lines: Amex_Feb.xlsx</h3>
              <p style={{ fontSize: '0.8rem', color: '#666' }}>Matched 4 transactions for {entities.find(e => e.id == user.entityId)?.name}</p>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn btn-outline" onClick={() => setStep('upload')}>Cancel</button>
              <button className="btn btn-primary" onClick={createDraftClaim}>Convert to Draft Claim</button>
            </div>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #eee', textAlign: 'left', fontSize: '0.85rem' }}>
                <th style={{ padding: '0.8rem 0' }}>Date</th>
                <th>Vendor</th>
                <th>Amount</th>
                <th>Category (Auto-Mapped)</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map(tx => (
                <tr key={tx.id} style={{ borderBottom: '1px solid #f9f9f9', fontSize: '0.9rem' }}>
                  <td style={{ padding: '0.8rem 0' }}>{tx.date}</td>
                  <td style={{ fontWeight: '500' }}>{tx.vendor}</td>
                  <td>{tx.currency} {tx.amount.toFixed(2)}</td>
                  <td>
                    <span className="badge" style={{ background: '#e3f2fd', color: '#1976d2', border: 'none' }}>
                      🪄 {tx.suggestedType}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const ReceiptBacklog = ({ user, onAllocate, onBack, onPreview }) => {
  const [receipts, setReceipts] = useState([]);
  const [loading, setLoading] = useState(false);
  const fileInputRef = React.useRef(null);

  useEffect(() => {
    fetchReceipts();
  }, []);

  const fetchReceipts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('receipts')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'UNALLOCATED');

      if (error) throw error;
      setReceipts(data || []);
    } catch (err) {
      console.error('Fetch receipts error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSimulateUpload = async (fileName) => {
    const fName = fileName || `receipt_${Date.now()}.png`;
    const newReceipt = {
      id: `R${Date.now()}`,
      user_id: user.id,
      file_name: fName,
      status: 'UNALLOCATED',
      amount_suggestion: Math.floor(Math.random() * 100) + 10,
      vendor_suggestion: ['Starbucks', 'Shell', 'Lufthansa', 'Amazon'][Math.floor(Math.random() * 4)]
    };

    try {
      const { error } = await supabase
        .from('receipts')
        .insert(newReceipt);

      if (error) throw error;
      fetchReceipts();
    } catch (err) {
      console.error('Upload error:', err);
      alert('Upload simulation failed: ' + err.message);
    }
  };

  const onFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Cache file locally for preview
      const reader = new FileReader();
      reader.onload = (ev) => {
        localStorage.setItem(`receipt_blob_${file.name}`, ev.target.result);
        handleSimulateUpload(file.name);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDelete = async (id) => {
    try {
      const { error } = await supabase
        .from('receipts')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchReceipts();
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  return (
    <div className="view">
      <div className="header">
        <h2>Receipt Backlog (Unallocated Library)</h2>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-outline" onClick={onBack}>Back</button>
          <input type="file" ref={fileInputRef} style={{ display: 'none' }} onChange={onFileChange} />
          <button className="btn btn-primary" onClick={() => fileInputRef.current.click()}>+ Upload from Local Machine</button>
        </div>
      </div>

      <div className="card" style={{ marginTop: '1.5rem' }}>
        {loading ? <p>Loading backlog...</p> : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1.5rem' }}>
            {receipts.map(r => (
              <div key={r.id} className="card" style={{ padding: '1rem', border: '1px solid #eee', position: 'relative', cursor: 'pointer' }} onClick={() => onPreview && onPreview(r.file_name)}>
                <div style={{ background: '#f5f5f5', height: '120px', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.8rem' }}>
                  <span style={{ fontSize: '2rem' }}>📄</span>
                </div>
                <strong style={{ cursor: 'pointer', textDecoration: 'underline' }}>{r.file_name}</strong>
                <p style={{ fontSize: '0.75rem', color: '#666', margin: '0.4rem 0' }}>Uploaded: {new Date(r.created_at).toLocaleDateString()}</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.8rem' }}>
                  <small style={{ color: 'var(--primary)', fontWeight: 'bold' }}>€{r.amount_suggestion}</small>
                  <button className="btn btn-outline" style={{ padding: '0.2rem 0.4rem', fontSize: '0.7rem', color: 'var(--error)' }} onClick={() => handleDelete(r.id)}>Delete</button>
                </div>
                <div style={{ marginTop: '0.8rem' }}>
                  <button className="btn btn-primary" style={{ width: '100%', fontSize: '0.75rem' }} onClick={() => onAllocate(r)}>Use in New Claim</button>
                </div>
              </div>
            ))}
            {receipts.length === 0 && <p style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', color: '#888' }}>No unallocated receipts found. Upload some!</p>}
          </div>
        )}
      </div>
    </div>
  );
};

const AdminCenter = ({ entities, users, projects, departments, expenseTypes, userEntityApprovers, onSaveItem, onDeleteItem }) => {
  const [activeTab, setActiveTab] = useState('entities');
  const [editingItem, setEditingItem] = useState(null);
  const [search, setSearch] = useState('');

  const renderRoles = (userRoles) => {
    const roles = Array.isArray(userRoles) ? userRoles : [userRoles];
    return roles.join(', ');
  };

  const AVAILABLE_ROLES = ['STAFF', 'MANAGER', 'ACCOUNTANT', 'ADMIN'];

  const handleSave = () => {
    let collection = '';
    if (editingItem.type === 'entity') collection = 'entities';
    else if (editingItem.type === 'user') collection = 'users';
    else if (editingItem.type === 'project') collection = 'projects';
    else if (editingItem.type === 'department') collection = 'departments';
    else if (editingItem.type === 'expenseType') collection = 'expenseTypes';

    onSaveItem(collection, editingItem);
    setEditingItem(null);
  };

  const filtered = (list) => list.filter(item =>
    (item.name || item.label || item.title || '').toLowerCase().includes(search.toLowerCase()) ||
    (item.email || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="view">
      <div className="header"><h2>Governance & Administration</h2></div>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        <button className={`btn ${activeTab === 'entities' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setActiveTab('entities')}>Legal Entities</button>
        <button className={`btn ${activeTab === 'users' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setActiveTab('users')}>User Matrix</button>
        <button className={`btn ${activeTab === 'projects' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setActiveTab('projects')}>Projects</button>
        <button className={`btn ${activeTab === 'departments' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setActiveTab('departments')}>Departments</button>
        <button className={`btn ${activeTab === 'expenseTypes' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setActiveTab('expenseTypes')}>Expense Categories</button>
      </div>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
            <h3 style={{ margin: 0 }}>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Registry</h3>
            <input
              type="text"
              placeholder="🔍 Search records..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ padding: '0.4rem 0.8rem', borderRadius: '4px', border: '1px solid #ddd', width: '250px' }}
            />
          </div>
          <button className="btn btn-primary" onClick={() => {
            const newItem = { isNew: true };
            if (activeTab === 'entities') newItem.type = 'entity';
            else if (activeTab === 'users') newItem.type = 'user';
            else if (activeTab === 'projects') newItem.type = 'project';
            else if (activeTab === 'departments') newItem.type = 'department';
            else if (activeTab === 'expenseTypes') newItem.type = 'expenseType';
            setEditingItem(newItem);
          }}>+ Add {activeTab.slice(0, -1)}</button>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '2px solid #eee' }}>
              {activeTab === 'entities' && <><th>Logo</th><th>Name</th><th>Code</th><th>Location</th></>}
              {activeTab === 'users' && <><th>Name</th><th>Email</th><th>Roles</th><th>Entity</th></>}
              {activeTab === 'projects' && <><th>Project Name</th><th>Code</th></>}
              {activeTab === 'departments' && <><th>Department Name</th><th>Code</th></>}
              {activeTab === 'expenseTypes' && <><th>Category</th><th>G/L Account</th><th>VAT %</th></>}
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {activeTab === 'entities' && filtered(entities).map(e => (
              <tr key={e.id} style={{ borderBottom: '1px solid #f9f9f9' }}>
                <td style={{ fontSize: '1.5rem' }}>{e.logo || '🏢'}</td>
                <td><strong>{e.name}</strong></td>
                <td><code>{e.code || e.companyCode}</code></td>
                <td><small>{e.address}, {e.country}</small></td>
                <td><button className="btn btn-outline" onClick={() => setEditingItem({ ...e, type: 'entity' })}>Edit</button></td>
              </tr>
            ))}
            {activeTab === 'users' && filtered(users).map(u => (
              <tr key={u.id} style={{ borderBottom: '1px solid #f9f9f9' }}>
                <td><strong>{u.name}</strong></td>
                <td><small>{u.email}</small></td>
                <td>{renderRoles(u.roles)}</td>
                <td>{entities.find(e => e.id == u.entityId)?.name || 'N/A'}</td>
                <td><button className="btn btn-outline" onClick={() => setEditingItem({ ...u, type: 'user' })}>Edit</button></td>
              </tr>
            ))}
            {activeTab === 'projects' && filtered(projects).map(p => (
              <tr key={p.id} style={{ borderBottom: '1px solid #f9f9f9' }}>
                <td><strong>{p.name}</strong></td>
                <td><code>{p.code}</code></td>
                <td>
                  <button className="btn btn-outline" style={{ marginRight: '0.5rem' }} onClick={() => setEditingItem({ ...p, type: 'project' })}>Edit</button>
                  <button className="btn btn-outline" style={{ color: 'var(--error)' }} onClick={() => onDeleteItem('projects', p.id)}>Delete</button>
                </td>
              </tr>
            ))}
            {activeTab === 'departments' && filtered(departments).map(d => (
              <tr key={d.id} style={{ borderBottom: '1px solid #f9f9f9' }}>
                <td><strong>{d.name}</strong></td>
                <td><code>{d.code}</code></td>
                <td>
                  <button className="btn btn-outline" style={{ marginRight: '0.5rem' }} onClick={() => setEditingItem({ ...d, type: 'department' })}>Edit</button>
                  <button className="btn btn-outline" style={{ color: 'var(--error)' }} onClick={() => onDeleteItem('departments', d.id)}>Delete</button>
                </td>
              </tr>
            ))}
            {activeTab === 'expenseTypes' && filtered(expenseTypes).map(t => (
              <tr key={t.id} style={{ borderBottom: '1px solid #f9f9f9' }}>
                <td><strong>{t.label}</strong></td>
                <td><code>{t.defaultAccount}</code></td>
                <td>{t.defaultVat}%</td>
                <td>
                  <button className="btn btn-outline" style={{ marginRight: '0.5rem' }} onClick={() => setEditingItem({ ...t, type: 'expenseType' })}>Edit</button>
                  <button className="btn btn-outline" style={{ color: 'var(--error)' }} onClick={() => onDeleteItem('expenseTypes', t.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editingItem && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000 }}>
          <div className="card" style={{ width: '600px', maxHeight: '90vh', overflowY: 'auto', padding: '2rem' }}>
            <h2 style={{ marginBottom: '1.5rem' }}>{editingItem.isNew ? 'Register' : 'Manage'} {editingItem.type}</h2>

            <div style={{ display: 'grid', gap: '1rem' }}>
              {(editingItem.type === 'entity' || editingItem.type === 'user' || editingItem.type === 'project' || editingItem.type === 'department') && (
                <div className="form-group">
                  <label>Display Name</label>
                  <input value={editingItem.name || ''} onChange={e => setEditingItem({ ...editingItem, name: e.target.value })} placeholder="Enter name..." />
                </div>
              )}

              {editingItem.type === 'entity' && (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group"><label>Company Code</label><input value={editingItem.code || editingItem.companyCode || ''} onChange={e => setEditingItem({ ...editingItem, code: e.target.value, companyCode: e.target.value })} /></div>
                    <div className="form-group"><label>Logo (Emoji or URL)</label><input value={editingItem.logo || ''} onChange={e => setEditingItem({ ...editingItem, logo: e.target.value })} /></div>
                  </div>
                  <div className="form-group"><label>Address</label><input value={editingItem.address || ''} onChange={e => setEditingItem({ ...editingItem, address: e.target.value })} /></div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group"><label>Country</label><input value={editingItem.country || ''} onChange={e => setEditingItem({ ...editingItem, country: e.target.value })} /></div>
                    <div className="form-group"><label>Country ISO3</label><input value={editingItem.countryIso3 || ''} onChange={e => setEditingItem({ ...editingItem, countryIso3: e.target.value })} /></div>
                  </div>
                  <div className="form-group">
                    <label style={{ fontWeight: 'bold' }}>Mandatory Fields</label>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <input type="checkbox" checked={editingItem.mandatoryFields?.project} onChange={e => setEditingItem({ ...editingItem, mandatoryFields: { ...editingItem.mandatoryFields, project: e.target.checked } })} /> Project
                      </label>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <input type="checkbox" checked={editingItem.mandatoryFields?.department} onChange={e => setEditingItem({ ...editingItem, mandatoryFields: { ...editingItem.mandatoryFields, department: e.target.checked } })} /> Department
                      </label>
                    </div>
                  </div>
                  <div className="form-group" style={{ marginTop: '1rem' }}>
                    <label style={{ fontWeight: 'bold' }}>Entity Accounting Studio (G/L & VAT) 🗺️</label>
                    <div style={{ border: '1px solid #eee', borderRadius: '4px', marginTop: '0.4rem', maxHeight: '250px', overflowY: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                        <thead style={{ background: '#f8f8f8', position: 'sticky', top: 0 }}>
                          <tr style={{ textAlign: 'left' }}>
                            <th style={{ padding: '0.5rem' }}>Global Category</th>
                            <th style={{ padding: '0.5rem' }}>G/L Account</th>
                            <th style={{ padding: '0.5rem' }}>VAT %</th>
                          </tr>
                        </thead>
                        <tbody>
                          {expenseTypes.map(t => (
                            <tr key={t.id} style={{ borderTop: '1px solid #eee' }}>
                              <td style={{ padding: '0.4rem 0.5rem' }}>{t.label}</td>
                              <td style={{ padding: '0.4rem 0.5rem' }}>
                                <input
                                  style={{ width: '85px', padding: '0.2rem', border: '1px solid #ddd', borderRadius: '3px' }}
                                  value={editingItem.expenseMappings?.[t.id]?.glAccount || ''}
                                  onChange={e => {
                                    const next = { ...(editingItem.expenseMappings || {}) };
                                    next[t.id] = { ...(next[t.id] || {}), glAccount: e.target.value };
                                    setEditingItem({ ...editingItem, expenseMappings: next });
                                  }}
                                  placeholder="Code..."
                                />
                              </td>
                              <td style={{ padding: '0.4rem 0.5rem' }}>
                                <input
                                  type="number"
                                  style={{ width: '60px', padding: '0.2rem', border: '1px solid #ddd', borderRadius: '3px' }}
                                  value={editingItem.expenseMappings?.[t.id]?.vatRate || 0}
                                  onChange={e => {
                                    const next = { ...(editingItem.expenseMappings || {}) };
                                    next[t.id] = { ...(next[t.id] || {}), vatRate: parseFloat(e.target.value) || 0 };
                                    setEditingItem({ ...editingItem, expenseMappings: next });
                                  }}
                                />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}

              {editingItem.type === 'user' && (
                <>
                  <div className="form-group"><label>Email Address</label><input type="email" value={editingItem.email || ''} onChange={e => setEditingItem({ ...editingItem, email: e.target.value })} /></div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group">
                      <label>Primary Entity</label>
                      <select value={editingItem.entityId || ''} onChange={e => setEditingItem({ ...editingItem, entityId: e.target.value })}>
                        <option value="">Select Entity</option>
                        {entities.map(en => <option key={en.id} value={en.id}>{en.name}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Direct Approver</label>
                      <select value={editingItem.approverId || ''} onChange={e => setEditingItem({ ...editingItem, approverId: e.target.value })}>
                        <option value="">No Approver</option>
                        {users.filter(u => u.id !== editingItem.id).map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="form-group">
                    <label style={{ fontWeight: 'bold' }}>Permissions & Roles</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                      {AVAILABLE_ROLES.map(role => (
                        <label key={role} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem', background: '#f5f5f5', borderRadius: '4px' }}>
                          <input
                            type="checkbox"
                            checked={Array.isArray(editingItem.roles) ? editingItem.roles.includes(role) : editingItem.roles === role}
                            onChange={e => {
                              const currentRoles = Array.isArray(editingItem.roles) ? editingItem.roles : [editingItem.roles];
                              const next = e.target.checked ? [...currentRoles, role] : currentRoles.filter(r => r !== role);
                              setEditingItem({ ...editingItem, roles: next });
                            }}
                          /> {role}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="form-group">
                    <label style={{ fontWeight: 'bold' }}>Cross-Entity Approvals (Explicit Assignments)</label>
                    <div style={{ maxHeight: '100px', overflowY: 'auto', border: '1px solid #eee', padding: '0.5rem' }}>
                      {entities.map(e => (
                        <label key={e.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '2px 0' }}>
                          <input
                            type="checkbox"
                            checked={editingItem.assignedEntities?.includes(e.id)}
                            onChange={ev => {
                              const existing = editingItem.assignedEntities || [];
                              const next = ev.target.checked ? [...existing, e.id] : existing.filter(id => id !== e.id);
                              setEditingItem({ ...editingItem, assignedEntities: next });
                            }}
                          /> {e.name}
                        </label>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Per-Entity Configuration Panel */}
              {editingItem.type === 'user' && (
                <div className="form-group" style={{ marginTop: '1rem', borderTop: '2px solid #eee', paddingTop: '1rem' }}>
                  <label style={{ fontWeight: 'bold' }}>Per-Entity Configuration (Approvers & Accountants)</label>
                  <p style={{ fontSize: '0.75rem', color: '#666' }}>Configure approvers or set user as accountant for each assigned entity.</p>
                  <div style={{ display: 'grid', gap: '0.8rem', marginTop: '0.5rem' }}>
                    {(editingItem.assignedEntities || []).map(entId => {
                      const ent = entities.find(e => e.id === entId);
                      const multiCfg = editingItem.multiEntityConfig?.[entId] ||
                        userEntityApprovers?.find(ua => ua.user_id === editingItem.id && ua.entity_id === entId) || {};
                      return (
                        <div key={entId} style={{ background: '#fcfcfc', border: '1px solid #ddd', padding: '0.8rem', borderRadius: '4px', display: 'grid', gridTemplateColumns: 'minmax(120px, 1fr) 2fr auto', gap: '1rem', alignItems: 'center' }}>
                          <strong style={{ fontSize: '0.85rem' }}>{ent?.name || entId}</strong>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <label style={{ fontSize: '0.75rem', whiteSpace: 'nowrap' }}>Approver:</label>
                            <select
                              style={{ padding: '0.2rem', fontSize: '0.8rem', width: '100%' }}
                              value={multiCfg.approver_id || ''}
                              onChange={e => {
                                const config = { ...(editingItem.multiEntityConfig || {}) };
                                config[entId] = { ...multiCfg, approver_id: e.target.value };
                                setEditingItem({ ...editingItem, multiEntityConfig: config });
                              }}>
                              <option value="">None</option>
                              {users.filter(u => u.id !== editingItem.id).map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                            </select>
                          </div>
                          <label style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                            <input
                              type="checkbox"
                              checked={multiCfg.is_accountant || false}
                              onChange={e => {
                                const config = { ...(editingItem.multiEntityConfig || {}) };
                                config[entId] = { ...multiCfg, is_accountant: e.target.checked };
                                setEditingItem({ ...editingItem, multiEntityConfig: config });
                              }}
                            /> Is Accountant
                          </label>
                        </div>
                      );
                    })}
                    {!(editingItem.assignedEntities?.length > 0) && <p style={{ fontSize: '0.8rem', fontStyle: 'italic', color: '#999' }}>Assign entities to configure approvers.</p>}
                  </div>
                </div>
              )}

              {(editingItem.type === 'project' || editingItem.type === 'department') && (
                <div className="form-group"><label>Reference Code</label><input value={editingItem.code || ''} onChange={e => setEditingItem({ ...editingItem, code: e.target.value })} /></div>
              )}

              {editingItem.type === 'expenseType' && (
                <>
                  <div className="form-group"><label>Category Label</label><input value={editingItem.label || ''} onChange={e => setEditingItem({ ...editingItem, label: e.target.value })} /></div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="form-group"><label>G/L Account</label><input value={editingItem.defaultAccount || ''} onChange={e => setEditingItem({ ...editingItem, defaultAccount: e.target.value })} /></div>
                    <div className="form-group"><label>Default VAT (%)</label><input type="number" value={editingItem.defaultVat || 0} onChange={e => setEditingItem({ ...editingItem, defaultVat: e.target.value })} /></div>
                  </div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input type="checkbox" checked={editingItem.requiresEntertainment} onChange={e => setEditingItem({ ...editingItem, requiresEntertainment: e.target.checked })} /> Requires Entertainment Details
                  </label>
                </>
              )}
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '2rem' }}>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleSave}>Confirm & Sync</button>
              <button className="btn btn-outline" onClick={() => setEditingItem(null)}>Discard</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- MAIN APP ---

function App() {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('expenseApp_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [view, setView] = useState(() => {
    return localStorage.getItem('expenseApp_view') || 'dashboard';
  });
  const [claims, setClaims] = useState([]);
  const [entities, setEntities] = useState([]);
  const [expenseTypes, setExpenseTypes] = useState([]);
  const [projects, setProjects] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [users, setUsers] = useState([]);
  const [receipts, setReceipts] = useState([]);
  const [userEntityApprovers, setUserEntityApprovers] = useState([]);
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [importedClaim, setImportedClaim] = useState(null);
  const [loading, setLoading] = useState(false);
  const [previewReceipt, setPreviewReceipt] = useState(null);

  useEffect(() => {
    if (user) {
      localStorage.setItem('expenseApp_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('expenseApp_user');
      localStorage.removeItem('expenseApp_view');
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      localStorage.setItem('expenseApp_view', view);
    }
  }, [view, user]);

  useEffect(() => {
    // Ensure all paths resolve to root for this SPA
    if (window.location.pathname !== '/' && window.location.pathname !== '/index.html') {
      window.history.replaceState({}, '', '/');
    }
    fetchGlobalData();
  }, []);

  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user]);

  const fetchGlobalData = async () => {
    try {
      const [eRes, uRes, pRes, dRes, tRes, ueaRes] = await Promise.all([
        supabase.from('entities').select('*'),
        supabase.from('users').select('*'),
        supabase.from('projects').select('*'),
        supabase.from('departments').select('*'),
        supabase.from('expense_types').select('*'),
        supabase.from('user_entity_approvers').select('*')
      ]);

      const errors = [eRes.error, uRes.error, pRes.error, dRes.error, tRes.error, ueaRes.error].filter(Boolean);
      if (errors.length > 0) {
        console.error('Supabase Global Fetch Errors:', errors);
        const tableMissing = errors.some(e => e.code === '42P01');
        if (tableMissing) {
          alert('⚠️ SUPABASE SETUP REQUIRED: The database tables were not found. Please run "supabase_schema.sql" in your Supabase SQL Editor.');
        } else {
          alert('⚠️ SUPABASE CONNECTION ERROR: ' + errors[0].message);
        }
        return;
      }

      if (eRes.data) setEntities(eRes.data.map(e => ({
        ...e,
        mandatoryFields: e.mandatory_fields,
        expenseMappings: e.expense_mappings
      })));
      if (uRes.data) setUsers(uRes.data.map(u => ({
        ...u,
        entityId: u.entity_id,
        approverId: u.approver_id,
        assignedEntities: u.assigned_entities || []
      })));
      if (pRes.data) setProjects(pRes.data);
      if (dRes.data) setDepartments(dRes.data);
      if (tRes.data) setExpenseTypes(tRes.data.map(t => ({
        ...t,
        defaultAccount: t.default_account,
        defaultVat: t.default_vat,
        requiresEntertainment: t.requires_entertainment
      })));
      if (ueaRes.data) setUserEntityApprovers(ueaRes.data);
    } catch (err) {
      console.warn('Supabase fetch failed, falling back to local mocks', err);
    }
  };

  const fetchUserData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const isFin = user.roles.includes('ACCOUNTANT') || user.roles.includes('ADMIN');
      const isMgr = user.roles.includes('MANAGER');

      // Fetch claims: staff only see their own, managers/finance fetch all here but filtered later
      let claimsQuery = supabase.from('claims').select('*, expense_items(*)');
      if (!isFin && !isMgr) {
        claimsQuery = claimsQuery.eq('user_id', user.id);
      }

      const [cRes, rRes] = await Promise.all([
        claimsQuery,
        supabase.from('receipts').select('*').eq('user_id', user.id).eq('status', 'UNALLOCATED')
      ]);

      if (cRes.data) {
        let visibleClaims = cRes.data;
        if (isFin || isMgr) {
          visibleClaims = cRes.data.filter(c => {
            if (c.user_id === user.id) return true; // Own claims

            // Check if user is accountant for this entity
            const isAccForEntity = userEntityApprovers.some(ua => ua.user_id === user.id && ua.entity_id === c.entity_id && ua.is_accountant);
            if (isFin && isAccForEntity && c.claim_status !== 'NEW') return true;

            // Check if user is approver for this staff member in this entity
            const isApprForUser = userEntityApprovers.some(ua => ua.approver_id === user.id && ua.user_id === c.user_id && ua.entity_id === c.entity_id);
            if (isMgr && isApprForUser && c.claim_status !== 'NEW') return true;

            // Optional fallback for legacy direct relationships
            if (isFin && user.roles.includes('ADMIN')) return true;

            return false;
          });
        }

        setClaims(visibleClaims.map(c => ({
          ...c,
          userId: c.user_id,
          entityId: c.entity_id,
          currency: c.currency,
          claimStatus: c.claim_status,
          approvalStatus: c.approval_status,
          expenses: (c.expense_items || []).map(e => ({
            ...e,
            backlogId: e.backlog_id
          }))
        })));
      }
      if (rRes.data) setReceipts(rRes.data);
    } catch (err) {
      console.error('User data fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchData = () => {
    fetchGlobalData();
    if (user) fetchUserData();
  };

  const handleSaveAdminItem = async (collection, item) => {
    try {
      const { isNew, type, ...payload } = item;

      // Reverse Map for Supabase
      const dbPayload = { ...payload };
      if (collection === 'entities') {
        if (payload.mandatoryFields) {
          dbPayload.mandatory_fields = payload.mandatoryFields;
          delete dbPayload.mandatoryFields;
        }
        if (payload.expenseMappings) {
          dbPayload.expense_mappings = payload.expenseMappings;
          delete dbPayload.expenseMappings;
        }
      } else if (collection === 'users') {
        if (payload.entityId) {
          dbPayload.entity_id = payload.entityId;
          delete dbPayload.entityId;
        }
        if (payload.approverId) {
          dbPayload.approver_id = payload.approverId;
          delete dbPayload.approverId;
        }
        if (payload.assignedEntities) {
          dbPayload.assigned_entities = payload.assignedEntities;
          delete dbPayload.assignedEntities;
        }
        if (payload.multiEntityConfig) {
          delete dbPayload.multiEntityConfig;
        }
      } else if (collection === 'expense_types') {
        if (payload.defaultAccount) {
          dbPayload.default_account = payload.defaultAccount;
          delete dbPayload.defaultAccount;
        }
        if (payload.defaultVat) {
          dbPayload.default_vat = payload.defaultVat;
          delete dbPayload.defaultVat;
        }
        if (payload.requiresEntertainment !== undefined) {
          dbPayload.requires_entertainment = payload.requiresEntertainment;
          delete dbPayload.requiresEntertainment;
        }
      }

      const { error } = await supabase
        .from(collection)
        .upsert(dbPayload);

      if (error) {
        alert('Save failed: ' + error.message);
      } else {
        // Handle User Entity Approvers Multi-saving
        if (collection === 'users' && payload.multiEntityConfig) {
          const ueaPayloads = Object.entries(payload.multiEntityConfig).map(([entId, cfg]) => ({
            id: cfg.id || undefined, // undefined will trigger uuid generation
            user_id: dbPayload.id || item.id, // For new users, relies on upsert return, but simple client uses item logic
            entity_id: entId,
            approver_id: cfg.approver_id || null,
            is_accountant: cfg.is_accountant || false,
            is_active: true
          }));

          for (const uea of ueaPayloads) {
            await supabase.from('user_entity_approvers').upsert(uea);
          }
        }
        await fetchData();
      }
    } catch (err) {
      console.error('Admin save error:', err);
      alert('Network error during admin save');
    }
  };

  const handleDeleteAdminItem = async (collection, id) => {
    try {
      const { error } = await supabase
        .from(collection)
        .delete()
        .eq('id', id);

      if (error) {
        alert('Delete failed: ' + error.message);
      } else {
        await fetchData();
      }
    } catch (err) {
      console.error('Admin delete error:', err);
      alert('Network error during admin delete');
    }
  };

  const handleSaveClaim = async (claimData) => {
    try {
      const { expenses, ...claimBase } = claimData;

      const dbBase = { ...claimBase };
      if (dbBase.advanceAmount !== undefined) {
        dbBase.advance_amount = dbBase.advanceAmount;
        delete dbBase.advanceAmount;
      }
      if (dbBase.claimStatus !== undefined) {
        dbBase.claim_status = dbBase.claimStatus;
        delete dbBase.claimStatus;
      }
      if (dbBase.approvalStatus !== undefined) {
        dbBase.approval_status = dbBase.approvalStatus;
        delete dbBase.approvalStatus;
      }
      if (dbBase.entityId !== undefined) {
        dbBase.entity_id = dbBase.entityId;
        delete dbBase.entityId;
      }

      // 1. Save Claim Base
      const { data: claim, error: cErr } = await supabase
        .from('claims')
        .upsert({
          ...dbBase,
          user_id: user.id,
          submission_date: dbBase.claim_status === CLAIM_STATUS.SUBMITTED ? new Date() : (dbBase.submission_date || new Date())
        })
        .select()
        .single();

      if (cErr) throw cErr;

      // 2. Save Normalized Expenses
      if (expenses && expenses.length > 0) {
        // Delete old expenses if updating
        await supabase.from('expense_items').delete().eq('claim_id', claim.id);

        const expensePayload = expenses.map(e => ({
          ...e,
          claim_id: claim.id,
          id: e.id && String(e.id).includes('.') ? e.id : String(Date.now() + Math.random()) // Ensure unique IDs
        }));
        const { error: eErr } = await supabase.from('expense_items').insert(expensePayload);
        if (eErr) throw eErr;
      }

      // 3. Clean up allocated receipts
      const allocatedBacklogIds = (expenses || []).filter(e => e.backlogId).map(e => e.backlogId);
      if (allocatedBacklogIds.length > 0) {
        await supabase.from('receipts').delete().in('id', allocatedBacklogIds);
      }

      await fetchData();
      setView('dashboard');
      setImportedClaim(null);
    } catch (err) {
      console.error('Save error:', err);
      alert('Network error during save: ' + (err.message || 'Unknown error'));
    }
  };

  const handleStatusUpdate = async (id, update) => {
    try {
      // 1. Get current claim for history
      const { data: current } = await supabase.from('claims').select('*').eq('id', id).single();
      const newHistory = [...(current?.history || []), {
        timestamp: new Date().toISOString(),
        actorId: user.id,
        ...update
      }];

      // 2. Update status and history
      const { error } = await supabase
        .from('claims')
        .update({ ...update, history: newHistory })
        .eq('id', id);

      if (error) {
        alert('Action failed: ' + error.message);
        return;
      }
      await fetchData();
      setSelectedClaim(null);
    } catch (err) {
      alert('Network error during update');
    }
  };

  if (!user) return <LoginPage users={users.length > 0 ? users : INITIAL_USERS} onLogin={setUser} />;

  const userEntity = entities.find(e => e.id == user.entityId);

  return (
    <div className="layout">
      <Sidebar user={user} currentView={view} onViewChange={(v) => {
        setView(v);
        setSelectedClaim(null);
        if (v === 'new-claim' || v === 'receipts-backlog') fetchData();
      }} onLogout={() => setUser(null)} />
      <main className="main-content">
        {view === 'dashboard' && (
          <div className="view">
            <h2>System Overview</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginTop: '1.5rem' }}>
              <div className="card"><h4>New/Draft</h4><p>{claims.filter(c => c.claimStatus === CLAIM_STATUS.NEW && c.userId == user.id).length || 0}</p></div>
              <div className="card" style={{ cursor: 'pointer', border: '1px solid var(--primary)' }} onClick={() => setView('receipts-backlog')}>
                <h4>Floating Receipts</h4>
                <p style={{ color: 'var(--primary)', fontWeight: 'bold' }}>{receipts.length || 0}</p>
                <small style={{ color: '#666' }}>Click to Allocate →</small>
              </div>
              <div className="card"><h4>Action Required</h4><p>{claims.filter(c => c.approvalStatus === APPROVAL_STATUS.PENDING).length || 0}</p></div>
              <div className="card"><h4>Completed</h4><p>{claims.filter(c => c.claimStatus === CLAIM_STATUS.CLOSED).length || 0}</p></div>
            </div>
          </div>
        )}

        {view === 'my-claims' && !selectedClaim && (
          <div className="view">
            <div className="header"><h2>My Expense Claims</h2><button className="btn btn-primary" onClick={() => setView('new-claim')}>+ Create New</button></div>
            <div className="card">
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr style={{ textAlign: 'left' }}><th>Title</th><th>Total</th><th>Claim Status</th><th>Approval</th><th>Action</th></tr></thead>
                <tbody>{claims.filter(c => c.userId == user.id).map(c => (
                  <tr key={c.id}>
                    <td style={{ padding: '1rem 0' }}>{c.title}</td>
                    <td style={{ fontWeight: 'bold' }}>€{c.expenses.reduce((acc, e) => acc + Number(e.amount), 0).toFixed(2)}</td>
                    <td><span className={`badge badge-${c.claimStatus.toLowerCase()}`}>{c.claimStatus}</span></td>
                    <td><span className={`badge badge-${c.approvalStatus.replace(' ', '-').toLowerCase()}`}>{c.approvalStatus}</span></td>
                    <td><button className="btn btn-outline" onClick={() => setSelectedClaim(c)}>View History</button></td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          </div>
        )}

        {selectedClaim && (
          <DetailView
            claim={selectedClaim}
            owner={users.find(u => u.id == selectedClaim.userId)}
            currentUser={user}
            entity={entities.find(e => e.id == selectedClaim.entityId)}
            onBack={() => setSelectedClaim(null)}
            onStatusUpdate={handleStatusUpdate}
            onEdit={(draft) => { setImportedClaim(draft); setView('new-claim'); setSelectedClaim(null); }}
            onSave={(c) => handleSaveClaim(c)}
            mode={user.roles.includes('ACCOUNTANT') || user.roles.includes('ADMIN') ? 'finance' : (user.roles.includes('MANAGER') ? 'manager' : 'staff')}
            expenseTypes={expenseTypes}
          />
        )}

        {view === 'new-claim' && user && (
          <ClaimForm
            user={user}
            claim={importedClaim}
            entities={entities.filter(e => e.id === user.entityId || userEntityApprovers.some(ua => ua.user_id === user.id && ua.entity_id === e.id))}
            expenseTypes={expenseTypes}
            projects={projects}
            departments={departments}
            receipts={receipts}
            onCancel={() => { setView('dashboard'); setImportedClaim(null); }}
            onSave={handleSaveClaim}
            onDraft={handleSaveClaim}
            onPreview={setPreviewReceipt}
          />
        )}

        {view === 'receipts-backlog' && (
          <ReceiptBacklog
            user={user}
            onAllocate={(r) => {
              const draft = {
                id: 'DRAFT-' + Date.now(),
                title: `Claim for ${r.file_name}`,
                userId: user.id,
                entityId: user.entityId,
                expenses: [{
                  id: Date.now(),
                  type: r.vendor_suggestion === 'Starbucks' ? 'Entertainment' : 'Other',
                  amount: r.amount_suggestion,
                  currency: 'EUR',
                  description: `Imported from ${r.file_name}`,
                  payment: 'REIMBURSABLE',
                  receipt: r.file_name,
                  backlogId: r.id
                }]
              };
              setImportedClaim(draft);
              setView('new-claim');
            }}
            onBack={() => setView('dashboard')}
          />
        )}

        {view === 'imports' && <ImportPortal entities={entities} user={user} onImportComplete={(draft) => { setImportedClaim(draft); setView('new-claim'); }} />}

        {view === 'finance' && !selectedClaim && (
          <div className="view">
            <div className="header"><h2>Finance Audit Portal</h2></div>

            {/* Entity Traffic Indicators (PRD 8.0) */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginTop: '1.5rem' }}>
              {entities.map(e => {
                const total = claims.filter(c => c.entityId == e.id && c.claimStatus !== 'NEW').length;
                const closed = claims.filter(c => c.entityId == e.id && c.claimStatus === 'CLOSED').length;
                const progress = total > 0 ? (closed / total) * 100 : 0;
                return (
                  <div key={e.id} className="card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <strong>{e.name} Progress</strong>
                      <small>{closed}/{total} Synced</small>
                    </div>
                    <div style={{ height: '8px', background: '#eee', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ width: `${progress}%`, height: '100%', background: 'var(--primary)', transition: 'width 0.3s' }}></div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="card" style={{ marginTop: '1.5rem' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr style={{ textAlign: 'left' }}><th>Staff</th><th>Title</th><th>Claim Status</th><th>Action</th></tr></thead>
                <tbody>{claims.filter(c => c.claimStatus !== CLAIM_STATUS.NEW).map(c => (
                  <tr key={c.id}>
                    <td>{users.find(u => u.id == c.userId)?.name}</td>
                    <td>{c.title}</td>
                    <td>{c.claimStatus}</td>
                    <td><button className="btn btn-outline" onClick={() => setSelectedClaim(c)}>Audit Detail</button></td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          </div>
        )}

        {view === 'approvals' && !selectedClaim && (
          <div className="view">
            <div className="header">
              <h2>Approvals Center</h2>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className={`btn btn-${view === 'approvals' ? 'primary' : 'outline'}`} onClick={() => setView('approvals')}>Queue</button>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', marginTop: '1.5rem' }}>
              <div>
                <h3>Pending Approvals</h3>
                <div className="card" style={{ marginTop: '0.5rem' }}>
                  {claims.filter(c => c.approvalStatus === APPROVAL_STATUS.PENDING).map(c => (
                    <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '1rem 0', borderBottom: '1px solid #f0f0f0', alignItems: 'center' }}>
                      <div>
                        <strong>{c.title}</strong> by {users.find(u => u.id == c.userId)?.name}
                        <div style={{ fontSize: '0.75rem', color: '#666' }}>Submitted: {new Date(c.id.split('-')[1] || Date.now()).toLocaleDateString()}</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <span className="badge badge-pending">PENDING</span>
                        <button className="btn btn-primary" onClick={() => setSelectedClaim(c)}>Review Details</button>
                      </div>
                    </div>
                  ))}
                  {claims.filter(c => c.approvalStatus === APPROVAL_STATUS.PENDING).length === 0 && (
                    <p style={{ textAlign: 'center', padding: '2rem', color: '#888' }}>No pending approvals.</p>
                  )}
                </div>
              </div>

              <div>
                <h3>Processed History</h3>
                <div className="card" style={{ marginTop: '0.5rem', maxHeight: 'calc(100vh - 300px)', overflowY: 'auto' }}>
                  {claims.filter(c => c.approvalStatus !== APPROVAL_STATUS.PENDING && c.claimStatus !== CLAIM_STATUS.NEW).map(c => (
                    <div key={c.id} style={{ padding: '0.75rem 0', borderBottom: '1px solid #f0f0f0' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <strong style={{ fontSize: '0.85rem' }}>{c.title}</strong>
                        <span className={`badge badge-${c.approvalStatus.replace(' ', '-').toLowerCase()}`} style={{ fontSize: '0.65rem' }}>{c.approvalStatus}</span>
                      </div>
                      <div style={{ fontSize: '0.7rem', color: '#888', marginTop: '4px' }}>By: {users.find(u => u.id == c.userId)?.name}</div>
                      <button className="btn btn-outline" style={{ fontSize: '0.7rem', width: '100%', marginTop: '8px', padding: '2px' }} onClick={() => setSelectedClaim(c)}>View Audit Details</button>
                    </div>
                  ))}
                  {claims.filter(c => c.approvalStatus !== APPROVAL_STATUS.PENDING && c.claimStatus !== CLAIM_STATUS.NEW).length === 0 && (
                    <p style={{ textAlign: 'center', color: '#aaa', fontSize: '0.8rem' }}>No history yet.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {view === 'admin' && (
          <AdminCenter
            entities={entities}
            users={users}
            projects={projects}
            departments={departments}
            expenseTypes={expenseTypes}
            userEntityApprovers={userEntityApprovers}
            onSaveItem={handleSaveAdminItem}
            onDeleteItem={handleDeleteAdminItem}
          />
        )}

        {/* Global Receipt Preview Modal */}
        {previewReceipt && (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', zIndex: 9999, display: 'flex', justifyContent: 'center', alignItems: 'center' }} onClick={() => setPreviewReceipt(null)}>
            <div style={{ background: 'white', padding: '1rem', borderRadius: '8px', minWidth: '300px', maxWidth: '80vw', maxHeight: '80vh', overflow: 'auto', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', borderBottom: '1px solid #eee', paddingBottom: '0.5rem' }}>
                <h3 style={{ margin: 0, color: 'var(--primary)' }}>Receipt Preview</h3>
                <button className="btn btn-outline" style={{ padding: '0.2rem 0.5rem' }} onClick={() => setPreviewReceipt(null)}>Close</button>
              </div>
              <div style={{ padding: '1rem', background: '#fcfcfc', borderRadius: '4px', border: '1px dashed #ccc' }}>
                {localStorage.getItem(`receipt_blob_${previewReceipt}`) ? (
                  <img src={localStorage.getItem(`receipt_blob_${previewReceipt}`)} alt="Receipt" style={{ maxWidth: '100%', maxHeight: '60vh', objectFit: 'contain' }} />
                ) : (
                  <>
                    <span style={{ fontSize: '4rem' }}>📄</span>
                    <h4 style={{ marginTop: '1rem', color: '#444' }}>{previewReceipt}</h4>
                    <p style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.5rem' }}>Local preview simulation. (Files uploaded to Supabase Storage would render directly here.)</p>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
