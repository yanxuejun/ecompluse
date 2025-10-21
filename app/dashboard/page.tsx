'use client';
import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { redirect, useRouter } from "next/navigation";
import ProductsContent from '../../components/ProductsContent';
import ProductsExplorerContent from '../../components/ProductsExplorerContent';
import Footer from '../../components/Footer';
import Navbar from '../../components/Navbar';
import { useI18n } from '@/lib/i18n/context';
import TopGrowthProducts from './TopGrowthProducts';
import ProductFavorites from './ProductFavorites';
import WeeklyEmailSubscription from '../../components/WeeklyEmailSubscription';

const MENU_ITEMS = [
  { key: 'all', label: 'All Datas Query' },
  { key: 'hot', label: 'Hot Products by Category' },
  { key: 'growth', label: 'Top Growth Products by Weekly' },
  { key: 'growth_monthly', label: 'Top Growth Products by Monthly' },
  { key: 'favorites', label: 'Product Favorites' },
  { key: 'subscribe', label: 'Weekly Email Subscription' },
];

function CancelSubscriptionButton({ tier, onCancelSuccess }: { tier: string, onCancelSuccess: () => void }) {
  const { language } = useI18n();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  if (tier === 'free' || tier === 'starter') return null;
  const handleCancel = async () => {
    if (!window.confirm(language === 'zh' ? '确定要取消订阅吗？' : 'Are you sure you want to cancel your subscription?')) return;
    setLoading(true);
    const res = await fetch('/api/stripe/cancel-subscription', { method: 'POST' });
    setLoading(false);
    if (res.ok) {
      setSuccess(true);
      onCancelSuccess();
    } else {
      alert(language === 'zh' ? '取消失败，请重试' : 'Cancel failed, please try again');
    }
  };
  return (
    <div className="mt-2">
      <button
        className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition font-semibold"
        onClick={handleCancel}
        disabled={loading}
      >
        {loading ? (language === 'zh' ? '正在取消...' : 'Cancelling...') : (language === 'zh' ? '取消订阅' : 'Cancel Subscription')}
      </button>
      {success && <div className="text-green-600 mt-2">{language === 'zh' ? '已提交取消，订阅将在本周期结束后失效。' : 'Cancellation submitted. Your subscription will end at the period end.'}</div>}
    </div>
  );
}

