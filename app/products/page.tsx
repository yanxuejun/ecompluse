import ProductsTable from "./ProductsTable";
import { PrismaClient } from "@prisma/client";

// 获取所有产品和类别
async function getProducts() {
  const prisma = new PrismaClient();
  const products = await prisma.trendProduct.findMany();
  await prisma.$disconnect();
  return products;
}

export default async function ProductsPage() {
  const products = await getProducts();
  const categories = Array.from(new Set(products.map((p: any) => p.category)));
  return <ProductsTable products={products} categories={categories} />;
} 