import { createClient } from '@supabase/supabase-js';

const TIMEOUT_MS = 10000;

async function withTimeout(promise, ms, label = 'Request') {
    const timeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms)
    );
    return Promise.race([promise, timeout]);
}

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!serviceRoleKey) {
        return res.status(500).json({ error: 'SUPABASE_SERVICE_ROLE_KEY is not configured in environment variables.' });
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    });

    const { userId } = req.body;

    if (!userId) {
        return res.status(400).json({ error: 'Missing userId' });
    }

    // 1. Authorization Check (Requester must be an Admin)
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ error: 'Missing or invalid token' });
    }

    try {
        const { data: { user: authUser }, error: authError } = await withTimeout(
            supabaseAdmin.auth.getUser(authHeader.replace('Bearer ', '')),
            TIMEOUT_MS,
            'Auth verification'
        );

        if (authError || !authUser) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        // Check roles in public.users table (Requester's permissions)
        const { data: adminUser, error: roleError } = await withTimeout(
            supabaseAdmin.from('users').select('roles').eq('id', authUser.id).single(),
            TIMEOUT_MS,
            'Role check'
        );

        if (roleError || !adminUser?.roles?.includes('ADMIN')) {
            return res.status(403).json({ error: 'Forbidden: Admin access required' });
        }

        // 2. Perform Password Reset
        console.log(`DEBUG: [reset-password] Resetting password for userId: ${userId}`);
        const { error: resetError } = await withTimeout(
            supabaseAdmin.auth.admin.updateUserById(userId, {
                password: 'DCBIExpense'
            }),
            TIMEOUT_MS,
            'Admin updatePassword'
        );

        if (resetError) throw resetError;

        return res.status(200).json({ success: true, message: 'Password reset to DCBIExpense successfully' });
    } catch (error) {
        console.error('Admin Password Reset Error:', error);
        return res.status(500).json({ error: error.message });
    }
}
