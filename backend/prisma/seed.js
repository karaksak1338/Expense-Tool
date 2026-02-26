const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Seeding DCBI Expense Tool Data (Prisma 5 / SQLite compatible)...');

    // Clear existing data in correct order
    console.log('Clearing old data...');
    try {
        await prisma.auditLog.deleteMany({});
        await prisma.attachment.deleteMany({});
        await prisma.expense.deleteMany({});
        await prisma.expenseClaim.deleteMany({});
        await prisma.expenseType.deleteMany({});
        await prisma.user.deleteMany({});
        await prisma.entity.deleteMany({});
    } catch (e) {
        console.log('Clean slate partially failed, proceeding with seeding...');
    }

    // 1. Entities
    console.log('Creating entities...');
    const e1 = await prisma.entity.create({
        data: {
            id: 'E1',
            name: 'DCBI Global Ltd.',
            companyCode: 'D001',
            address: '123 Business Way, London',
            country: 'United Kingdom',
            countryIso3: 'GBR',
            logoUrl: '🌐',
            mandatoryFields: JSON.stringify({ project: true, department: true, costCenter: false })
        }
    });

    const e2 = await prisma.entity.create({
        data: {
            id: 'E2',
            name: 'DCBI Core SAS',
            companyCode: 'C092',
            address: '45 Finance Ave, Paris',
            country: 'France',
            countryIso3: 'FRA',
            logoUrl: '💳',
            mandatoryFields: JSON.stringify({ project: false, department: true, costCenter: true })
        }
    });

    // 2. Users
    console.log('Creating users...');
    await prisma.user.create({ data: { id: '4', name: 'Super Admin', email: 'admin@dcbi.com', roles: 'ADMIN', entityId: 'E1' } });
    await prisma.user.create({ data: { id: '3', name: 'Mark Manager', email: 'mark@dcbi.com', roles: 'MANAGER', entityId: 'E1' } });
    await prisma.user.create({ data: { id: '1', name: 'Adam Staff', email: 'adam@dcbi.com', roles: 'STAFF', entityId: 'E1', approverId: '3' } });
    await prisma.user.create({ data: { id: '2', name: 'Sarah Accountant', email: 'sarah@dcbi.com', roles: 'ACCOUNTANT', entityId: 'E1' } });

    console.log('Creating expense types...');
    await prisma.expenseType.createMany({
        data: [
            { label: 'Flight', entityId: 'E1', defaultAccount: '600100', defaultVatRate: 0, requiresEntertainment: false },
            { label: 'Hotel', entityId: 'E1', defaultAccount: '600200', defaultVatRate: 7, requiresEntertainment: false },
            { label: 'Entertainment', entityId: 'E1', defaultAccount: '600300', defaultVatRate: 19, requiresEntertainment: true },
        ]
    });

    console.log('Seeding complete.');
}

main()
    .catch((e) => {
        console.error('Seed Error Detail:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
