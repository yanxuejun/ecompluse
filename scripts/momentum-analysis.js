const { BigQuery } = require('@google-cloud/bigquery');
const config = require('./config');

// Initialize BigQuery with service account credentials
let bigquery;
if (process.env.GCP_SERVICE_ACCOUNT_JSON) {
  // Use service account JSON directly
  const credentials = JSON.parse(process.env.GCP_SERVICE_ACCOUNT_JSON);
  bigquery = new BigQuery({
    projectId: config.bigquery.projectId,
    credentials: credentials
  });
} else {
  // Fallback to key file
  bigquery = new BigQuery({
    projectId: config.bigquery.projectId,
    keyFilename: config.bigquery.keyFilename
  });
}

// 检查必要的环境变量
if (!config.googleSearch.apiKey) {
  console.error('GOOGLE_SEARCH_API_KEY is not set in .env file');
  process.exit(1);
}

if (!config.googleSearch.engineId) {
  console.error('GOOGLE_SEARCH_ENGINE_ID is not set in .env file');
  process.exit(1);
}

// 获取当前排名数据
async function getCurrentRankings(country, categoryId, limit = 50) {
  try {
    console.log(`📊 Fetching current rankings for country: ${country}, category: ${categoryId}`);
    
    const query = `
      SELECT 
        COALESCE(
          (SELECT name FROM UNNEST(product_title) WHERE locale = 'en'),
          (SELECT name FROM UNNEST(product_title) LIMIT 1)
        ) AS product_title,
        rank,
        relative_demand,
        rank_timestamp,
        -- 动态计算列
        rank AS current_rank,
        relative_demand AS current_relative_demand
      FROM \`${config.bigquery.projectId}.${config.bigquery.datasetId}.${config.bigquery.tableId}\`
      WHERE ranking_country = @country 
        AND ranking_category = @categoryId
      ORDER BY rank ASC
      LIMIT @limit
    `;

    console.log('🔍 Current Rankings Query:');
    console.log(query);
    console.log('📊 Query Parameters:', {
      country: country,
      categoryId: categoryId,
      limit: limit
    });

    const options = {
      query: query,
      params: {
        country: country,
        categoryId: categoryId,
        limit: limit
      }
    };

    const [rows] = await bigquery.query(options);
    console.log(`Found ${rows.length} current products`);
    
    return rows;
  } catch (error) {
    console.error('Error fetching current rankings:', error);
    throw error;
  }
}

// 获取历史排名数据（前一周）
async function getPreviousRankings(country, categoryId, daysBack = 7) {
  try {
    console.log(`📊 Fetching previous rankings (${daysBack} days back) for country: ${country}, category: ${categoryId}`);
    
    const query = `
      SELECT 
        COALESCE(
          (SELECT name FROM UNNEST(product_title) WHERE locale = 'en'),
          (SELECT name FROM UNNEST(product_title) LIMIT 1)
        ) AS product_title,
        rank,
        relative_demand,
        rank_timestamp,
        -- 动态计算列
        rank AS previous_rank,
        relative_demand AS previous_relative_demand
      FROM \`${config.bigquery.projectId}.${config.bigquery.datasetId}.${config.bigquery.tableId}\`
      WHERE ranking_country = @country 
        AND ranking_category = @categoryId
        AND rank_timestamp <= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL @daysBack DAY)
      ORDER BY rank_timestamp DESC, rank ASC
      LIMIT @limit
    `;

    console.log('🔍 Previous Rankings Query:');
    console.log(query);
    console.log('📊 Query Parameters:', {
      country: country,
      categoryId: categoryId,
      daysBack: daysBack,
      limit: 100
    });

    const options = {
      query: query,
      params: {
        country: country,
        categoryId: categoryId,
        daysBack: daysBack,
        limit: 100
      }
    };

    const [rows] = await bigquery.query(options);
    console.log(`Found ${rows.length} previous products`);
    
    return rows;
  } catch (error) {
    console.error('Error fetching previous rankings:', error);
    throw error;
  }
}

