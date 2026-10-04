import { Router } from 'express';
import multer from 'multer';

// internal imports
import { requireAdmin } from '../middleware/auth.js';
import { acceptImageMime, IMAGE_SIZE_LABEL, MAX_IMAGE_BYTES, uploadProductImage } from '../services/images.js';
import {
	createOrder,
	createProduct,
	databaseConfigured,
	deleteProduct,
	listOrders,
	listProducts,
	orderSchema,
	productBySlug,
	productSchema,
	updateProduct,
} from '../services/store.js';

// api router
export const api = Router();
api.get('/health', (_req, res) =>
	res.json({ ok: true, database: databaseConfigured ? 'connected' : 'demo' }),
);

// products api
api.get('/products', async (req, res, next) => {
	try {
		res.json({
			data: await listProducts(req.query),
			mode: databaseConfigured ? 'database' : 'demo',
		});
	} catch (error) {
		next(error);
	}
});

// product slug api
api.get('/products/:slug', async (req, res, next) => {
	try {
		const product = await productBySlug(req.params.slug);
		if (!product) return res.status(404).json({ error: 'Product not found.' });
		res.json({ data: product });
	} catch (error) {
		next(error);
	}
});

// orders api
api.post('/orders', async (req, res, next) => {
	try {
		res.status(201).json({ data: await createOrder(orderSchema.parse(req.body)) });
	} catch (error) {
		next(error);
	}
});

// admin api
api.use('/admin', requireAdmin);

// admin product api
api.get('/admin/products', async (_req, res, next) => {
	try {
		res.json({ data: await listProducts({}) });
	} catch (error) {
		next(error);
	}
});

// admin orders
api.get('/admin/orders', async (_req, res, next) => {
	try {
		res.json({ data: await listOrders() });
	} catch (error) {
		next(error);
	}
});

const imageUpload = multer({
	storage: multer.memoryStorage(),
	limits: { fileSize: MAX_IMAGE_BYTES, files: 1 },
	fileFilter: (_req, file, callback) => callback(null, acceptImageMime(file.mimetype)),
});

api.post('/admin/uploads/images', imageUpload.single('image'), async (req, res, next) => {
	try {
		if (!req.file)
			return res.status(400).json({ error: `Choose a JPG, PNG, WebP, or AVIF image no larger than ${IMAGE_SIZE_LABEL}.` });
		const accessToken = req.headers.authorization!.replace(/^Bearer\s+/i, '');
		res.status(201).json({ data: { url: await uploadProductImage(req.file, accessToken) } });
	} catch (error) {
		next(error);
	}
});

// admin products
api.post('/admin/products', async (req, res, next) => {
	try {
		res.status(201).json({ data: await createProduct(productSchema.parse(req.body)) });
	} catch (error) {
		next(error);
	}
});

// admin products id
api.put('/admin/products/:id', async (req, res, next) => {
	try {
		res.json({ data: await updateProduct(req.params.id, productSchema.parse(req.body)) });
	} catch (error) {
		next(error);
	}
});

// admin delete product
api.delete('/admin/products/:id', async (req, res, next) => {
	try {
		await deleteProduct(req.params.id);
		res.status(204).end();
	} catch (error) {
		next(error);
	}
});
