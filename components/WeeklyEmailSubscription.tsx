import React, { useState, useEffect } from "react";
import CategoryTreeSelect from "./ui/CategoryTreeSelect";
import { useUser } from "@clerk/nextjs";

function validateEmail(email: string) {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
}

export default function WeeklyEmailSubscription() {
  const { user } = useUser();
  const [categories, setCategories] = useState<string[]>([]);
  const [keywords, setKeywords] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (user && user.emailAddresses && user.emailAddresses[0]?.emailAddress) {
      setEmail(user.emailAddresses[0].emailAddress);
    }
  }, [user]);

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
    if ((categories.length === 0) && !keywords.trim()) {
      setError("请选择至少一个类目或填写关键词");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/weekly-subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categories,
          keywords,
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

  return (
    <form className="max-w-xl mx-auto bg-white rounded-lg shadow p-6 flex flex-col gap-6" onSubmit={handleSubmit}>
      <h2 className="text-xl font-bold mb-2">每周邮件订阅</h2>
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