// 分析趋势强度
function analyzeMomentum(currentRankings, previousRankings) {
  console.log('🔍 Analyzing momentum trends...');
  
  const momentumAnalysis = [];
  
  // 创建当前排名的映射
  const currentMap = new Map();
  currentRankings.forEach(item => {
    currentMap.set(item.product_title, {
      rank: item.rank,
      relative_demand: item.relative_demand,
      rank_timestamp: item.rank_timestamp
    });
  });
  
  // 创建历史排名的映射（取最新的历史数据）
  const previousMap = new Map();
  const processedTitles = new Set();
  
  previousRankings.forEach(item => {
    if (!processedTitles.has(item.product_title)) {
      previousMap.set(item.product_title, {
        rank: item.rank,
        relative_demand: item.relative_demand,
        rank_timestamp: item.rank_timestamp
      });
      processedTitles.add(item.product_title);
    }
  });
  
  // 分析每个产品的趋势
  currentRankings.forEach(current => {
    const previous = previousMap.get(current.product_title);
    
    if (previous) {
      const rankChange = previous.rank - current.rank; // 正值表示排名上升
      const demandChange = current.relative_demand - previous.relative_demand;
      const momentumScore = rankChange * 0.7 + demandChange * 0.3; // 权重计算
      
      momentumAnalysis.push({
        product_title: current.product_title,
        current_rank: current.rank,
        previous_rank: previous.rank,
        rank_change: rankChange,
        current_relative_demand: current.relative_demand,
        previous_relative_demand: previous.relative_demand,
        demand_change: demandChange,
        momentum_score: momentumScore,
        trend_type: getTrendType(rankChange, demandChange)
      });
    } else {
      // 新产品，没有历史数据
      momentumAnalysis.push({
        product_title: current.product_title,
        current_rank: current.rank,
        previous_rank: null,
        rank_change: null,
        current_relative_demand: current.relative_demand,
        previous_relative_demand: null,
        demand_change: null,
        momentum_score: 0,
        trend_type: 'NEW_PRODUCT'
      });
    }
  });
  
  // 按动量分数排序
  momentumAnalysis.sort((a, b) => b.momentum_score - a.momentum_score);
  
  return momentumAnalysis;
}

// 判断趋势类型
function getTrendType(rankChange, demandChange) {
  if (rankChange > 0 && demandChange > 0) return 'ROCKET_RISING'; // 火箭式上升
  if (rankChange > 0 && demandChange < 0) return 'RANK_IMPROVING'; // 排名改善
  if (rankChange < 0 && demandChange > 0) return 'DEMAND_INCREASING'; // 需求增长
  if (rankChange < 0 && demandChange < 0) return 'DECLINING'; // 下降趋势
  if (rankChange === 0 && demandChange > 0) return 'STABLE_GROWING'; // 稳定增长
  if (rankChange === 0 && demandChange < 0) return 'STABLE_DECLINING'; // 稳定下降
  return 'STABLE'; // 稳定
}