export default function DashboardPage() {
  const { user, isSignedIn, isLoaded } = useUser();
  const [credits, setCredits] = useState<number | null>(null);
  const [tier, setTier] = useState<string>('');
  const [menuCollapsed, setMenuCollapsed] = useState(false);
  const [selectedMenu, setSelectedMenu] = useState('all');
  const router = useRouter();
  const { t, language } = useI18n();

  // 用户初始化由 ClientWrapper 处理，这里不需要重复调用

  useEffect(() => {
    async function fetchCredits() {
      if (isLoaded && isSignedIn) {
        const res = await fetch('/api/user/profile');
        if (res.ok) {
          const data = await res.json();
          setCredits(data.credits);
          setTier(data.tier);
        }
      }
    }
    fetchCredits();
  }, [isLoaded, isSignedIn]);

  if (!user?.id) {
    redirect("/");
  }

  // 用户信息优先显示昵称，没有则显示邮箱
  const userDisplay = user?.fullName || user?.primaryEmailAddress?.emailAddress || '--';

  // 内容区渲染
  function renderContent() {
    if (selectedMenu === 'all') {
      return (
        <div>
          <h2 className="text-xl font-semibold mb-4">All Datas Query</h2>
          <a href="/products" className="inline-block text-accent underline hover:underline">Go to All Datas Query Page →</a>
        </div>
      );
    }
    if (selectedMenu === 'hot') {
      return (
        <div>
          <h2 className="text-xl font-semibold mb-4">Hot Products by Category</h2>
          <a href="/products-explorer" className="inline-block text-accent underline hover:underline">Go to Hot Products by Category Page →</a>
        </div>
      );
    }
    return null;
  }

  return (
    <div className="min-h-screen bg-blue-50">
      <Navbar />
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          {/* 头部区域 */}
          <div className="flex flex-col sm:flex-row items-center justify-between bg-white rounded-lg shadow p-6 mb-8 gap-4">
            {/* 左侧：Credits 和 Plan */}
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold text-blue-900">
                {language === 'zh' ? 'credits：' : 'Credits: '}{tier === 'premium' ? (language === 'zh' ? '无限' : 'Unlimited') : credits !== null ? credits : '--'}
              </span>
              {credits !== null && credits <= 5 && tier !== 'premium' && (
                <span className="text-sm bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                  {language === 'zh' ? 'credits不足' : 'Low Credits'}
                </span>
              )}
              <span className="text-lg font-bold text-blue-900">{language === 'zh' ? '套餐：' : 'Plan: '}{tier || '--'}</span>
              {/* 取消订阅按钮紧跟在 Credits/Plan 后面 */}
              <CancelSubscriptionButton tier={tier} onCancelSuccess={() => { setTier('free'); setCredits(0); }} />
            </div>
            {/* 右侧：用户信息和返回首页按钮 */}
            <div className="flex flex-col sm:flex-row gap-4 items-center">
              <span className="text-blue-500 font-medium">{userDisplay}</span>
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition font-semibold"
                onClick={() => router.push('/')}
              >
                {language === 'zh' ? '返回首页' : 'Back to Home'}
              </button>
            </div>
          </div>

          {/* 主体区域：左右布局 */}
          <div className="flex gap-6">
            {/* 左侧菜单栏 */}
            <div className={`bg-white rounded-lg shadow p-4 flex flex-col border border-blue-200 transition-all duration-300 ${menuCollapsed ? 'w-16' : 'w-56'} relative`} style={{ minWidth: menuCollapsed ? 64 : 224 }}>
              <button
                className="absolute -right-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-white border border-blue-600 text-blue-600 rounded-full flex items-center justify-center shadow-lg hover:bg-blue-600 hover:text-white transition z-10"
                onClick={() => setMenuCollapsed(v => !v)}
                title={menuCollapsed ? '展开菜单' : '收起菜单'}
              >
                {menuCollapsed ? <span style={{fontSize: 18}}>→</span> : <span style={{fontSize: 18}}>←</span>}
              </button>
              <nav className="flex-1 flex flex-col gap-2 mt-6">
                {MENU_ITEMS.map(item => (
                  <button
                    key={item.key}
                    className={`text-left px-3 py-2 rounded font-semibold transition-all
                      ${selectedMenu === item.key ? 'bg-blue-600 text-white' : 'text-blue-900 hover:bg-blue-100'}`}
                    style={{ display: menuCollapsed ? 'none' : 'block' }}
                    onClick={() => setSelectedMenu(item.key)}
                  >
                    {item.label}
                  </button>
                ))}
                {/* 菜单收起时显示图标按钮 */}
                {menuCollapsed && (
                  <div className="flex flex-col gap-2">
                    {MENU_ITEMS.map(item => (
                      <button
                        key={item.key}
                        className={`w-8 h-8 rounded-full flex items-center justify-center
                          ${selectedMenu === item.key ? 'bg-blue-600 text-white' : 'text-blue-900 hover:bg-blue-100'}`}
                        onClick={() => setSelectedMenu(item.key)}
                        title={item.label}
                      >
                        {item.key === 'all' ? 'A' : item.key === 'hot' ? 'H' : 'G'}
                      </button>
                    ))}
                  </div>
                )}
              </nav>
            </div>
            {/* 右侧内容区 */}
            <div className="flex-1 bg-white rounded-lg shadow p-6 min-h-[400px] text-blue-900 ml-[-1px]">
              {selectedMenu === 'all' && <ProductsContent credits={credits} setCredits={setCredits} tier={tier} />}
              {selectedMenu === 'hot' && <ProductsExplorerContent credits={credits} setCredits={setCredits} />}
              {selectedMenu === 'growth' && <TopGrowthProducts credits={credits} setCredits={setCredits} period="weekly" />}
              {selectedMenu === 'growth_monthly' && <TopGrowthProducts credits={credits} setCredits={setCredits} period="monthly" />}
              {selectedMenu === 'favorites' && <ProductFavorites />}
              {selectedMenu === 'subscribe' && <WeeklyEmailSubscription />}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
