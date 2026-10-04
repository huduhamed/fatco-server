import { Prisma } from '@prisma/client';
import { z } from 'zod';

// internal imports
import { demoProducts } from '../config/demoProducts.js';
import { databaseConfigured, prisma } from '../lib/prisma.js';
import { supabaseAdmin } from '../lib/supabase.js';

const supabaseConfigured = Boolean(supabaseAdmin);
const dataStoreConfigured = databaseConfigured || supabaseConfigured;

function serviceError(message: string, status = 500) {
	return Object.assign(new Error(message), { status });
}

function unwrap<T>(result: { data: T | null; error: { message: string; code?: string } | null }) {
	if (result.error) {
		const status = result.error.code === '23505' ? 409 : 502;
		throw serviceError(`Database request failed: ${result.error.message}`, status);
	}
	return result.data as T;
}

// product schema
export const productSchema = z.object({
	name: z.string().min(3),
	slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
	description: z.string().min(10),
	team: z.string().min(2),
	category: z.enum([
		'Club Jerseys',
		'National Team Jerseys',
		'Retro Jerseys',
		'Training Wear',
		'Accessories',
	]),
	season: z.string().min(2),
	price: z.coerce.number().nonnegative(),
	currency: z.string().length(3).default('GHS'),
	image_url: z.string().min(1),
	additional_images: z.array(z.string()).default([]),
	sizes: z.array(z.string()).min(1),
	stock_quantity: z.coerce.number().int().nonnegative(),
	is_available: z.boolean(),
	is_featured: z.boolean(),
});

// orders schema
export const orderSchema = z.object({
	customer_name: z.string().min(2).max(100),
	phone: z.string().min(7).max(30),
	email: z.string().email(),
	delivery_address: z.string().min(5).max(300),
	city: z.string().min(2).max(100),
	notes: z.string().max(500).optional().default(''),
	delivery_method: z.enum(['accra', 'ghana', 'pickup']),
	items: z
		.array(
			z.object({
				product_id: z.string().min(1),
				size: z.string(),
				quantity: z.number().int().min(1).max(20),
			}),
		)
		.min(1),
});

// shipping fees schema
const shippingFees = { accra: 30, ghana: 55, pickup: 0 };

const productJson = (
	product: { price: Prisma.Decimal; created_at: Date; updated_at: Date } & Record<string, unknown>,
) => ({
	...product,
	price: product.price.toNumber(),
	created_at: product.created_at.toISOString(),
	updated_at: product.updated_at.toISOString(),
});

const orderJson = (
	order: {
		shipping_amount: Prisma.Decimal;
		total_amount: Prisma.Decimal;
		created_at: Date;
		updated_at: Date;
		order_items?: Array<
			Record<string, unknown> & { unit_price: Prisma.Decimal; subtotal: Prisma.Decimal }
		>;
	} & Record<string, unknown>,
) => ({
	...order,
	shipping_amount: order.shipping_amount.toNumber(),
	total_amount: order.total_amount.toNumber(),
	created_at: order.created_at.toISOString(),
	updated_at: order.updated_at.toISOString(),

	items:
		order.order_items?.map((item) => ({
			...item,
			unit_price: item.unit_price.toNumber(),
			subtotal: item.subtotal.toNumber(),
		})) ?? [],
	order_items: undefined,
});

// list products
export async function listProducts(query: Record<string, unknown>) {
	if (!dataStoreConfigured) {
		let rows = [...demoProducts];
		if (query.featured === 'true') rows = rows.filter((product) => product.is_featured);
		if (query.category) rows = rows.filter((product) => product.category === query.category);
		return rows;
	}
	if (!databaseConfigured) {
		let request = supabaseAdmin!.from('products').select('*').order('created_at', { ascending: false });
		if (query.featured === 'true') request = request.eq('is_featured', true);
		if (query.category) request = request.eq('category', String(query.category));
		return unwrap(await request);
	}
	const rows = await prisma.products.findMany({
		where: {
			is_featured: query.featured === 'true' ? true : undefined,
			category: query.category ? String(query.category) : undefined,
		},
		orderBy: { created_at: 'desc' },
	});
	return rows.map(productJson);
}

export async function productBySlug(slug: string) {
	if (!dataStoreConfigured) return demoProducts.find((product) => product.slug === slug) ?? null;
	if (!databaseConfigured) {
		const result = await supabaseAdmin!.from('products').select('*').eq('slug', slug).maybeSingle();
		return unwrap(result);
	}
	const product = await prisma.products.findUnique({ where: { slug } });
	return product ? productJson(product) : null;
}

