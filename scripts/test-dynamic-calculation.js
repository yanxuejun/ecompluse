const { BigQuery } = require('@google-cloud/bigquery');
const config = require('./config');

// Initialize BigQuery
let bigquery;
if (process.env.GCP_SERVICE_ACCOUNT_JSON) {
  const credentials = JSON.parse(process.env.GCP_SERVICE_ACCOUNT_JSON);
  bigquery = new BigQuery({
    projectId: config.bigquery.projectId,
    credentials: credentials
  });
} else {
  bigquery = new BigQuery({
    projectId: config.bigquery.projectId,
    keyFilename: config.bigquery.keyFilename
  });
}

// 测试动态计算功能
async function testDynamicCalculation() {
  try {
    console.log('🧪 Testing dynamic calculation functionality...');
    
    const query = `
      WITH sample_data AS (
        SELECT 
          'Product A' AS product_title,
          10 AS current_rank,
          15 AS previous_rank,
          1.2 AS current_relative_demand,
          0.8 AS previous_relative_demand
        UNION ALL
        SELECT 
          'Product B' AS product_title,
          5 AS current_rank,
          8 AS previous_rank,
          1.5 AS current_relative_demand,
          1.0 AS previous_relative_demand
        UNION ALL
        SELECT 
          'Product C' AS product_title,
          20 AS current_rank,
          12 AS previous_rank,
          0.6 AS current_relative_demand,
          1.3 AS previous_relative_demand
      )
      SELECT 
        product_title,
        current_rank,
        previous_rank,
        -- 动态计算排名改善
        (previous_rank - current_rank) AS rank_improvement,
        current_relative_demand,
        previous_relative_demand,
        -- 动态计算需求变化
        (current_relative_demand - previous_relative_demand) AS demand_change,
        -- 动态计算动量分数
        ((previous_rank - current_rank) * 0.7 + (current_relative_demand - previous_relative_demand) * 0.3) AS momentum_score,
        -- 动态判断趋势类型
        CASE 
          WHEN (previous_rank - current_rank) > 0 AND (current_relative_demand - previous_relative_demand) > 0 THEN 'ROCKET_RISING'
          WHEN (previous_rank - current_rank) > 0 AND (current_relative_demand - previous_relative_demand) < 0 THEN 'RANK_IMPROVING'
          WHEN (previous_rank - current_rank) < 0 AND (current_relative_demand - previous_relative_demand) > 0 THEN 'DEMAND_INCREASING'
          WHEN (previous_rank - current_rank) < 0 AND (current_relative_demand - previous_relative_demand) < 0 THEN 'DECLINING'
          ELSE 'UNKNOWN'
        END AS trend_type
      FROM sample_data
      ORDER BY momentum_score DESC
    `;

    console.log('🔍 Test Query:');
    console.log(query);

    const options = {
      query: query
    };

    const [rows] = await bigquery.query(options);
    
    console.log('\n📊 Test Results:');
    console.log('='.repeat(60));
    
    rows.forEach((row, index) => {
      console.log(`\n${index + 1}. ${row.product_title}`);
      console.log(`   当前排名: ${row.current_rank}`);
      console.log(`   历史排名: ${row.previous_rank}`);
      console.log(`   排名改善: ${row.rank_improvement} (${row.rank_improvement > 0 ? '上升' : row.rank_improvement < 0 ? '下降' : '不变'})`);
      console.log(`   当前需求: ${row.current_relative_demand}`);
      console.log(`   历史需求: ${row.previous_relative_demand}`);
      console.log(`   需求变化: ${row.demand_change?.toFixed(2)} (${row.demand_change > 0 ? '增长' : row.demand_change < 0 ? '下降' : '不变'})`);
      console.log(`   动量分数: ${row.momentum_score?.toFixed(2)}`);
      console.log(`   趋势类型: ${row.trend_type}`);
    });
    
    console.log('\n✅ Dynamic calculation test completed successfully!');
    
    return rows;
    
  } catch (error) {
    console.error('❌ Error in dynamic calculation test:', error);
    throw error;
  }
}

