-- CreateTable
CREATE TABLE "TrendProduct" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "relativeDemand" INTEGER NOT NULL,

    CONSTRAINT "TrendProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Google_Product_Taxonomy" (
    "code" INTEGER NOT NULL,
    "catalog_name" TEXT NOT NULL,
    "catalog_depth" INTEGER NOT NULL,
    "parent_catalog_code" INTEGER NOT NULL,
    "full_catalog_name" TEXT NOT NULL,

    CONSTRAINT "Google_Product_Taxonomy_pkey" PRIMARY KEY ("code")
);

-- CreateTable
CREATE TABLE "ProductWeekRank" (
    "id" SERIAL NOT NULL,
    "rank" INTEGER NOT NULL,
    "productTitle" TEXT NOT NULL,
    "categoryId" INTEGER NOT NULL,
    "imageUrl" TEXT,
    "searchTitle" TEXT,
    "searchLink" TEXT,
    "country" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductWeekRank_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProductWeekRank_country_categoryId_rank_idx" ON "ProductWeekRank"("country", "categoryId", "rank");

-- CreateIndex
CREATE INDEX "ProductWeekRank_createdAt_idx" ON "ProductWeekRank"("createdAt");
