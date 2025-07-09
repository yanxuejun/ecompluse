import { BigQuery } from '@google-cloud/bigquery';

const credentialsJson = process.env.GCP_SERVICE_ACCOUNT_JSON;
if (!credentialsJson) {
  throw new Error('GCP_SERVICE_ACCOUNT_JSON 环境变量未设置');
}
const credentials = JSON.parse(credentialsJson);
const bigquery = new BigQuery({ credentials });
const projectId = process.env.GCP_PROJECT_ID!;
const datasetId = 'new_gmc_data'; // 已替换为你的数据集名
const tableId = 'user_profile'; // TODO: 替换为你的实际表名
const tableRef = `
  \`${projectId}.${datasetId}.${tableId}\`
`;

export async function getUserProfile(userId: string) {
  const query = `
    SELECT * FROM ${tableRef}
    WHERE id = @userId
    LIMIT 1
  `;
  const options = { query, params: { userId } };
  const [rows] = await bigquery.query(options);
  return rows[0] || null;
}

export async function createUserProfile(userId: string) {
  const query = `
    INSERT INTO ${tableRef} (id, credits, tier, createdAt, updatedAt)
    VALUES (@userId, 20, 'starter', CURRENT_TIMESTAMP(), CURRENT_TIMESTAMP())
  `;
  const options = { query, params: { userId } };
  await bigquery.query(options);
}

export async function deductUserCredit(userId: string) {
  const query = `
    UPDATE ${tableRef}
    SET credits = credits - 1, updatedAt = CURRENT_TIMESTAMP()
    WHERE id = @userId AND credits > 0
  `;
  const options = { query, params: { userId } };
  await bigquery.query(options);
}

export async function updateUserProfileCreditsAndTier(userId: string, credits: number|null, tier: string) {
  const query = `
    UPDATE ${tableRef}
    SET credits = @credits, tier = @tier, updatedAt = CURRENT_TIMESTAMP()
    WHERE id = @userId
  `;
  const options = { query, params: { userId, credits, tier } };
  await bigquery.query(options);
} 