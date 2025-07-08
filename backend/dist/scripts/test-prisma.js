import { PrismaClient } from '@prisma/client';
async function testPrisma() {
    const prisma = new PrismaClient();
    try {
        // Test the database connection
        await prisma.$connect();
        console.log('✅ Successfully connected to the database');
        // Try a simple query
        const users = await prisma.user.findMany();
        console.log(`Found ${users.length} users in the database`);
    }
    catch (error) {
        console.error('❌ Error connecting to the database:');
        console.error(error);
    }
    finally {
        await prisma.$disconnect();
    }
}
testPrisma();
