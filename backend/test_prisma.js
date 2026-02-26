const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
    try {
        console.log('Testing Prisma Connection...');
        const entityCount = await prisma.entity.count();
        console.log('Current Entity Count:', entityCount);
        const newEntity = await prisma.entity.create({
            data: {
                id: 'TEST_ID_' + Date.now(),
                name: 'Test Entity',
                companyCode: 'TEST' + Date.now(),
            }
        });
        console.log('Entity Created:', newEntity.id);
    } catch (err) {
        console.error('Prisma Error:', err);
    } finally {
        await prisma.$disconnect();
    }
}

test();
