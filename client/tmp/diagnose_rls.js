
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkUser() {
    const email = 'skarakaya@worldfreightcompany.com'; // From user's logs
    const { data: user, error } = await supabase.from('users').select('*').ilike('email', email).single();

    if (error) {
        console.error('Error fetching user:', error);
        return;
    }

    console.log('User Profile in DB:', JSON.stringify(user, null, 2));

    const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(user.id);
    if (authError) {
        console.error('Error fetching Auth user:', authError);
    } else {
        console.log('Auth User ID matches Profile ID:', authUser.user.id === user.id);
    }
}

checkUser();
