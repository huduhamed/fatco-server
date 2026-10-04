import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
export const supabaseAdmin =
	url && key ? createClient(url, key, { auth: { persistSession: false } }) : null;

export const supabaseAuth = supabaseAdmin;

export function createUserSupabase(accessToken: string) {
	return url && key
		? createClient(url, key, {
			auth: { persistSession: false },
			global: { headers: { Authorization: `Bearer ${accessToken}` } },
		})
		: null;
}
