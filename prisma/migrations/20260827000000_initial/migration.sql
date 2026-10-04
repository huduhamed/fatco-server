CREATE EXTENSION IF NOT EXISTS pgcrypto;


CREATE TABLE "products" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "name" TEXT NOT NULL, "slug" TEXT NOT NULL,
  "description" TEXT NOT NULL, "team" TEXT NOT NULL, "category" TEXT NOT NULL, "season" TEXT NOT NULL,
  "price" DECIMAL(12,2) NOT NULL, "currency" CHAR(3) NOT NULL DEFAULT 'GHS', "image_url" TEXT NOT NULL,
  "additional_images" TEXT[] DEFAULT ARRAY[]::TEXT[], "sizes" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "stock_quantity" INTEGER NOT NULL DEFAULT 0, "is_available" BOOLEAN NOT NULL DEFAULT true,
  "is_featured" BOOLEAN NOT NULL DEFAULT false, "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "products_pkey" PRIMARY KEY ("id"), CONSTRAINT "products_price_check" CHECK (price >= 0),
  CONSTRAINT "products_stock_check" CHECK (stock_quantity >= 0),
  CONSTRAINT "products_category_check" CHECK (category IN ('Club Jerseys','National Team Jerseys','Retro Jerseys','Training Wear','Accessories'))
);


CREATE TABLE "orders" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "order_number" TEXT NOT NULL, "customer_name" TEXT NOT NULL,
  "phone" TEXT NOT NULL, "email" TEXT NOT NULL, "delivery_address" TEXT NOT NULL, "city" TEXT NOT NULL,
  "delivery_method" TEXT NOT NULL, "notes" TEXT NOT NULL DEFAULT '', "shipping_amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
  "total_amount" DECIMAL(12,2) NOT NULL, "currency" CHAR(3) NOT NULL DEFAULT 'GHS', "status" TEXT NOT NULL DEFAULT 'pending',
  "payment_status" TEXT NOT NULL DEFAULT 'unpaid', "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "orders_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "orders_delivery_check" CHECK (delivery_method IN ('accra','ghana','pickup')),
  CONSTRAINT "orders_status_check" CHECK (status IN ('pending','confirmed','processing','ready','completed','cancelled')),
  CONSTRAINT "orders_payment_check" CHECK (payment_status IN ('unpaid','paid','refunded'))
);


CREATE TABLE "order_items" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(), "order_id" UUID NOT NULL, "product_id" UUID,
  "product_name" TEXT NOT NULL, "size" TEXT NOT NULL, "quantity" INTEGER NOT NULL,
  "unit_price" DECIMAL(12,2) NOT NULL, "subtotal" DECIMAL(12,2) NOT NULL,
  CONSTRAINT "order_items_pkey" PRIMARY KEY ("id"), CONSTRAINT "order_items_quantity_check" CHECK (quantity > 0)
);


CREATE UNIQUE INDEX "products_slug_key" ON "products"("slug");
CREATE INDEX "products_is_available_idx" ON "products"("is_available");
CREATE INDEX "products_category_idx" ON "products"("category");
CREATE UNIQUE INDEX "orders_order_number_key" ON "orders"("order_number");
CREATE INDEX "orders_created_at_idx" ON "orders"("created_at" DESC);
CREATE INDEX "orders_status_idx" ON "orders"("status");
CREATE INDEX "order_items_order_id_idx" ON "order_items"("order_id");


ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE;
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL;
