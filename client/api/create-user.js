import { createClient } from '@supabase/supabase-js';

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
    if (!authHeader) return res.status(401).json({ error: 'Missing or invalid token' });

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(authHeader.replace('Bearer ', ''));
    if (authError || !user) return res.status(401).json({ error: 'Unauthorized' });

    // Check roles in public.users table
    const { data: adminUser, error: roleError } = await supabaseAdmin
        .from('users')
        .select('roles')
        .eq('email', user.email)
        .single();

    if (roleError || !adminUser?.roles?.includes('ADMIN')) {
        return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }

    try {
        // 2. Create user in Supabase Auth
        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password: password || 'DCBIExpense',
            email_confirm: true,
            user_metadata: { full_name: name }
        });

        if (createError) throw createError;

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
