
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function listColumns() {
    const { data, error } = await supabase.rpc('get_table_info', { t_name: 'claims' });
    if (error) {
        // Try raw SQL if RPC is missing
        const { data: raw, error: rawErr } = await supabase.from('information_schema.columns').select('column_name, data_type').eq('table_name', 'claims').eq('table_schema', 'public');
        if (rawErr) {
            console.error('Final attempt to list columns failed:', rawErr);
        } else {
            console.log('Columns from information_schema:', raw.map(c => `${c.column_name} (${c.data_type})`).join(', '));
        }
    } else {
        console.log('Columns from RPC:', data);
    }
}

listColumns();
