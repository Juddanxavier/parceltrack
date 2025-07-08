import express from 'express';
import { getSessionWithRole, auth } from '../lib/auth';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
const router = express.Router();
const prisma = new PrismaClient();
// Middleware to check if user is authenticated and is admin
const requireAdmin = async (req, res, next) => {
    try {
        const session = await getSessionWithRole(req.headers);
        if (!session || session.user.role !== 'admin') {
            res.status(403).json({ error: 'Admin access required' });
            return;
        }
        req.user = session.user;
        next();
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};
// Get current user with role info
router.get('/current', async (req, res) => {
    try {
        const session = await getSessionWithRole(req.headers);
        if (!session) {
            res.status(401).json({ error: 'Not authenticated' });
            return;
        }
        res.json({ user: session.user });
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Admin protected route
router.get('/dashboard', requireAdmin, async (req, res) => {
    try {
        res.json({ message: 'Welcome to the admin dashboard!' });
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Get all users (admin only)
router.get('/users', requireAdmin, async (req, res) => {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                createdAt: true,
                updatedAt: true,
            },
            orderBy: { createdAt: 'desc' },
        });
        res.json({ users });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});
// Get user statistics (admin only)
router.get('/users/stats', requireAdmin, async (req, res) => {
    try {
        const [totalUsers, totalAdmins, recentUsers] = await Promise.all([
            prisma.user.count(),
            prisma.user.count({ where: { role: 'admin' } }),
            prisma.user.count({
                where: {
                    createdAt: {
                        gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
                    },
                },
            }),
        ]);
        res.json({
            stats: {
                totalUsers,
                totalAdmins,
                recentUsers,
                totalRegularUsers: totalUsers - totalAdmins,
            },
        });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch user statistics' });
    }
});
// Get single user by ID (admin only)
router.get('/users/:id', requireAdmin, async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.params.id },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                createdAt: true,
                updatedAt: true,
            },
        });
        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }
        res.json({ user });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch user' });
    }
});
// Create new user (admin only)
const createUserSchema = z.object({
    name: z.string().min(1),
    email: z.string().email(),
    password: z.string().min(8),
    role: z.enum(['user', 'admin']).default('user'),
});
router.post('/users', requireAdmin, async (req, res) => {
    try {
        const result = createUserSchema.safeParse(req.body);
        if (!result.success) {
            res.status(400).json({
                error: 'Invalid input',
                details: result.error.errors
            });
            return;
        }
        const { name, email, password, role } = result.data;
        // Check if user with email already exists
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });
        if (existingUser) {
            res.status(409).json({ error: 'User with this email already exists' });
            return;
        }
        // Use Better Auth to create the user properly
        const signUpResult = await auth.api.signUpEmail({
            body: {
                email,
                password,
                name,
            },
        });
        if (!signUpResult) {
            res.status(500).json({ error: 'Failed to create user account' });
            return;
        }
        // Update the role if it's not 'user' (Better Auth creates users with default role)
        if (role !== 'user') {
            await prisma.user.update({
                where: { email },
                data: { role },
            });
        }
        // Fetch the created user
        const newUser = await prisma.user.findUnique({
            where: { email },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                createdAt: true,
                updatedAt: true,
            },
        });
        res.status(201).json({
            message: 'User created successfully',
            user: newUser,
        });
    }
    catch (error) {
        console.error('User creation error:', error);
        res.status(500).json({ error: 'Failed to create user' });
    }
});
// Update user (admin only)
const updateUserSchema = z.object({
    name: z.string().min(1).optional(),
    email: z.string().email().optional(),
    role: z.enum(['user', 'admin']).optional(),
});
router.put('/users/:id', requireAdmin, async (req, res) => {
    try {
        const result = updateUserSchema.safeParse(req.body);
        if (!result.success) {
            res.status(400).json({
                error: 'Invalid input',
                details: result.error.errors
            });
            return;
        }
        const userId = req.params.id;
        const updateData = result.data;
        // Check if user exists
        const existingUser = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, name: true, email: true, role: true },
        });
        if (!existingUser) {
            res.status(404).json({ error: 'User not found' });
            return;
        }
        // Prevent changing own role to avoid lockout
        if (userId === req.user.id && updateData.role && updateData.role !== existingUser.role) {
            res.status(400).json({ error: 'Cannot change your own role' });
            return;
        }
        // If email is being updated, check for conflicts
        if (updateData.email && updateData.email !== existingUser.email) {
            const emailConflict = await prisma.user.findUnique({
                where: { email: updateData.email },
            });
            if (emailConflict) {
                res.status(409).json({ error: 'Email already in use' });
                return;
            }
        }
        // Update user
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: updateData,
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                updatedAt: true,
            },
        });
        res.json({
            message: 'User updated successfully',
            user: updatedUser,
        });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to update user' });
    }
});
// Delete user (admin only)
router.delete('/users/:id', requireAdmin, async (req, res) => {
    try {
        const userId = req.params.id;
        // Check if user exists
        const existingUser = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, name: true, email: true, role: true },
        });
        if (!existingUser) {
            res.status(404).json({ error: 'User not found' });
            return;
        }
        // Prevent deleting own account
        if (userId === req.user.id) {
            res.status(400).json({ error: 'Cannot delete your own account' });
            return;
        }
        // Delete user
        await prisma.user.delete({
            where: { id: userId },
        });
        res.json({
            message: 'User deleted successfully',
            deletedUser: existingUser,
        });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to delete user' });
    }
});
// Change user role (admin only) - keeping the original endpoint for backward compatibility
const changeRoleSchema = z.object({
    userId: z.string(),
    role: z.enum(['user', 'admin']),
});
router.put('/users/:userId/role', requireAdmin, async (req, res) => {
    try {
        const result = changeRoleSchema.safeParse({
            userId: req.params.userId,
            role: req.body.role,
        });
        if (!result.success) {
            res.status(400).json({
                error: 'Invalid input',
                details: result.error.errors
            });
            return;
        }
        const { userId, role } = result.data;
        // Check if user exists
        const existingUser = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, name: true, email: true, role: true },
        });
        if (!existingUser) {
            res.status(404).json({ error: 'User not found' });
            return;
        }
        // Prevent changing own role to avoid lockout
        if (userId === req.user.id) {
            res.status(400).json({ error: 'Cannot change your own role' });
            return;
        }
        // Update user role
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: { role },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                updatedAt: true,
            },
        });
        res.json({
            message: 'Role updated successfully',
            user: updatedUser,
            previousRole: existingUser.role,
        });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to update role' });
    }
});
export default router;
