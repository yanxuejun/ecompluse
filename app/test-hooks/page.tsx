"use client";
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function TestHooksPage() {
  const { isSignedIn, isLoaded } = useUser();
  const router = useRouter();
  const [count, setCount] = useState(0);
  useEffect(() => {
    // 仅测试 hooks 顺序
  }, []);

  if (!isLoaded) return <div>Loading...</div>;
  if (!isSignedIn) return <div>未登录</div>;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Hooks 顺序测试页面</h1>
      <p>当前计数：{count}</p>
      <button className="px-4 py-2 bg-blue-500 text-white rounded" onClick={() => setCount(count + 1)}>
        增加
      </button>
    </div>
  );
} 