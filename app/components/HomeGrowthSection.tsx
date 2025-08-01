"use client";
import { useEffect, useState } from "react";

const COUNTRIES = [
  { code: "US", name: "United States" },
  { code: "AU", name: "Australia" },
  { code: "JP", name: "Japan" },
  { code: "FR", name: "France" },
];
const CATEGORIES = [
  { id: 166, name: "Apparel & Accessories" },
  { id: 222, name: "Electronics" },
  { id: 536, name: "Home & Garden" },
  { id: 1239, name: "Toys & Games" },
  { id: 888, name: "Vehicles & Parts" },
];

function ProductCard({ product }: { product: any }) {
  return (
    <div className="w-40 flex-shrink-0 m-2 bg-white rounded shadow p-2 flex flex-col items-center">
      <div className="w-32 h-32 bg-gray-100 flex items-center justify-center mb-2 overflow-hidden rounded">
        {product.image_url ? (
          <img src={product.image_url} alt={product.product_title} className="object-contain w-full h-full" />
        ) : (
          <span className="text-gray-400 text-xs">No image</span>
        )}
      </div>
      <div className="text-xs text-center line-clamp-2 min-h-[2.5em]">{product.product_title}</div>
    </div>
  );
}

function CategoryRow({ country, category, type, label }: { country: string; category: number; type: "fastest" | "rank"; label: string }) {
  const [products, setProducts] = useState<any[]>([]);
  const [date, setDate] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/products-growth?country=${country}&category=${category}&type=${type}`)
      .then(res => res.json())
      .then(data => {
        setProducts(data.products || []);
        console.log("前端收到产品数量:", (data.products || []).length, data.products || []);
        setDate(typeof data.rank_timestamp === "string" ? data.rank_timestamp.slice(0, 10) : "");
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [country, category, type]);

  return (
    <div className="mb-2">
      <div className="flex items-center mb-1">
        <span className="font-semibold text-sm mr-2">{label}</span>
        {date && <span className="text-xs text-gray-500">Date: {date}</span>}
      </div>
      <div className="flex overflow-x-auto pb-2">
        {loading ? (
          <span className="text-gray-400 text-xs">Loading...</span>
        ) : products.length === 0 ? (
          <span className="text-gray-400 text-xs">No data</span>
        ) : (
          products.map((p: any) => <ProductCard key={p.rank_id + type} product={p} />)
        )}
      </div>
    </div>
  );
}

const HomeGrowthSection = () => {
  const [country, setCountry] = useState("US");
  return (
    <section className="bg-gray-50 py-8 mt-8">
      <div className="max-w-5xl mx-auto px-4">
        {/* 去掉标题 <h2 className="text-xl font-bold mb-4">各国热门增长类目推荐</h2> */}
        <div className="flex space-x-4 mb-6">
          {COUNTRIES.map(c => (
            <button
              key={c.code}
              className={`px-4 py-2 rounded ${country === c.code ? "bg-blue-600 text-white" : "bg-white border"}`}
              onClick={() => setCountry(c.code)}
            >
              {c.name}
            </button>
          ))}
        </div>
        {CATEGORIES.map(cat => (
          <div key={cat.id} className="mb-8">
            <h3 className="text-lg font-semibold mb-2">{cat.name}</h3>
            <CategoryRow country={country} category={cat.id} type="fastest" label="Fastest Growing" />
            <CategoryRow country={country} category={cat.id} type="rank" label="By Rank" />
          </div>
        ))}
      </div>
    </section>
  );
};

export default HomeGrowthSection; 