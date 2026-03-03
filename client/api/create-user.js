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

    const { email, password, name, roles, entityId, approverId, assignedEntities } = req.body;

    // 1. Authorization Check (Requester must be an Admin)
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        console.error("DEBUG: [create-user] Missing Authorization Header");
        return res.status(401).json({ error: 'Missing or invalid token' });
    }

    console.log(`DEBUG: [create-user] Verifying token for ${email}...`);
    let authUser = null;
    try {
        const { data: { user }, error: authError } = await withTimeout(
            supabaseAdmin.auth.getUser(authHeader.replace('Bearer ', '')),
            TIMEOUT_MS,
            'Auth verification'
        );
        if (authError || !user) {
            console.error("DEBUG: [create-user] Auth verification failed:", authError?.message || "User not found");
            return res.status(401).json({ error: 'Unauthorized' });
        }
        authUser = user;
        console.log("DEBUG: [create-user] Token verified for:", authUser.email);
    } catch (err) {
        console.error("DEBUG: [create-user] Verification CRASH or TIMEOUT:", err.message);
        return res.status(504).json({ error: 'Identity verification service timed out. Check Supabase connectivity.' });
    }

    // Check roles in public.users table (Requester's permissions)
    const { data: adminUser, error: roleError } = await withTimeout(
        supabaseAdmin.from('users').select('roles').eq('email', authUser.email).single(),
        TIMEOUT_MS,
        'Role check'
    );

    if (roleError || !adminUser?.roles?.includes('ADMIN')) {
        console.error("DEBUG: [create-user] Forbidden access attempt by:", authUser.email);
        return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }

    try {
        console.log(`DEBUG: [create-user] Attempting to create Auth user: ${email}`);
        // 2. Create user in Supabase Auth
        const { data: newUser, error: createError } = await withTimeout(
            supabaseAdmin.auth.admin.createUser({
                email,
                password: password || 'DCBIExpense',
                email_confirm: true,
                user_metadata: { full_name: name }
            }),
            TIMEOUT_MS,
            'Admin createUser'
        );

        if (createError) throw createError;
        console.log("DEBUG: [create-user] Auth user created successfully:", newUser.user.id);

        // 3. Create profile in public.users
        const { error: profileError } = await supabaseAdmin
            .from('users')
            .insert({
                id: newUser.user.id,
                name,
                email,
                roles: roles || ['STAFF'],
                entity_id: entityId,
                approver_id: approverId,
                assigned_entities: assignedEntities || []
            });

        if (profileError) throw profileError;

        return res.status(200).json({ success: true, user: newUser.user });
    } catch (error) {
        console.error('Admin Create User Error:', error);
        return res.status(500).json({ error: error.message });
    }
}
