import { PrismaClient } from '@prisma/client';

// internal import
import { demoProducts } from '../src/config/demoProducts.js';

// prisma
const prisma = new PrismaClient();
for (const { id: _id, ...product } of demoProducts) {
	await prisma.products.upsert({ where: { slug: product.slug }, update: product, create: product });
}
await prisma.$disconnect();
