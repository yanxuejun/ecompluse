export const en = {
  // Navigation
  navbar: {
    logo: "EcomPulse",
    trends: "Trend Reports",
    rankings: "Rankings",
    pricing: "Pricing",
    login: "Login",
    register: "Free Register",
    dashboard: "Dashboard"
  },

  // Homepage Hero Section
  hero: {
    title: "Discover the Next Global Hit Product.",
    subtitle: "Based on Google's official product data, gain market insights and seize sales opportunities.",
    primaryCTA: "Explore Hot Trends Free →",
    secondaryCTA: "How It Works"
  },

  // Data Statistics Section
  dataStats: {
    countries: {
      title: "Countries Covered",
      description: "Global Market Coverage",
      value: "36"
    },
    categories: {
      title: "Product Categories",
      description: "Rich Product Classification",
      value: "4K+"
    },
    products: {
      title: "BigQuery Product Data Filter",
      description: "Massive Product Information",
      value: "Billion+"
    },
    brands: {
      title: "Famous Brands",
      description: "Comprehensive Brand Coverage",
      value: "80K+"
    }
  },

  // Product Data Filter Page (move from dataStats.products)
  products: {
    title: "BigQuery Product Data Filter",
    filters: {
      country: "Country",
      title: "Product Title (Fuzzy)",
      category: "Category ID",
      brand: "Brand",
      minRank: "Min Rank",
      maxRank: "Max Rank",
      minPrice: "Min Price",
      maxPrice: "Max Price",
      onlyNoBrand: "Only show no brand",
      more: "More Filters"
    },
    querying: "Querying...",
    query: "Query",
    loading: "Loading...",
    table: {
      rank: "Rank",
      country: "Country",
      category: "Category",
      brand: "Brand",
      productTitle: "Product Title",
      previousRank: "Previous Rank",
      priceRange: "Price Range",
      relativeDemand: "Relative Demand",
      previousRelativeDemand: "Previous Relative Demand",
      rankTimestamp: "Rank Timestamp",
      time: "Time"
    },
    creditsLoading: "Loading user info, please try again later",
    creditsNotEnough: "Insufficient credits! Please upgrade to premium for unlimited credits, or wait for next month reset.",
    currentCredits: "Current credits",
    creditsDeductFailed: "Failed to deduct credits: ",
    unknownError: "Unknown error",
    querySuccess: "Query successful!",
    creditsDeducted: "Credits deducted",
    creditsUsedUp: "credits used up.",
    networkError: "Network error, please try again later",
    prevPage: "Previous Page",
    nextPage: "Next Page",
    page: "Page",
    total: "Total",
    items: "items",
    itemsPerPage: "items/page"
  },

  // Social Proof Section
  socialProof: {
    trustText: "Trusted by thousands of e-commerce sellers worldwide",
    partners: [
      { name: "Shopify" },
      { name: "WooCommerce" },
      { name: "Amazon" }
    ]
  },

  // Features Section
  features: {
    title: "Core Features",
    items: [
      {
        icon: "📈",
        title: "Track Market Hotspots",
        description: "View weekly Top 100 product and brand rankings from over 20 countries/regions."
      },
      {
        icon: "🚀",
        title: "Discover Rising Stars",
        description: "Exclusive algorithm identifies potential hit products with rapidly growing demand."
      },
      {
        icon: "⚠️",
        title: "Avoid Inventory Risks",
        description: "Early detection of declining demand products, smart inventory management."
      }
    ]
  },

  // Trend Preview Section
  trendPreview: {
    title: "This Week's Real-time Trend Overview",
    table: {
      rank: "Rank",
      product: "Product Name",
      change: "Change"
    },
    items: [
      { name: "Smart Watering Timer", change: "+35%", icon: "🟢" },
      { name: "Portable Outdoor Fan", change: "+28%", icon: "🟢" },
      { name: "LED Plant Growth Light", change: "+21%", icon: "🟢" }
    ],
    note: "Data updated weekly. Upgrade to Pro to unlock all data."
  },

  // Products Explorer Page
  productsExplorer: {
    title: "Product Explorer",
    taxonomy: {
      title: "Categories"
    },
    filters: {
      country: "Country",
      countryPlaceholder: "e.g. US",
      priceRange: "Price Range",
      minPrice: "Min",
      maxPrice: "Max",
      brandFilter: "Brand Filter",
      allBrands: "All",
      withBrand: "With Brand",
      withoutBrand: "Without Brand"
    },
    productTable: {
      title: "Product List",
      loading: "Loading...",
      noData: "No data available",
      columns: {
        rank: "Rank",
        productTitle: "Product Title",
        country: "Country",
        priceRange: "Price Range",
        brand: "Brand"
      }
    },
    pagination: {
      previous: "Previous",
      next: "Next",
      pageInfo: "Page {current} / {total} (Total {count} items)",
      pageSize: "{size} items/page"
    }
  },

  // Footer CTA Section
  footer: {
    title: "Ready to Drive Your Business with Data?",
    pricing: {
      free: {
        name: "Free",
        price: "$0"
      },
      pro: {
        name: "Pro",
        price: "$29/month"
      }
    },
    cta: "Start Free Now →"
  },

  // Common
  common: {
    loading: "Loading...",
    error: "Error occurred",
    retry: "Retry",
    welcome: "Welcome"
  }
}; 