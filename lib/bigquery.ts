import { BigQuery } from '@google-cloud/bigquery';

const bigquery = new BigQuery();
const datasetId = 'new_gmc_data'; // 已替换为你的数据集名
const tableId = 'user_profile'; // TODO: 替换为你的实际表名

export async function getUserProfile(userId: string) {
  const query = `
    SELECT * FROM \
      \`${datasetId}.${tableId}\`
    WHERE id = @userId
    LIMIT 1
  `;
  const options = { query, params: { userId } };
  const [rows] = await bigquery.query(options);
  return rows[0] || null;
}

export async function createUserProfile(userId: string) {
  const query = `
    INSERT INTO \
      \`${datasetId}.${tableId}\` (id, credits, tier, createdAt, updatedAt)
    VALUES (@userId, 20, 'starter', CURRENT_TIMESTAMP(), CURRENT_TIMESTAMP())
  `;
  const options = { query, params: { userId } };
  await bigquery.query(options);
}

export async function deductUserCredit(userId: string) {
  const query = `
    UPDATE \
      \`${datasetId}.${tableId}\`
    SET credits = credits - 1, updatedAt = CURRENT_TIMESTAMP()
    WHERE id = @userId AND credits > 0
  `;
  const options = { query, params: { userId } };
  await bigquery.query(options);
}

export async function updateUserProfileCreditsAndTier(userId: string, credits: number|null, tier: string) {
  const query = `
    UPDATE \
      \`${datasetId}.${tableId}\`
    SET credits = @credits, tier = @tier, updatedAt = CURRENT_TIMESTAMP()
    WHERE id = @userId
  `;
  const options = { query, params: { userId, credits, tier } };
  await bigquery.query(options);
} 