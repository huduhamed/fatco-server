// Load server environment variables before modules that configure Prisma,
// Supabase, Storage, routes, or CORS are evaluated.
import './config/env.js';

import cors from 'cors';
import express, { type NextFunction, type Request, type Response } from 'express';
import multer from 'multer';
import { ZodError } from 'zod';

// internal imports
import { api } from './routes/api.js';

export const app = express();

const configuredOrigins =
	process.env.CLIENT_URL?.split(',')
		.map((origin) => origin.trim())
		.filter(Boolean) ?? [];

const allowedOrigins = new Set([
	'http://localhost:5173',
	'http://127.0.0.1:5173',
	...configuredOrigins,
]);

app.use(
	cors({ origin: (origin, callback) => callback(null, !origin || allowedOrigins.has(origin)) }),
);

app.use(express.json({ limit: '200kb' }));

// api
app.use('/api', api);

// api route
app.use((_req, res) => res.status(404).json({ error: 'Route not found.' }));

// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
	if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE')
		return res.status(413).json({ error: 'Image exceeds the maximum size of 300 KB.' });
	if (error instanceof ZodError)
		return res
			.status(400)
			.json({ error: 'Invalid request.', details: error.flatten().fieldErrors });

	const err = error as Error & { status?: number; code?: string };

	const status =
		err.status ??
		(['23505', 'P2002'].includes(err.code ?? '') ? 409 : err.code === 'P2025' ? 404 : 500);
	res
		.status(status)
		.json({ error: status === 500 ? 'An unexpected server error occurred.' : err.message });
});
