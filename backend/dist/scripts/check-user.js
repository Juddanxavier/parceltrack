import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
dotenv.config();
const prisma = new PrismaClient();
async function checkUser(email) {
    try {
        const user = await prisma.user.findUnique({
            where: { email },
            select: { id: true, email: true, createdAt: true, updatedAt: true }
        });
        if (user) {
            console.log('✅ User found in database:');
            console.log(`   ID: ${user.id}`);
            console.log(`   Email: ${user.email}`);
            console.log(`   Created: ${user.createdAt}`);
            console.log(`   Updated: ${user.updatedAt}`);
        }
        else {
            console.log('❌ User not found in database');
        }
    }
    catch (error) {
        console.error('Error checking user:', error);
    }
    finally {
        await prisma.$disconnect();
    }
}
const email = process.argv[2];
if (!email) {
    console.error('Usage: npx tsx scripts/check-user.ts <email>');
    process.exit(1);
}
checkUser(email);