// create order
export async function createOrder(input: z.infer<typeof orderSchema>) {
	if (!dataStoreConfigured)
		throw Object.assign(new Error('Ordering is unavailable until PostgreSQL is configured.'), {
			status: 503,
		});

	const ids = [...new Set(input.items.map((item) => item.product_id))];
	if (ids.some((id) => !z.uuid().safeParse(id).success))
		throw Object.assign(
			new Error('The cart contains invalid product identifiers. Please refresh it.'),
			{ status: 400 },
		);

	if (!databaseConfigured) return createSupabaseOrder(input);

	return prisma.$transaction(
		async (tx) => {
			const products = await tx.products.findMany({ where: { id: { in: ids } } });
			const productMap = new Map(products.map((product) => [product.id, product]));
			let subtotal = 0;
			const items = input.items.map((item) => {
				const product = productMap.get(item.product_id);
				if (
					!product ||
					!product.is_available ||
					product.stock_quantity < item.quantity ||
					!product.sizes.includes(item.size)
				)
					throw Object.assign(new Error('One or more cart items are unavailable.'), {
						status: 409,
					});
				const line = product.price.toNumber() * item.quantity;
				subtotal += line;
				return {
					product_id: product.id,
					product_name: product.name,
					size: item.size,
					quantity: item.quantity,
					unit_price: product.price,
					subtotal: line,
				};
			});

			for (const item of input.items) {
				const updated = await tx.products.updateMany({
					where: {
						id: item.product_id,
						is_available: true,
						stock_quantity: { gte: item.quantity },
					},
					data: { stock_quantity: { decrement: item.quantity } },
				});
				if (updated.count !== 1)
					throw Object.assign(
						new Error('Stock changed while placing your order. Please review your cart.'),
						{ status: 409 },
					);
			}

			const shipping = subtotal >= 1000 ? 0 : shippingFees[input.delivery_method];

			// order
			const order = await tx.orders.create({
				data: {
					order_number: `FAT-${Date.now().toString().slice(-8)}`,
					customer_name: input.customer_name,
					phone: input.phone,
					email: input.email,
					delivery_address: input.delivery_address,
					city: input.city,
					notes: input.notes,
					delivery_method: input.delivery_method,
					shipping_amount: shipping,
					total_amount: subtotal + shipping,
					order_items: { create: items },
				},
				include: { order_items: true },
			});

			return orderJson(order);
		},

		{ isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
	);
}

// list orders
export async function listOrders() {
	if (!dataStoreConfigured) throw serviceError('Ordering requires a configured database.', 503);
	if (!databaseConfigured) {
		const rows = unwrap(
			await supabaseAdmin!
				.from('orders')
				.select('*, order_items(*)')
				.order('created_at', { ascending: false }),
		) as Array<Record<string, unknown> & { order_items?: Array<Record<string, unknown>> }>;
		return rows.map((order) => ({ ...order, items: order.order_items ?? [], order_items: undefined }));
	}
	const orders = await prisma.orders.findMany({
		include: { order_items: true },
		orderBy: { created_at: 'desc' },
	});
	return orders.map(orderJson);
}

// create product
export async function createProduct(input: z.infer<typeof productSchema>) {
	if (!dataStoreConfigured) throw serviceError('Product management requires a configured database.', 503);
	if (!databaseConfigured)
		return unwrap(await supabaseAdmin!.from('products').insert(input).select('*').single());
	return productJson(await prisma.products.create({ data: input }));
}

// update product
export async function updateProduct(id: string, input: z.infer<typeof productSchema>) {
	if (!dataStoreConfigured) throw serviceError('Product management requires a configured database.', 503);
	if (!databaseConfigured)
		return unwrap(await supabaseAdmin!.from('products').update(input).eq('id', id).select('*').single());
	return productJson(await prisma.products.update({ where: { id }, data: input }));
}

// delete product
export async function deleteProduct(id: string) {
	if (!dataStoreConfigured) throw serviceError('Product management requires a configured database.', 503);
	if (!databaseConfigured) {
		unwrap(await supabaseAdmin!.from('products').delete().eq('id', id).select('id').single());
		return;
	}
	await prisma.products.delete({ where: { id } });
}
export { dataStoreConfigured as databaseConfigured };

async function createSupabaseOrder(input: z.infer<typeof orderSchema>) {
	const ids = [...new Set(input.items.map((item) => item.product_id))];
	if (ids.some((id) => !z.uuid().safeParse(id).success))
		throw serviceError('The cart contains invalid product identifiers. Please refresh it.', 400);

	const products = unwrap(await supabaseAdmin!.from('products').select('*').in('id', ids)) as Array<{
		id: string; name: string; price: number | string; sizes: string[]; stock_quantity: number; is_available: boolean;
	}>;
	const productMap = new Map(products.map((product) => [product.id, product]));
	let subtotal = 0;
	const items = input.items.map((item) => {
		const product = productMap.get(item.product_id);
		if (!product || !product.is_available || product.stock_quantity < item.quantity || !product.sizes.includes(item.size))
			throw serviceError('One or more cart items are unavailable.', 409);
		const line = Number(product.price) * item.quantity;
		subtotal += line;
		return { product_id: product.id, product_name: product.name, size: item.size, quantity: item.quantity, unit_price: Number(product.price), subtotal: line };
	});
	const shipping = subtotal >= 1000 ? 0 : shippingFees[input.delivery_method];
	const order = unwrap(
		await supabaseAdmin!.from('orders').insert({
			order_number: `FAT-${Date.now().toString().slice(-8)}`,
			customer_name: input.customer_name, phone: input.phone, email: input.email,
			delivery_address: input.delivery_address, city: input.city, notes: input.notes,
			delivery_method: input.delivery_method, shipping_amount: shipping, total_amount: subtotal + shipping,
		}).select('*').single(),
	) as Record<string, unknown> & { id: string };

	try {
		for (const item of input.items) {
			const product = productMap.get(item.product_id)!;
			const updated = unwrap(await supabaseAdmin!.from('products')
				.update({ stock_quantity: product.stock_quantity - item.quantity })
				.eq('id', item.product_id).eq('stock_quantity', product.stock_quantity).select('id').maybeSingle());
			if (!updated) throw serviceError('Stock changed while placing your order. Please review your cart.', 409);
		}
		unwrap(await supabaseAdmin!.from('order_items').insert(items).select('id'));
		return { ...order, items };
	} catch (error) {
		await supabaseAdmin!.from('orders').delete().eq('id', order.id);
		throw error;
	}
}
