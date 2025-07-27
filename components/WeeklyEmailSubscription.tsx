import React, { useState, useEffect } from "react";
import CategoryTreeSelect from "./ui/CategoryTreeSelect";
import CountrySelect from "./ui/CountrySelect";
import { useUser } from "@clerk/nextjs";

function validateEmail(email: string) {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
}

function getCategoryMap() {
  // Fetch and flatten categories.json to a map: code => catalog_name
  return fetch("/categories.json")
    .then(res => res.json())
    .then(function flatten(nodes: any[]): { [k: string]: string } {
      const map: { [k: string]: string } = {};
      function walk(arr: any[]) {
        arr.forEach((node: any) => {
          map[node.code] = node.catalog_name;
          if (node.children) walk(node.children);
        });
      }
      walk(nodes);
      return map;
    });
}

export default function WeeklyEmailSubscription() {
  const { user } = useUser();
  const [categories, setCategories] = useState<string[]>([]);
  const [keywords, setKeywords] = useState("");
  const [email, setEmail] = useState("");
  const [country, setCountry] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [current, setCurrent] = useState<{categories: string, keywords: string}|null>(null);
  const [categoryMap, setCategoryMap] = useState<{[k:string]:string}>({});
  const [tier, setTier] = useState<string>("free");

  useEffect(() => {
    if (user && user.emailAddresses && user.emailAddresses[0]?.emailAddress) {
      setEmail(user.emailAddresses[0].emailAddress);
    }
    // Fetch user plan
    fetch("/api/user/profile").then(res => res.json()).then(data => setTier(data.tier || "free"));
    // Fetch current subscription
    fetch("/api/weekly-subscribe").then(res => res.json()).then(setCurrent);
    // Fetch category map
    getCategoryMap().then(setCategoryMap);
  }, [user]);

  // Subscription limits by plan
  const limits: { [k: string]: { cat: number; kw: number } } = {
    free: { cat: 3, kw: 1 },
    starter: { cat: 3, kw: 1 },
    standard: { cat: 10, kw: 5 },
    premium: { cat: 20, kw: 10 }
  };
  const limit = limits[tier] || limits["free"];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess("");
    setError("");
    if (!email) {
      setError("请输入邮箱");
      return;
    }
    if (!validateEmail(email)) {
      setError("请输入有效的邮箱地址");
      return;
    }
    if (!country) {
      setError("请选择国家");
      return;
    }
    if ((categories.length === 0) && !keywords.trim()) {
      setError("请选择至少一个类目或填写关键词");
      return;
    }
    if (categories.length > limit.cat) {
      setError(`您的套餐最多可订阅${limit.cat}个类目`);
      return;
    }
    const kwArr = keywords.split(',').map(k=>k.trim()).filter(k => Boolean(k) && !k.includes('_'));
    if (kwArr.length > limit.kw) {
      setError(`您的套餐最多可订阅${limit.kw}个关键词`);
      return;
    }
    // Format: 国家_类目id
    const catPayload = categories.map(cid => `${country}_${cid}`);
    const kwPayload = kwArr.map(kw => `${country}_${kw}`).join(',');
    setLoading(true);
    try {
      const res = await fetch("/api/weekly-subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categories: catPayload,
          keywords: kwPayload,
          email,
          username: user?.username || user?.firstName || "",
          useremail: user?.emailAddresses?.[0]?.emailAddress || ""
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "订阅失败");
      setSuccess("订阅成功！请查收邮件确认。");
      setCategories([]);
      setKeywords("");
      // setEmail(""); // 不清空邮箱
    } catch (e: any) {
      setError(e.message || "订阅失败");
    } finally {
      setLoading(false);
    }
  };

  // Display current subscription (map category codes to names)
  let currentCats: string[] = [];
  let currentKws: string[] = [];
  if (current && current.categories) {
    currentCats = current.categories.split(',').map(s => {
      const [c, id] = s.split('_');
      return categoryMap[id] ? `${c}_${categoryMap[id]}` : s;
    });
  }
  if (current && current.keywords) {
    currentKws = current.keywords.split(',').map(s => {
      const [c, kw] = s.split('_');
      return `${c}_${kw}`;
    });
  }

  return (
    <form className="max-w-xl mx-auto bg-white rounded-lg shadow p-6 flex flex-col gap-6" onSubmit={handleSubmit}>
      <h2 className="text-xl font-bold mb-2">每周邮件订阅</h2>
      {current && (
        <div className="mb-2 text-sm text-gray-700">
          <div className="mb-1">当前已订阅类目：
            {currentCats.length ? (
              <div className="flex flex-wrap gap-2 mt-1">
                {currentCats.map((cat, i) => (
                  <span key={i} className="inline-block bg-blue-100 text-blue-800 rounded-full px-3 py-1 text-xs font-semibold">{cat}</span>
                ))}
              </div>
            ) : '无'}
          </div>
          <div>当前已订阅关键词：
            {currentKws.length ? (
              <div className="flex flex-wrap gap-2 mt-1">
                {currentKws.map((kw, i) => (
                  <span key={i} className="inline-block bg-green-100 text-green-800 rounded-full px-3 py-1 text-xs font-semibold">{kw}</span>
                ))}
              </div>
            ) : '无'}
          </div>
        </div>
      )}
      <div>
        <label className="block mb-1 font-medium">国家 <span className="text-red-500">*</span></label>
        <CountrySelect value={country} onChange={setCountry} />
      </div>
      <div>
        <label className="block mb-1 font-medium">选择类目（可多选）</label>
        <CategoryTreeSelect
          value={categories}
          onChange={code => setCategories(Array.isArray(code) ? code : code ? [code] : [])}
          multiple
          placeholder="请选择感兴趣的类目"
        />
      </div>
      <div>
        <label className="block mb-1 font-medium">关键词（可选，逗号分隔）</label>
        <input
          className="border px-2 py-1 rounded w-full"
          value={keywords}
          onChange={e => setKeywords(e.target.value)}
          placeholder="如：宠物,智能,家居"
        />
      </div>
      <div>
        <label className="block mb-1 font-medium">邮箱地址</label>
        <input
          className="border px-2 py-1 rounded w-full"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="请输入您的邮箱"
          required
        />
      </div>
      <button
        type="submit"
        className="bg-blue-600 text-white font-bold px-6 py-2 rounded-lg shadow hover:bg-blue-700 transition"
        disabled={loading}
      >
        {loading ? "提交中..." : "订阅"}
      </button>
      {success && <div className="text-green-600 font-medium">{success}</div>}
      {error && <div className="text-red-600 font-medium">{error}</div>}
    </form>
  );
} 