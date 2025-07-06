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

// 从 BigQuery 获取排名前十的产品
async function getTopProductsFromBigQuery(country, categoryId, limit = 10) {
  try {
    console.log(`Fetching top ${limit} products for country: ${country}, category: ${categoryId}`);
    
    const query = `
      SELECT 
        COALESCE(
          (SELECT name FROM UNNEST(product_title) WHERE locale = 'en'),
          (SELECT name FROM UNNEST(product_title) LIMIT 1)
        ) AS product_title,
        rank,
        rank_timestamp
      FROM \`${config.bigquery.projectId}.${config.bigquery.datasetId}.${config.bigquery.tableId}\`
      WHERE ranking_country = @country 
        AND ranking_category = @categoryId
      ORDER BY rank ASC
      LIMIT @limit
    `;

    console.log('🔍 BigQuery Query:');
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
    console.log(`Found ${rows.length} products`);
    
    return rows;
  } catch (error) {
    console.error('Error fetching from BigQuery:', error);
    throw error;
  }
}

// 调用 Google Custom Search API
async function searchGoogleProduct(productTitle) {
  try {
    const searchQuery = encodeURIComponent(productTitle);
    const url = `https://www.googleapis.com/customsearch/v1?key=${config.googleSearch.apiKey}&cx=${config.googleSearch.engineId}&q=${searchQuery}&searchType=image&num=1`;
    
    console.log(`Searching for:: ${productTitle}`);
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (!response.ok) {
      console.error('Google Search API error:', data);
      return null;
    }
    
    if (data.items && data.items.length > 0) {
      const firstResult = data.items[0];
      console.log(firstResult.link);
      console.log(firstResult.title);
      console.log(firstResult.image?.contextLink || firstResult.link);
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

// 保存到 BigQuery 表
async function saveToBigQuery(products, country, categoryId, clearOldData = false) {
  try {
    console.log(`Saving ${products.length} products to BigQuery`);
    
    const dataset = bigquery.dataset(config.bigquery.datasetId);
    const table = dataset.table('product_week_rank_enriched'); // 新的表名
    
    // 注意：BigQuery 流式缓冲区不支持 DELETE，所以我们直接插入新数据
    // 如果需要去重，可以在查询时使用 DISTINCT 或窗口函数
    if (clearOldData) {
      console.log('⚠️ 注意：BigQuery 流式缓冲区不支持 DELETE 操作');
      console.log('📝 将直接插入新数据，旧数据会保留');
    }
    
    // 准备插入数据
    const rows = products.map(product => ({
      rank: product.rank,
      product_title: product.product_title,
      category_id: categoryId,
      image_url: product.imageUrl,
      search_title: product.searchTitle,
      search_link: product.searchLink,
      country: country,
      rank_timestamp: product.rank_timestamp,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));
    
    console.log('📊 准备插入的数据行数:', rows.length);
    console.log('📊 示例数据:', rows[0]);
    
    // 使用 insert 方法插入数据
    const [job] = await table.insert(rows);
    
    console.log(`✅ Successfully inserted ${rows.length} products to BigQuery`);
    console.log(`📋 Job ID: ${job.id}`);
    
    return {
      count: rows.length,
      jobId: job.id
    };
  } catch (error) {
    console.error('❌ Error saving to BigQuery:', error);
    throw error;
  }
}

// 主函数
async function updateProductWeekRank() {
  const { country, categoryId, limit, delayBetweenRequests } = config.task;
  
  try {
    console.log('🚀 Starting product week rank update...');
    console.log('📋 Configuration from config.js:');
    console.log(`   Country: ${country}`);
    console.log(`   Category ID: ${categoryId}`);
    console.log(`   Limit: ${limit}`);
    console.log(`   Delay: ${delayBetweenRequests}ms`);
    console.log(`   BigQuery: ${config.bigquery.projectId}.${config.bigquery.datasetId}.${config.bigquery.tableId}`);
    console.log('');
    
    // 1. 从 BigQuery 获取排名前十的产品
    const products = await getTopProductsFromBigQuery(country, categoryId, limit);
    
    if (products.length === 0) {
      console.log('No products found in BigQuery');
      return;
    }
    
    // 2. 为每个产品调用 Google Custom Search API
    const enrichedProducts = [];
    
    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      console.log(`Processing product ${i + 1}/${products.length}: ${product.product_title}`);
      
      const searchResult = await searchGoogleProduct(product.product_title);
      
      enrichedProducts.push({
        ...product,
        imageUrl: searchResult?.imageUrl || null,
        searchTitle: searchResult?.searchTitle || null,
        searchLink: searchResult?.searchLink || null
      });
      
      // 添加延迟以避免 API 限制
      if (i < products.length - 1) {
        await new Promise(resolve => setTimeout(resolve, delayBetweenRequests));
      }
    }
    
    // 3. 保存到 BigQuery 表（清除旧数据）
    await saveToBigQuery(enrichedProducts, country, categoryId, true);
    
    console.log('Product week rank update completed successfully!');
    
    // 显示结果摘要
    console.log('\nResults Summary:');
    enrichedProducts.forEach((product, index) => {
      console.log(`${index + 1}. ${product.product_title}`);
      console.log(`   Rank: ${product.rank}`);
      console.log(`   Image: ${product.imageUrl ? 'Found' : 'Not found'}`);
      console.log(`   Search Title: ${product.searchTitle || 'N/A'}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('Error in updateProductWeekRank:', error);
    throw error;
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  updateProductWeekRank()
    .then(() => {
      console.log('Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Script failed:', error);
      process.exit(1);
    });
}

module.exports = { updateProductWeekRank }; 