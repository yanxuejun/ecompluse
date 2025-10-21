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

// DELETE /api/favorites/[id] - Remove a product from favorites
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const favoriteId = parseInt(params.id);
    
    if (isNaN(favoriteId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid favorite ID' },
        { status: 400 }
      );
    }

    // 检查收藏是否属于该用户
    const checkQuery = `
      SELECT id FROM ${tableRef}
      WHERE id = @id AND userid = @userid
    `;

    const [checkRows] = await bigquery.query({
      query: checkQuery,
      params: {
        id: favoriteId,
        userid: userId
      },
      types: {
        id: 'INT64',
        userid: 'STRING'
      }
    });

    if (checkRows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Favorite not found or not authorized' },
        { status: 404 }
      );
    }

    // 删除收藏
    const deleteQuery = `
      DELETE FROM ${tableRef}
      WHERE id = @id AND userid = @userid
    `;

    await bigquery.query({
      query: deleteQuery,
      params: {
        id: favoriteId,
        userid: userId
      },
      types: {
        id: 'INT64',
        userid: 'STRING'
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Favorite removed successfully',
    });
  } catch (error) {
    console.error('Error removing favorite:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to remove favorite' },
      { status: 500 }
    );
  }
}