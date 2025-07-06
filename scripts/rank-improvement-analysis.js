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

// 从 BestSellers_TopProducts_Optimized 表获取排名上升分析
async function getRankImprovementAnalysis(country, categoryId, limit = 10) {
  try {
    console.log(`🚀 Analyzing rank improvement for country: ${country}, category: ${categoryId}`);
    
    // 构建查询条件
    let categoryCondition = '';
    let categoryParams = {};
    
    if (categoryId === '123456') {
      // 当 categoryId=0000 时，去掉 ranking_category 条件，检索所有目录
      categoryCondition = '';
      console.log('📊 检索所有目录的排名数据');
    } else {
      // 正常按分类检索
      categoryCondition = 'AND ranking_category = @categoryId';
      categoryParams = { categoryId: categoryId };
      console.log(`📊 检索分类 ${categoryId} 的排名数据`);
    }
    
    const query = `
      SELECT 
        COALESCE(
          (SELECT name FROM UNNEST(product_title) WHERE locale = 'en'),
          (SELECT name FROM UNNEST(product_title) LIMIT 1)
        ) AS product_title,
        rank AS current_rank,
        rank_improvement,
        relative_demand AS current_relative_demand,
        rank_timestamp,
        ranking_category
      FROM \`${config.bigquery.projectId}.${config.bigquery.datasetId}.${config.bigquery.tableId}\`
      WHERE ranking_country = @country 
        ${categoryCondition}
        AND rank_improvement > 0  -- 只选择排名上升的产品
        AND rank_timestamp = (
          SELECT MAX(rank_timestamp) 
          FROM \`${config.bigquery.projectId}.${config.bigquery.datasetId}.${config.bigquery.tableId}\`
          WHERE ranking_country = @country 
            ${categoryCondition}
        )
      ORDER BY rank_improvement DESC  -- 按排名改善降序排序
      LIMIT @limit
    `;

    console.log('🔍 Rank Improvement Analysis Query:');
    console.log(query);
    console.log('📊 Query Parameters:', {
      country: country,
      categoryId: categoryId,
      limit: limit,
      ...categoryParams
    });

    const options = {
      query: query,
      params: {
        country: country,
        limit: limit,
        ...categoryParams
      }
    };

    const [rows] = await bigquery.query(options);
    console.log(`Found ${rows.length} products with rank improvement`);
    
    return rows;
  } catch (error) {
    console.error('Error in rank improvement analysis:', error);
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

// 保存排名上升分析结果到 BigQuery
async function saveRankImprovementAnalysisToBigQuery(rankData, country, categoryId) {
  try {
    console.log(`💾 Saving ${rankData.length} rank improvement analysis results to BigQuery`);
    
    const dataset = bigquery.dataset(config.bigquery.datasetId);
    const table = dataset.table('product_momentum_analysis');
    
    // 准备插入数据，确保字段名称与表结构一致
    const rows = rankData.map(item => ({
      product_title: item.product_title || '',
      current_rank: parseInt(item.current_rank) || 0,
      previous_rank: parseInt(item.current_rank + item.rank_improvement) || 0,
      rank_change: parseInt(item.rank_improvement) || 0, // 表字段名是 rank_change
      current_relative_demand: parseFloat(item.current_relative_demand) || 0.0,
      previous_relative_demand: parseFloat(item.current_relative_demand) || 0.0,
      demand_change: 0.0,
      momentum_score: parseFloat(item.rank_improvement) || 0.0,
      trend_type: 'ROCKET_RISING',
      country: country || '',
      category_id: item.ranking_category || categoryId || '',
      image_url: item.imageUrl || '',
      search_title: item.searchTitle || '',
      search_link: item.searchLink || '',
      analysis_timestamp: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));
    
    console.log('📊 准备插入的排名上升分析数据行数:', rows.length);
    console.log('📊 示例数据:', JSON.stringify(rows[0], null, 2));
    
    // 使用 insert 方法插入数据，添加错误处理
    try {
      const [job] = await table.insert(rows);
      console.log(`✅ Successfully inserted ${rows.length} rank improvement analysis results to BigQuery`);
      console.log(`📋 Job ID: ${job.id}`);
      
      return {
        count: rows.length,
        jobId: job.id
      };
    } catch (insertError) {
      console.error('❌ Insert error details:', insertError);
      
      // 如果插入失败，尝试逐行插入以识别问题行
      console.log('🔄 Attempting row-by-row insertion to identify problematic rows...');
      let successCount = 0;
      let errorCount = 0;
      
      for (let i = 0; i < rows.length; i++) {
        try {
          await table.insert([rows[i]]);
          successCount++;
          console.log(`✅ Row ${i + 1} inserted successfully`);
        } catch (rowError) {
          errorCount++;
          console.error(`❌ Row ${i + 1} failed:`, rowError.message);
          console.error(`❌ Problematic row data:`, JSON.stringify(rows[i], null, 2));
        }
      }
      
      console.log(`📊 Insertion summary: ${successCount} successful, ${errorCount} failed`);
      
      return {
        count: successCount,
        errors: errorCount,
        jobId: null
      };
    }
  } catch (error) {
    console.error('❌ Error saving rank improvement analysis to BigQuery:', error);
    throw error;
  }
}

// 生成排名上升报告
function generateRankImprovementReport(rankData) {
  console.log('\n🚀 排名上升分析报告');
  console.log('='.repeat(50));
  
  console.log('\n🔥 火箭式上升产品榜 (按排名改善降序):');
  rankData.forEach((item, index) => {
    console.log(`${index + 1}. ${item.product_title}`);
    console.log(`   当前排名: ${item.current_rank}`);
    console.log(`   排名改善: ↑${item.rank_improvement} 位`);
    console.log(`   相对需求: ${item.current_relative_demand ? parseFloat(item.current_relative_demand).toFixed(2) : 'N/A'}`);
    console.log(`   分类ID: ${item.ranking_category || 'N/A'}`);
    console.log(`   数据时间: ${item.rank_timestamp ? new Date(item.rank_timestamp).toLocaleString() : 'N/A'}`);
    console.log('');
  });
  
  // 统计信息
  const totalImprovement = rankData.reduce((sum, item) => sum + (parseInt(item.rank_improvement) || 0), 0);
  const avgImprovement = totalImprovement / rankData.length;
  const maxImprovement = Math.max(...rankData.map(item => parseInt(item.rank_improvement) || 0));
  
  // 分类统计
  const categoryStats = {};
  rankData.forEach(item => {
    const category = item.ranking_category || 'Unknown';
    if (!categoryStats[category]) {
      categoryStats[category] = { count: 0, totalImprovement: 0 };
    }
    categoryStats[category].count++;
    categoryStats[category].totalImprovement += parseInt(item.rank_improvement) || 0;
  });
  
  console.log('\n📊 统计信息:');
  console.log(`总排名改善: ${totalImprovement}`);
  console.log(`平均排名改善: ${avgImprovement?.toFixed(2)}`);
  console.log(`最大排名改善: ${maxImprovement}`);
  console.log(`分析产品数量: ${rankData.length}`);
  
  console.log('\n📊 分类统计:');
  Object.entries(categoryStats).forEach(([category, stats]) => {
    console.log(`分类 ${category}: ${stats.count} 个产品，总改善 ${stats.totalImprovement} 位`);
  });
  
  return {
    rankData: rankData,
    stats: {
      totalImprovement,
      avgImprovement,
      maxImprovement,
      count: rankData.length,
      categoryStats
    }
  };
}

// 主函数
async function performRankImprovementAnalysis() {
  const { country, categoryId, limit } = config.task;
  
  try {
    console.log('🚀 Starting rank improvement analysis...');
    console.log('📋 Configuration from config.js:');
    console.log(`   Country: ${country}`);
    console.log(`   Category ID: ${categoryId}`);
    console.log(`   Limit: ${limit}`);
    console.log(`   BigQuery: ${config.bigquery.projectId}.${config.bigquery.datasetId}.${config.bigquery.tableId}`);
    console.log('');
    
    // 1. 获取排名上升分析数据
    const rankData = await getRankImprovementAnalysis(country, categoryId, limit);
    
    if (rankData.length === 0) {
      console.log('No rank improvement data found');
      return;
    }
    
    // 2. 为排名上升产品获取图片信息
    console.log('🖼️ 为排名上升产品获取图片信息...');
    const enrichedRankData = [];
    
    for (let i = 0; i < rankData.length; i++) {
      const item = rankData[i];
      console.log(`Processing rank improvement item ${i + 1}/${rankData.length}: ${item.product_title}`);
      
      const searchResult = await searchGoogleProduct(item.product_title);
      
      enrichedRankData.push({
        ...item,
        imageUrl: searchResult?.imageUrl || null,
        searchTitle: searchResult?.searchTitle || null,
        searchLink: searchResult?.searchLink || null
      });
      
      // 添加延迟以避免 API 限制
      if (i < rankData.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    // 3. 保存到 BigQuery
    await saveRankImprovementAnalysisToBigQuery(enrichedRankData, country, categoryId);
    
    // 4. 生成排名上升报告
    const report = generateRankImprovementReport(enrichedRankData);
    
    console.log('\n✅ Rank improvement analysis completed successfully!');
    
    return {
      rankData: enrichedRankData,
      report: report
    };
    
  } catch (error) {
    console.error('Error in rank improvement analysis:', error);
    throw error;
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  performRankImprovementAnalysis()
    .then((result) => {
      console.log('Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Script failed:', error);
      process.exit(1);
    });
}

module.exports = { performRankImprovementAnalysis }; 