// Optional PostgreSQL client setup
// Uncomment and install 'pg' package if you want to use PostgreSQL

/*
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

export async function query(text: string, params?: any[]) {
  const client = await pool.connect();
  try {
    return await client.query(text, params);
  } finally {
    client.release();
  }
}

export async function saveArchitecture(architecture: any) {
  const sql = `
    INSERT INTO architectures (prompt, services, connections, patterns, scaling_model, summary, estimated_cost)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING id
  `;
  
  const result = await query(sql, [
    architecture.prompt,
    JSON.stringify(architecture.services),
    JSON.stringify(architecture.connections),
    architecture.patterns,
    architecture.scaling_model,
    architecture.summary,
    JSON.stringify(architecture.estimated_cost),
  ]);
  
  return result.rows[0].id;
}

export async function findSimilarArchitectures(targetArchitecture: any, limit: number = 5) {
  const serviceCount = targetArchitecture.services.length;
  
  const sql = `
    SELECT 
      id,
      prompt,
      services,
      patterns,
      scaling_model,
      calculate_similarity_score(
        $1::TEXT[],
        $2::VARCHAR,
        $3::INTEGER,
        patterns,
        scaling_model,
        array_length(ARRAY(SELECT jsonb_array_elements(services)), 1)
      ) as similarity_score
    FROM architectures
    WHERE id != $4
    ORDER BY similarity_score DESC
    LIMIT $5
  `;
  
  const result = await query(sql, [
    targetArchitecture.patterns,
    targetArchitecture.scaling_model,
    serviceCount,
    targetArchitecture.id,
    limit,
  ]);
  
  return result.rows;
}

export default pool;
*/

// For now, we'll use in-memory storage
export const architectureStore: any[] = [];

export function saveArchitecture(architecture: any) {
  architectureStore.push(architecture);
  return architecture.id;
}

export function findSimilarArchitectures(targetArchitecture: any, limit: number = 5) {
  // This is handled by the similarity-search utility
  return [];
}