// 测试实际数据查询
async function testRealDataQuery() {
  try {
    console.log('\n🧪 Testing real data query with dynamic calculations...');
    
    const query = `
      WITH current_rankings AS (
        SELECT 
          COALESCE(
            (SELECT name FROM UNNEST(product_title) WHERE locale = 'en'),
            (SELECT name FROM UNNEST(product_title) LIMIT 1)
          ) AS product_title,
          rank AS current_rank,
          relative_demand AS current_relative_demand
        FROM \`${config.bigquery.projectId}.${config.bigquery.datasetId}.${config.bigquery.tableId}\`
        WHERE ranking_country = @country 
          AND ranking_category = @categoryId
          AND rank_timestamp = (
            SELECT MAX(rank_timestamp) 
            FROM \`${config.bigquery.projectId}.${config.bigquery.datasetId}.${config.bigquery.tableId}\`
            WHERE ranking_country = @country 
              AND ranking_category = @categoryId
          )
        LIMIT 5
      ),
      previous_rankings AS (
        SELECT 
          COALESCE(
            (SELECT name FROM UNNEST(product_title) WHERE locale = 'en'),
            (SELECT name FROM UNNEST(product_title) LIMIT 1)
          ) AS product_title,
          rank AS previous_rank,
          relative_demand AS previous_relative_demand
        FROM \`${config.bigquery.projectId}.${config.bigquery.datasetId}.${config.bigquery.tableId}\`
        WHERE ranking_country = @country 
          AND ranking_category = @categoryId
          AND rank_timestamp <= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL @daysBack DAY)
        LIMIT 5
      )
      SELECT 
        c.product_title,
        c.current_rank,
        p.previous_rank,
        -- 动态计算排名改善
        (p.previous_rank - c.current_rank) AS rank_improvement,
        c.current_relative_demand,
        p.previous_relative_demand,
        -- 动态计算需求变化
        (c.current_relative_demand - p.previous_relative_demand) AS demand_change,
        -- 动态计算动量分数
        ((p.previous_rank - c.current_rank) * 0.7 + (c.current_relative_demand - p.previous_relative_demand) * 0.3) AS momentum_score
      FROM current_rankings c
      LEFT JOIN previous_rankings p ON c.product_title = p.product_title
      WHERE p.previous_rank IS NOT NULL
      ORDER BY momentum_score DESC
      LIMIT 3
    `;

    console.log('🔍 Real Data Query:');
    console.log(query);

    const options = {
      query: query,
      params: {
        country: config.task.country,
        categoryId: config.task.categoryId,
        daysBack: 7
      }
    };

    const [rows] = await bigquery.query(options);
    
    console.log('\n📊 Real Data Results:');
    console.log('='.repeat(60));
    
    if (rows.length === 0) {
      console.log('No data found for the specified parameters');
    } else {
      rows.forEach((row, index) => {
        console.log(`\n${index + 1}. ${row.product_title}`);
        console.log(`   当前排名: ${row.current_rank}`);
        console.log(`   历史排名: ${row.previous_rank}`);
        console.log(`   排名改善: ${row.rank_improvement} (${row.rank_improvement > 0 ? '上升' : row.rank_improvement < 0 ? '下降' : '不变'})`);
        console.log(`   当前需求: ${row.current_relative_demand}`);
        console.log(`   历史需求: ${row.previous_relative_demand}`);
        console.log(`   需求变化: ${row.demand_change?.toFixed(2)} (${row.demand_change > 0 ? '增长' : row.demand_change < 0 ? '下降' : '不变'})`);
        console.log(`   动量分数: ${row.momentum_score?.toFixed(2)}`);
      });
    }
    
    console.log('\n✅ Real data query test completed successfully!');
    
    return rows;
    
  } catch (error) {
    console.error('❌ Error in real data query test:', error);
    throw error;
  }
}

// 主函数
async function runTests() {
  try {
    console.log('🚀 Starting dynamic calculation tests...');
    console.log('📋 Configuration:', {
      country: config.task.country,
      categoryId: config.task.categoryId,
      projectId: config.bigquery.projectId,
      datasetId: config.bigquery.datasetId,
      tableId: config.bigquery.tableId
    });
    console.log('');
    
    // 1. 测试模拟数据
    await testDynamicCalculation();
    
    // 2. 测试实际数据
    await testRealDataQuery();
    
    console.log('\n🎉 All tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  runTests()
    .then(() => {
      console.log('Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Script failed:', error);
      process.exit(1);
    });
}

module.exports = { testDynamicCalculation, testRealDataQuery }; 