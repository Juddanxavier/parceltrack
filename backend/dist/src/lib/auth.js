/** @format */
import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { admin } from 'better-auth/plugins';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
export const auth = betterAuth({
    database: prismaAdapter(prisma, {
        provider: 'postgresql',
    }),
    emailAndPassword: { enabled: true },
    trustedOrigins: [
        'https://*.hopp.sh',
        'http://localhost:5173',
        'https://insomnia.rest',
        'https://hoppscotch.io/',
        'https://hoppscotch.io/api/auth',
    ],
    session: {
        expiresIn: 60 * 60 * 24 * 7, // 7 days
        updateAge: 60 * 60 * 24, // 1 day
        // cookieCache: { enabled: true, maxAge: 5 * 60 } // Optional: enable for performance
    },
    user: {
        additionalFields: {
            role: {
                type: 'string',
                defaultValue: 'user',
                required: false,
            },
        },
    },
    plugins: [
        admin({
            // Enable built-in admin endpoints
            disableDefaultAdminApi: false,
            // Admin role configuration
            defaultRole: 'user',
            adminRole: 'admin',
            // Disable impersonation (as requested in previous conversation)
            impersonationSessionDuration: 0,
        }),
    ],
});
// Helper function to get session with fresh role data from database
export async function getSessionWithRole(headers) {
    const session = await auth.api.getSession({ headers });
    if (session && session.user) {
        // Get fresh role from database
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { role: true },
        });
        return {
            ...session,
            user: {
                ...session.user,
                role: user?.role || 'user',
            },
        };
    }
    return session;
}
