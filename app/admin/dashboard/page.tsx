"use client";
import { useState } from "react";

export default function AdminDashboard() {
  const [country, setCountry] = useState("");
  const [category, setCategory] = useState("");
  const [topN, setTopN] = useState(10);
  const [isFastest, setIsFastest] = useState(true);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setMessage("");
    try {
      const res = await fetch("/api/admin/generate-rank", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ country, category, topN, isFastest }),
      });
      const data = await res.json();
      if (data.success) {
        setStatus("success");
        setMessage(`成功插入 ${data.count} 条数据`);
      } else {
        setStatus("error");
        setMessage(data.error || "未知错误");
      }
    } catch (err: any) {
      setStatus("error");
      setMessage(err.message || "请求失败");
    }
  };

  return (
    <div className="max-w-xl mx-auto mt-10 p-6 bg-white rounded shadow">
      <h1 className="text-2xl font-bold mb-4">排行榜生成（Admin Dashboard）</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label>国家：</label>
          <input
            className="border p-2 w-full"
            value={country}
            onChange={e => setCountry(e.target.value)}
            required
          />
        </div>
        <div>
          <label>类目：</label>
          <input
            className="border p-2 w-full"
            value={category}
            onChange={e => setCategory(e.target.value)}
            required
          />
        </div>
        <div>
          <label>前多少排名：</label>
          <input
            type="number"
            className="border p-2 w-full"
            value={topN}
            min={1}
            onChange={e => setTopN(Number(e.target.value))}
            required
          />
        </div>
        <div>
          <label>
            <input
              type="checkbox"
              checked={isFastest}
              onChange={e => setIsFastest(e.target.checked)}
              className="mr-2"
            />
            是否增长最快
          </label>
        </div>
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded"
          disabled={status === "loading"}
        >
          {status === "loading" ? "生成中..." : "生成排行榜"}
        </button>
      </form>
      {status === "success" && (
        <div className="mt-4 text-green-600">{message}</div>
      )}
      {status === "error" && (
        <div className="mt-4 text-red-600">{message}</div>
      )}
    </div>
  );
} 