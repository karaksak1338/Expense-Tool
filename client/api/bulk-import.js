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
    if (!authHeader) {
        console.error("DEBUG: [bulk-import] Missing Authorization Header");
        return res.status(401).json({ error: 'Missing or invalid token' });
    }

    console.log(`DEBUG: [bulk-import] Verifying token for table: ${table}...`);
    let authUser = null;
    try {
        const { data: { user }, error: authError } = await withTimeout(
            supabaseAdmin.auth.getUser(authHeader.replace('Bearer ', '')),
            TIMEOUT_MS,
            'Auth verification'
        );
        if (authError || !user) {
            console.error("DEBUG: [bulk-import] Auth verification failed:", authError?.message || "User not found");
            return res.status(401).json({ error: 'Unauthorized' });
        }
        authUser = user;
    } catch (err) {
        console.error("DEBUG: [bulk-import] Verification CRASH or TIMEOUT:", err.message);
        return res.status(504).json({ error: 'Identity verification service timed out.' });
    }

    const { data: adminUser } = await withTimeout(
        supabaseAdmin.from('users').select('roles').eq('email', authUser.email).single(),
        TIMEOUT_MS,
        'Role check'
    );
    if (!adminUser?.roles?.includes('ADMIN')) {
        console.error("DEBUG: [bulk-import] Forbidden access attempt by:", authUser.email);
        return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }

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
            console.log(`DEBUG: [bulk-import] Generic upsert for ${data.length} records into ${table}...`);
            // GENERIC BULK INSERT FOR OTHER TABLES
            const { error: upsertError } = await withTimeout(
                supabaseAdmin.from(table).upsert(data),
                TIMEOUT_MS * 2,
                'Bulk upsert'
            );
            if (upsertError) throw upsertError;
            results.imported = data.length;
        }

        return res.status(200).json(results);
    } catch (error) {
        console.error('Bulk Import Error:', error);
        return res.status(500).json({ error: error.message });
    }
}
