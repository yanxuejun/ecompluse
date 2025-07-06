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

// 高级趋势分析 - 在 SQL 中直接计算所有指标
async function getAdvancedMomentumAnalysis(country, categoryId, limit = 50, daysBack = 7) {
  try {
    console.log(`🚀 Advanced momentum analysis for country: ${country}, category: ${categoryId}`);
    
    const query = `
      WITH current_rankings AS (
        SELECT 
          COALESCE(
            (SELECT name FROM UNNEST(product_title) WHERE locale = 'en'),
            (SELECT name FROM UNNEST(product_title) LIMIT 1)
          ) AS product_title,
          rank AS current_rank,
          relative_demand AS current_relative_demand,
          rank_timestamp AS current_timestamp
        FROM \`${config.bigquery.projectId}.${config.bigquery.datasetId}.${config.bigquery.tableId}\`
        WHERE ranking_country = @country 
          AND ranking_category = @categoryId
          AND rank_timestamp = (
            SELECT MAX(rank_timestamp) 
            FROM \`${config.bigquery.projectId}.${config.bigquery.datasetId}.${config.bigquery.tableId}\`
            WHERE ranking_country = @country 
              AND ranking_category = @categoryId
          )
      ),
      previous_rankings AS (
        SELECT 
          COALESCE(
            (SELECT name FROM UNNEST(product_title) WHERE locale = 'en'),
            (SELECT name FROM UNNEST(product_title) LIMIT 1)
          ) AS product_title,
          rank AS previous_rank,
          relative_demand AS previous_relative_demand,
          rank_timestamp AS previous_timestamp
        FROM \`${config.bigquery.projectId}.${config.bigquery.datasetId}.${config.bigquery.tableId}\`
        WHERE ranking_country = @country 
          AND ranking_category = @categoryId
          AND rank_timestamp <= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL @daysBack DAY)
          AND rank_timestamp = (
            SELECT MAX(rank_timestamp) 
            FROM \`${config.bigquery.projectId}.${config.bigquery.datasetId}.${config.bigquery.tableId}\` prev
            WHERE prev.ranking_country = @country 
              AND prev.ranking_category = @categoryId
              AND prev.rank_timestamp <= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL @daysBack DAY)
              AND prev.product_title = \`${config.bigquery.projectId}.${config.bigquery.datasetId}.${config.bigquery.tableId}\`.product_title
          )
      ),
      momentum_analysis AS (
        SELECT 
          c.product_title,
          c.current_rank,
          p.previous_rank,
          -- 动态计算排名变化
          (p.previous_rank - c.current_rank) AS rank_improvement,
          c.current_relative_demand,
          p.previous_relative_demand,
          -- 动态计算需求变化
          (c.current_relative_demand - p.previous_relative_demand) AS demand_change,
          -- 动态计算动量分数 (排名变化权重70% + 需求变化权重30%)
          ((p.previous_rank - c.current_rank) * 0.7 + (c.current_relative_demand - p.previous_relative_demand) * 0.3) AS momentum_score,
          -- 动态判断趋势类型
          CASE 
            WHEN (p.previous_rank - c.current_rank) > 0 AND (c.current_relative_demand - p.previous_relative_demand) > 0 THEN 'ROCKET_RISING'
            WHEN (p.previous_rank - c.current_rank) > 0 AND (c.current_relative_demand - p.previous_relative_demand) < 0 THEN 'RANK_IMPROVING'
            WHEN (p.previous_rank - c.current_rank) < 0 AND (c.current_relative_demand - p.previous_relative_demand) > 0 THEN 'DEMAND_INCREASING'
            WHEN (p.previous_rank - c.current_rank) < 0 AND (c.current_relative_demand - p.previous_relative_demand) < 0 THEN 'DECLINING'
            WHEN (p.previous_rank - c.current_rank) = 0 AND (c.current_relative_demand - p.previous_relative_demand) > 0 THEN 'STABLE_GROWING'
            WHEN (p.previous_rank - c.current_rank) = 0 AND (c.current_relative_demand - p.previous_relative_demand) < 0 THEN 'STABLE_DECLINING'
            WHEN (p.previous_rank - c.current_rank) = 0 AND (c.current_relative_demand - p.previous_relative_demand) = 0 THEN 'STABLE'
            ELSE 'UNKNOWN'
          END AS trend_type,
          -- 计算时间间隔
          TIMESTAMP_DIFF(c.current_timestamp, p.previous_timestamp, DAY) AS days_between_rankings,
          c.current_timestamp,
          p.previous_timestamp
        FROM current_rankings c
        LEFT JOIN previous_rankings p ON c.product_title = p.product_title
        WHERE p.previous_rank IS NOT NULL
      ),
      new_products AS (
        SELECT 
          c.product_title,
          c.current_rank,
          NULL AS previous_rank,
          NULL AS rank_improvement,
          c.current_relative_demand,
          NULL AS previous_relative_demand,
          NULL AS demand_change,
          0 AS momentum_score,
          'NEW_PRODUCT' AS trend_type,
          NULL AS days_between_rankings,
          c.current_timestamp,
          NULL AS previous_timestamp
        FROM current_rankings c
        LEFT JOIN previous_rankings p ON c.product_title = p.product_title
        WHERE p.previous_rank IS NULL
      )
      SELECT * FROM momentum_analysis
      UNION ALL
      SELECT * FROM new_products
      ORDER BY momentum_score DESC
      LIMIT @limit
    `;

    console.log('🔍 Advanced Momentum Analysis Query:');
    console.log(query);
    console.log('📊 Query Parameters:', {
      country: country,
      categoryId: categoryId,
      daysBack: daysBack,
      limit: limit
    });

    const options = {
      query: query,
      params: {
        country: country,
        categoryId: categoryId,
        daysBack: daysBack,
        limit: limit
      }
    };

    const [rows] = await bigquery.query(options);
    console.log(`Found ${rows.length} products with advanced momentum analysis`);
    
    return rows;
  } catch (error) {
    console.error('Error in advanced momentum analysis:', error);
    throw error;
  }
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

// 保存高级趋势分析结果到 BigQuery
async function saveAdvancedMomentumAnalysisToBigQuery(momentumData, country, categoryId) {
  try {
    console.log(`💾 Saving ${momentumData.length} advanced momentum analysis results to BigQuery`);
    
    const dataset = bigquery.dataset(config.bigquery.datasetId);
    const table = dataset.table('product_advanced_momentum_analysis');
    
    // 准备插入数据
    const rows = momentumData.map(item => ({
      product_title: item.product_title,
      current_rank: item.current_rank,
      previous_rank: item.previous_rank,
      rank_improvement: item.rank_improvement,
      current_relative_demand: item.current_relative_demand,
      previous_relative_demand: item.previous_relative_demand,
      demand_change: item.demand_change,
      momentum_score: item.momentum_score,
      trend_type: item.trend_type,
      days_between_rankings: item.days_between_rankings,
      country: country,
      category_id: categoryId,
      analysis_timestamp: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));
    
    console.log('📊 准备插入的高级趋势分析数据行数:', rows.length);
    console.log('📊 示例数据:', rows[0]);
    
    // 使用 insert 方法插入数据
    const [job] = await table.insert(rows);
    
    console.log(`✅ Successfully inserted ${rows.length} advanced momentum analysis results to BigQuery`);
    console.log(`📋 Job ID: ${job.id}`);
    
    return {
      count: rows.length,
      jobId: job.id
    };
  } catch (error) {
    console.error('❌ Error saving advanced momentum analysis to BigQuery:', error);
    throw error;
  }
}

// 生成高级趋势报告
function generateAdvancedTrendReport(momentumData) {
  console.log('\n🚀 高级趋势强度分析报告');
  console.log('='.repeat(60));
  
  // 火箭式上升产品榜
  const rocketRising = momentumData.filter(item => item.trend_type === 'ROCKET_RISING');
  console.log('\n🔥 火箭式上升产品榜:');
  rocketRising.slice(0, 10).forEach((item, index) => {
    console.log(`${index + 1}. ${item.product_title}`);
    console.log(`   排名改善: ${item.previous_rank} → ${item.current_rank} (↑${item.rank_improvement})`);
    console.log(`   需求变化: ${item.previous_relative_demand} → ${item.current_relative_demand} (${item.demand_change > 0 ? '+' : ''}${item.demand_change?.toFixed(2)})`);
    console.log(`   动量分数: ${item.momentum_score?.toFixed(2)}`);
    console.log(`   时间间隔: ${item.days_between_rankings} 天`);
    console.log('');
  });
  
  // 热度飙升榜
  const demandIncreasing = momentumData.filter(item => item.demand_change > 0).sort((a, b) => b.demand_change - a.demand_change);
  console.log('\n📈 热度飙升榜:');
  demandIncreasing.slice(0, 10).forEach((item, index) => {
    console.log(`${index + 1}. ${item.product_title}`);
    console.log(`   需求增长: ${item.previous_relative_demand} → ${item.current_relative_demand} (↑${item.demand_change?.toFixed(2)})`);
    console.log(`   当前排名: ${item.current_rank}`);
    console.log(`   排名变化: ${item.rank_improvement > 0 ? '+' : ''}${item.rank_improvement}`);
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
  
  // 平均指标
  const avgRankImprovement = momentumData.reduce((sum, item) => sum + (item.rank_improvement || 0), 0) / momentumData.length;
  const avgDemandChange = momentumData.reduce((sum, item) => sum + (item.demand_change || 0), 0) / momentumData.length;
  const avgMomentumScore = momentumData.reduce((sum, item) => sum + (item.momentum_score || 0), 0) / momentumData.length;
  
  console.log('\n📈 平均指标:');
  console.log(`平均排名改善: ${avgRankImprovement?.toFixed(2)}`);
  console.log(`平均需求变化: ${avgDemandChange?.toFixed(2)}`);
  console.log(`平均动量分数: ${avgMomentumScore?.toFixed(2)}`);
  
  return {
    rocketRising: rocketRising.slice(0, 10),
    demandIncreasing: demandIncreasing.slice(0, 10),
    trendStats: trendStats,
    averages: {
      avgRankImprovement,
      avgDemandChange,
      avgMomentumScore
    }
  };
}

// 主函数
async function performAdvancedMomentumAnalysis() {
  const { country, categoryId, limit } = config.task;
  
  try {
    console.log('🚀 Starting advanced momentum analysis...');
    console.log('📋 Configuration from config.js:');
    console.log(`   Country: ${country}`);
    console.log(`   Category ID: ${categoryId}`);
    console.log(`   Limit: ${limit}`);
    console.log(`   BigQuery: ${config.bigquery.projectId}.${config.bigquery.datasetId}.${config.bigquery.tableId}`);
    console.log('');
    
    // 1. 获取高级趋势分析数据
    const momentumData = await getAdvancedMomentumAnalysis(country, categoryId, limit, 7);
    
    if (momentumData.length === 0) {
      console.log('No momentum analysis data found');
      return;
    }
    
    // 2. 为趋势产品获取图片信息
    console.log('🖼️ 为趋势产品获取图片信息...');
    const enrichedMomentumData = [];
    
    for (let i = 0; i < momentumData.length; i++) {
      const item = momentumData[i];
      console.log(`Processing momentum item ${i + 1}/${momentumData.length}: ${item.product_title}`);
      
      const searchResult = await searchGoogleProduct(item.product_title);
      
      enrichedMomentumData.push({
        ...item,
        imageUrl: searchResult?.imageUrl || null,
        searchTitle: searchResult?.searchTitle || null,
        searchLink: searchResult?.searchLink || null
      });
      
      // 添加延迟以避免 API 限制
      if (i < momentumData.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    // 3. 保存到 BigQuery
    await saveAdvancedMomentumAnalysisToBigQuery(enrichedMomentumData, country, categoryId);
    
    // 4. 生成趋势报告
    const report = generateAdvancedTrendReport(enrichedMomentumData);
    
    console.log('\n✅ Advanced momentum analysis completed successfully!');
    
    return {
      momentumData: enrichedMomentumData,
      report: report
    };
    
  } catch (error) {
    console.error('Error in advanced momentum analysis:', error);
    throw error;
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  performAdvancedMomentumAnalysis()
    .then((result) => {
      console.log('Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Script failed:', error);
      process.exit(1);
    });
}

module.exports = { performAdvancedMomentumAnalysis }; 