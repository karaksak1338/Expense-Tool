const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'db.json');

const INITIAL_DATA = {
    entities: [
        { id: 'E1', name: 'DCBI Global Ltd.', companyCode: 'D001', address: '123 Business Way, London', country: 'United Kingdom', countryIso3: 'GBR', logoUrl: '🌐', mandatoryFields: { project: true, department: true, costCenter: false } },
        { id: 'E2', name: 'DCBI Core SAS', companyCode: 'C092', address: '45 Finance Ave, Paris', country: 'France', countryIso3: 'FRA', logoUrl: '💳', mandatoryFields: { project: false, department: true, costCenter: true } }
    ],
    users: [
        { id: '1', name: 'Adam Staff', email: 'adam@dcbi.com', roles: ['STAFF'], entityId: 'E1', approverId: '3' },
        { id: '2', name: 'Sarah Accountant', email: 'sarah@dcbi.com', roles: ['ACCOUNTANT'], entityId: 'E1' },
        { id: '3', name: 'Mark Manager', email: 'mark@dcbi.com', roles: ['MANAGER'], entityId: 'E1' },
        { id: '4', name: 'Super Admin', email: 'admin@dcbi.com', roles: ['ADMIN'], entityId: 'E1' }
    ],
    expenseTypes: [
        { id: 'T1', label: 'Flight', entityId: 'E1', defaultAccount: '600100', defaultVatRate: 0, requiresEntertainment: false },
        { id: 'T2', label: 'Hotel', entityId: 'E1', defaultAccount: '600200', defaultVatRate: 7, requiresEntertainment: false },
        { id: 'T3', label: 'Entertainment', entityId: 'E1', defaultAccount: '600300', defaultVatRate: 19, requiresEntertainment: true }
    ],
    claims: [],
    auditLogs: [],
    projects: [
        { id: 'P1', name: 'PRJ-24-XT (Customer X)', code: 'PRJ001' },
        { id: 'P2', name: 'Internal - Marketing', code: 'INT002' }
    ],
    departments: [
        { id: 'D1', name: 'D-SALES', code: 'SALES' },
        { id: 'D2', name: 'D-FINANCE', code: 'FIN' }
    ]
};

class JsonDB {
    constructor() {
        if (!fs.existsSync(DB_PATH)) {
            this.save(INITIAL_DATA);
        }
    }

    read() {
        const data = fs.readFileSync(DB_PATH, 'utf8');
        return JSON.parse(data);
    }

    save(data) {
        fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
    }

    get(collection) {
        return this.read()[collection] || [];
    }

    insert(collection, item) {
        const data = this.read();
        if (!data[collection]) data[collection] = [];
        data[collection].push(item);
        this.save(data);
        return item;
    }

    update(collection, id, updates) {
        const data = this.read();
        const index = data[collection].findIndex(i => i.id == id);
        if (index !== -1) {
            data[collection][index] = { ...data[collection][index], ...updates };
            this.save(data);
            return data[collection][index];
        }
        return null;
    }
}

module.exports = new JsonDB();