// 调用 Google Custom Search API 获取产品图片
async function searchGoogleProduct(productTitle) {
  try {
    const searchQuery = encodeURIComponent(productTitle);
    const url = `https://www.googleapis.com/customsearch/v1?key=${config.googleSearch.apiKey}&cx=${config.googleSearch.engineId}&q=${searchQuery}&searchType=image&num=1`;
    
    console.log(`Searching for: ${productTitle}`);
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (!response.ok) {
      console.error('Google Search API error:', data);
      return null;
    }
    
    if (data.items && data.items.length > 0) {
      const firstResult = data.items[0];
      return {
        imageUrl: firstResult.link,
        searchTitle: firstResult.title,
        searchLink: firstResult.image?.contextLink || firstResult.link
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error searching Google:', error);
    return null;
  }
}

// 保存趋势分析结果到 BigQuery
async function saveMomentumAnalysisToBigQuery(momentumData, country, categoryId) {
  try {
    console.log(`💾 Saving ${momentumData.length} momentum analysis results to BigQuery`);
    
    const dataset = bigquery.dataset(config.bigquery.datasetId);
    const table = dataset.table('product_momentum_analysis');
    
    // 准备插入数据
    const rows = momentumData.map(item => ({
      product_title: item.product_title,
      current_rank: item.current_rank,
      previous_rank: item.previous_rank,
      rank_change: item.rank_change,
      current_relative_demand: item.current_relative_demand,
      previous_relative_demand: item.previous_relative_demand,
      demand_change: item.demand_change,
      momentum_score: item.momentum_score,
      trend_type: item.trend_type,
      country: country,
      category_id: categoryId,
      analysis_timestamp: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));
    
    console.log('📊 准备插入的趋势分析数据行数:', rows.length);
    console.log('📊 示例数据:', rows[0]);
    
    // 使用 insert 方法插入数据
    const [job] = await table.insert(rows);
    
    console.log(`✅ Successfully inserted ${rows.length} momentum analysis results to BigQuery`);
    console.log(`📋 Job ID: ${job.id}`);
    
    return {
      count: rows.length,
      jobId: job.id
    };
  } catch (error) {
    console.error('❌ Error saving momentum analysis to BigQuery:', error);
    throw error;
  }
}

// 生成趋势报告
function generateTrendReport(momentumData) {
  console.log('\n🚀 趋势强度分析报告');
  console.log('='.repeat(50));
  
  // 火箭式上升产品榜
  const rocketRising = momentumData.filter(item => item.trend_type === 'ROCKET_RISING');
  console.log('\n🔥 火箭式上升产品榜:');
  rocketRising.slice(0, 10).forEach((item, index) => {
    console.log(`${index + 1}. ${item.product_title}`);
    console.log(`   排名变化: ${item.previous_rank} → ${item.current_rank} (↑${item.rank_change})`);
    console.log(`   需求变化: ${item.previous_relative_demand} → ${item.current_relative_demand} (${item.demand_change > 0 ? '+' : ''}${item.demand_change})`);
    console.log(`   动量分数: ${item.momentum_score.toFixed(2)}`);
    console.log('');
  });
  
  // 热度飙升榜
  const demandIncreasing = momentumData.filter(item => item.demand_change > 0).sort((a, b) => b.demand_change - a.demand_change);
  console.log('\n📈 热度飙升榜:');
  demandIncreasing.slice(0, 10).forEach((item, index) => {
    console.log(`${index + 1}. ${item.product_title}`);
    console.log(`   需求增长: ${item.previous_relative_demand} → ${item.current_relative_demand} (↑${item.demand_change})`);
    console.log(`   当前排名: ${item.current_rank}`);
    console.log('');
  });
  
  // 趋势统计
  const trendStats = {};
  momentumData.forEach(item => {
    trendStats[item.trend_type] = (trendStats[item.trend_type] || 0) + 1;
  });
  
  console.log('\n📊 趋势分布统计:');
  Object.entries(trendStats).forEach(([trend, count]) => {
    console.log(`${trend}: ${count} 个产品`);
  });
  
  return {
    rocketRising: rocketRising.slice(0, 10),
    demandIncreasing: demandIncreasing.slice(0, 10),
    trendStats: trendStats
  };
}

// 主函数
async function performMomentumAnalysis() {
  const { country, categoryId, limit } = config.task;
  
  try {
    console.log('🚀 Starting momentum analysis...');
    console.log('📋 Configuration from config.js:');
    console.log(`   Country: ${country}`);
    console.log(`   Category ID: ${categoryId}`);
    console.log(`   Limit: ${limit}`);
    console.log(`   BigQuery: ${config.bigquery.projectId}.${config.bigquery.datasetId}.${config.bigquery.tableId}`);
    console.log('');
    
    // 1. 获取当前排名数据
    const currentRankings = await getCurrentRankings(country, categoryId, limit);
    
    if (currentRankings.length === 0) {
      console.log('No current rankings found in BigQuery');
      return;
    }
    
    // 2. 获取历史排名数据
    const previousRankings = await getPreviousRankings(country, categoryId, 7);
    
    // 3. 分析趋势强度
    const momentumAnalysis = analyzeMomentum(currentRankings, previousRankings);
    
    // 4. 为趋势产品获取图片信息
    console.log('🖼️ 为趋势产品获取图片信息...');
    const enrichedMomentumData = [];
    
    for (let i = 0; i < momentumAnalysis.length; i++) {
      const item = momentumAnalysis[i];
      console.log(`Processing momentum item ${i + 1}/${momentumAnalysis.length}: ${item.product_title}`);
      
      const searchResult = await searchGoogleProduct(item.product_title);
      
      enrichedMomentumData.push({
        ...item,
        imageUrl: searchResult?.imageUrl || null,
        searchTitle: searchResult?.searchTitle || null,
        searchLink: searchResult?.searchLink || null
      });
      
      // 添加延迟以避免 API 限制
      if (i < momentumAnalysis.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    // 5. 保存到 BigQuery
    await saveMomentumAnalysisToBigQuery(enrichedMomentumData, country, categoryId);
    
    // 6. 生成趋势报告
    const report = generateTrendReport(enrichedMomentumData);
    
    console.log('\n✅ Momentum analysis completed successfully!');
    
    return {
      momentumData: enrichedMomentumData,
      report: report
    };
    
  } catch (error) {
    console.error('Error in momentum analysis:', error);
    throw error;
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  performMomentumAnalysis()
    .then((result) => {
      console.log('Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Script failed:', error);
      process.exit(1);
    });
}

module.exports = { performMomentumAnalysis }; 