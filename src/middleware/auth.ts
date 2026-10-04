import type { NextFunction, Request, Response } from 'express';

// internal imports
import { supabaseAuth } from '../lib/supabase.js';

// admin
export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
	if (!supabaseAuth) {
		res.status(503).json({ error: 'Admin access requires Supabase Auth configuration.' });
		return;
	}
	const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
	if (!token) {
		res.status(401).json({ error: 'Authentication required.' });
		return;
	}
	const { data, error } = await supabaseAuth.auth.getUser(token);
	if (error || !data.user || data.user.app_metadata.role !== 'admin') {
		res.status(403).json({ error: 'Admin access required.' });
		return;
	}
	next();
}
