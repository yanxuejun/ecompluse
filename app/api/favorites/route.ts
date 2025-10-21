import { NextRequest, NextResponse } from 'next/server';
import { BigQuery } from '@google-cloud/bigquery';
import { auth } from '@clerk/nextjs/server';

const credentialsJson = process.env.GCP_SERVICE_ACCOUNT_JSON;
if (!credentialsJson) throw new Error('GCP_SERVICE_ACCOUNT_JSON 环境变量未设置');
const credentials = JSON.parse(credentialsJson);
const bigquery = new BigQuery({ credentials });
const projectId = process.env.GCP_PROJECT_ID!;
const datasetId = 'new_gmc_data';
const tableId = 'Product_Favorites';
const tableRef = `\`${projectId}.${datasetId}.${tableId}\``;

// GET /api/favorites - Fetch user's favorite products
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const offset = (page - 1) * pageSize;

    // 查询用户收藏的产品
    const query = `
      SELECT 
        id,
        userid,
        username,
        useremail,
        rank,
        country_code,
        categroy_id,
        brand,
        title,
        previous_rank,
        price_range,
        relative_demand,
        relative_demand_change,
        rank_timestamp,
        created_at
      FROM ${tableRef}
      WHERE userid = @userid
      ORDER BY created_at DESC
      LIMIT @pageSize OFFSET @offset
    `;

    const [rows] = await bigquery.query({
      query,
      params: {
        userid: userId,
        pageSize,
        offset
      },
      types: {
        userid: 'STRING',
        pageSize: 'INT64',
        offset: 'INT64'
      }
    });

    // 获取总数
    const countQuery = `
      SELECT COUNT(*) as total
      FROM ${tableRef}
      WHERE userid = @userid
    `;

    const [countRows] = await bigquery.query({
      query: countQuery,
      params: { userid: userId },
      types: { userid: 'STRING' }
    });

    const total = countRows[0]?.total || 0;

    return NextResponse.json({
      success: true,
      data: rows,
      total,
      page,
      pageSize,
    });
  } catch (error) {
    console.error('Error fetching favorites:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch favorites' },
      { status: 500 }
    );
  }
}

// POST /api/favorites - Add a product to favorites
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      rank,
      country_code,
      categroy_id,
      brand,
      title,
      previous_rank,
      price_range,
      relative_demand,
      relative_demand_change,
      rank_timestamp,
      username, // 从前端获取
      useremail, // 从前端获取
    } = body;

    // 检查是否已存在
    const checkQuery = `
      SELECT id FROM ${tableRef}
      WHERE userid = @userid 
        AND title = @title 
        AND country_code = @country_code 
        AND categroy_id = @categroy_id
    `;

    const [existingRows] = await bigquery.query({
      query: checkQuery,
      params: {
        userid: userId,
        title,
        country_code,
        categroy_id
      },
      types: {
        userid: 'STRING',
        title: 'STRING',
        country_code: 'STRING',
        categroy_id: 'INT64'
      }
    });

    if (existingRows.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Product already in favorites' },
        { status: 400 }
      );
    }

    // 插入新收藏
    const insertQuery = `
      INSERT INTO ${tableRef} (
        userid, username, useremail, rank, country_code, categroy_id, 
        brand, title, previous_rank, price_range, relative_demand, 
        relative_demand_change, rank_timestamp, created_at
      ) VALUES (
        @userid, @username, @useremail, @rank, @country_code, @categroy_id,
        @brand, @title, @previous_rank, @price_range, @relative_demand,
        @relative_demand_change, @rank_timestamp, CURRENT_TIMESTAMP()
      )
    `;

    await bigquery.query({
      query: insertQuery,
      params: {
        userid: userId,
        username: username || 'Unknown',
        useremail: useremail || '',
        rank,
        country_code,
        categroy_id,
        brand: brand || '',
        title,
        previous_rank,
        price_range: price_range || '',
        relative_demand: relative_demand || '',
        relative_demand_change: relative_demand_change || '',
        rank_timestamp: new Date(rank_timestamp)
      },
      types: {
        userid: 'STRING',
        username: 'STRING',
        useremail: 'STRING',
        rank: 'INT64',
        country_code: 'STRING',
        categroy_id: 'INT64',
        brand: 'STRING',
        title: 'STRING',
        previous_rank: 'INT64',
        price_range: 'STRING',
        relative_demand: 'STRING',
        relative_demand_change: 'STRING',
        rank_timestamp: 'TIMESTAMP'
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Favorite added successfully',
    });
  } catch (error) {
    console.error('Error adding favorite:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to add favorite' },
      { status: 500 }
    );
  }
}