import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dhmouevprsqxtulhqzqp.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRobW91ZXZwcnNxeHR1bGhxenFwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIwMjcwMDMsImV4cCI6MjA4NzYwMzAwM30.liJiYTJBSNeeWHOAPvIslsjknUaI4p_fCrsh-q_JCwY';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function setup() {
    const email = 'wfciadminsk@dcbi.aero';
    const password = 'DCBIExpense';

    console.log(`Checking if ${email} exists...`);

    // Try to sign in first to see if they exist
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    if (!signInError) {
        console.log('User already exists and login successful!');
        process.exit(0);
    }

    if (signInError.message.includes('Invalid login credentials')) {
        console.log('User not found or password mismatch. Attempting to register...');
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { full_name: 'Master Admin' }
            }
        });

        if (signUpError) {
            console.error('Registration failed:', signUpError.message);
            if (signUpError.message.includes('rate limit')) {
                console.log('Rate limit reached. Please wait a few minutes.');
            }
        } else {
            console.log('Registration successful! You can now log in.');
        }
    } else {
        console.error('Login error:', signInError.message);
    }
}

setup();
