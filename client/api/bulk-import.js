import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!serviceRoleKey) {
        return res.status(500).json({ error: 'SUPABASE_SERVICE_ROLE_KEY is not configured.' });
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
        auth: { autoRefreshToken: false, persistSession: false }
    });

    const { table, data } = req.body;
    if (!table || !Array.isArray(data)) {
        return res.status(400).json({ error: 'Invalid payload: "table" and "data" (array) are required.' });
    }

    // 1. Authorization Check (Requester must be an Admin)
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Missing or invalid token' });

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(authHeader.replace('Bearer ', ''));
    if (authError || !user) return res.status(401).json({ error: 'Unauthorized' });

    const { data: adminUser } = await supabaseAdmin.from('users').select('roles').eq('email', user.email).single();
    if (!adminUser?.roles?.includes('ADMIN')) return res.status(403).json({ error: 'Forbidden: Admin access required' });

    try {
        const results = { imported: 0, failed: 0, errors: [] };

        if (table === 'users') {
            // SPECIAL HANDLING FOR USERS (Requires Auth creation)
            for (const item of data) {
                try {
                    // Create in Supabase Auth
                    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
                        email: item.email,
                        password: item.password || 'DCBIExpense',
                        email_confirm: true,
                        user_metadata: { full_name: item.name }
                    });

                    if (createError) throw createError;

                    // Create Profile
                    const { error: profileError } = await supabaseAdmin
                        .from('users')
                        .insert({
                            id: newUser.user.id,
                            name: item.name,
                            email: item.email,
                            roles: item.roles || ['STAFF'],
                            entity_id: item.entity_id || item.entityId,
                            approver_id: item.approver_id || item.approverId,
                            assigned_entities: item.assigned_entities || item.assignedEntities || []
                        });

                    if (profileError) throw profileError;
                    results.imported++;
                } catch (err) {
                    results.failed++;
                    results.errors.push({ email: item.email, error: err.message });
                }
            }
        } else {
            // GENERIC BULK INSERT FOR OTHER TABLES
            // Note: Upsert allows for overwriting existing records by ID
            const { error: upsertError } = await supabaseAdmin.from(table).upsert(data);
            if (upsertError) throw upsertError;
            results.imported = data.length;
        }

        return res.status(200).json(results);
    } catch (error) {
        console.error('Bulk Import Error:', error);
        return res.status(500).json({ error: error.message });
    }
}
