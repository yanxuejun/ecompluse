export const zh = {
  // 导航栏
  navbar: {
    logo: "EcomPulse",
    trends: "趋势报告",
    rankings: "排行榜",
    pricing: "定价",
    login: "登录",
    register: "免费注册",
    dashboard: "仪表板"
  },

  // 首页Hero区域
  hero: {
    title: "发现下一个全球爆款。",
    subtitle: "基于 Google 官方产品数据，洞察市场趋势，抢占销售先机。",
    primaryCTA: "免费探索热门趋势 →",
    secondaryCTA: "查看工作原理"
  },

  // 数据统计区
  dataStats: {
    countries: {
      title: "覆盖国家",
      description: "全球市场覆盖",
      value: "36"
    },
    categories: {
      title: "产品类目",
      description: "丰富产品分类",
      value: "4K+"
    },
    products: {
      title: "BigQuery 产品数据筛选",
      description: "海量产品信息",
      value: "亿级"
    },
    brands: {
      title: "知名品牌",
      description: "品牌全面覆盖",
      value: "8万+"
    }
  },

  // 社会认同区
  socialProof: {
    trustText: "深受全球上千位电商卖家的信赖",
    partners: [
      { name: "Shopify" },
      { name: "WooCommerce" },
      { name: "Amazon" }
    ]
  },

  // 功能展示区
  features: {
    title: "核心功能",
    items: [
      {
        icon: "📈",
        title: "追踪市场热点",
        description: "查看超过20个国家/地区的每周产品和品牌Top 100排行榜。"
      },
      {
        icon: "🚀",
        title: "发现上升之星",
        description: "独家算法识别需求快速增长的潜力爆款，告别选品烦恼。"
      },
      {
        icon: "⚠️",
        title: "规避库存风险",
        description: "提前发现需求下滑的产品，智能管理库存，减少损失。"
      }
    ]
  },

  // 趋势预览区
  trendPreview: {
    title: "本周实时趋势速览",
    table: {
      rank: "排名",
      product: "产品名称",
      change: "变化"
    },
    items: [
      { name: "智能浇水计时器", change: "+35%", icon: "🟢" },
      { name: "便携式户外风扇", change: "+28%", icon: "🟢" },
      { name: "LED 植物生长灯", change: "+21%", icon: "🟢" }
    ],
    note: "数据每周一更新。升级到专业版解锁全部数据。"
  },

  // 产品探索页面
  productsExplorer: {
    title: "产品探索",
    taxonomy: {
      title: "目录"
    },
    filters: {
      country: "国家",
      countryPlaceholder: "如 US",
      priceRange: "价格范围",
      minPrice: "最低",
      maxPrice: "最高",
      brandFilter: "包含品牌",
      allBrands: "全部",
      withBrand: "有品牌",
      withoutBrand: "无品牌"
    },
    productTable: {
      title: "产品列表",
      loading: "加载中...",
      noData: "暂无数据",
      columns: {
        rank: "排名",
        productTitle: "产品标题",
        country: "国家",
        priceRange: "价格范围",
        brand: "品牌"
      }
    },
    pagination: {
      previous: "上一页",
      next: "下一页",
      pageInfo: "第 {current} / {total} 页（共 {count} 条）",
      pageSize: "{size} 条/页"
    }
  },

  // 产品数据筛选页面
  products: {
    title: "BigQuery 产品数据筛选",
    filters: {
      country: "国家",
      title: "产品标题(模糊)",
      category: "品类ID",
      brand: "品牌",
      minRank: "最小排名",
      maxRank: "最大排名",
      minPrice: "最低价格",
      maxPrice: "最高价格",
      onlyNoBrand: "只看无品牌"
    },
    querying: "查询中...",
    query: "查询",
    loading: "加载中...",
    table: {
      rank: "排名",
      country: "国家",
      category: "品类",
      brand: "品牌",
      productTitle: "产品标题",
      previousRank: "之前排名",
      priceRange: "价格范围",
      relativeDemand: "相关需求度",
      previousRelativeDemand: "之前需求度",
      rankTimestamp: "排名时间"
    },
    creditsLoading: "正在加载用户信息，请稍后再试",
    creditsNotEnough: "credits不足！请升级到高级套餐获得无限credits，或等待下月credits重置。",
    currentCredits: "当前credits",
    creditsDeductFailed: "扣除credits失败：",
    unknownError: "未知错误",
    querySuccess: "查询成功！",
    creditsDeducted: "已扣除credits",
    creditsUsedUp: "credits已用完。",
    networkError: "网络错误，请稍后重试",
    prevPage: "上一页",
    nextPage: "下一页",
    page: "第",
    total: "共",
    items: "条",
    itemsPerPage: "条/页"
  },

  // 底部CTA区
  footer: {
    title: "准备好用数据驱动您的业务了吗？",
    pricing: {
      free: {
        name: "免费版",
        price: "¥0"
      },
      pro: {
        name: "专业版",
        price: "¥29/月"
      }
    },
    cta: "立即免费开始 →"
  },

  // 通用
  common: {
    loading: "加载中...",
    error: "出错了",
    retry: "重试",
    welcome: "欢迎"
  }
}; 