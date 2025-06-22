const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '', // add your password here if you have one
  database: 'quality_backend_service',
  socketPath: '/tmp/mysql.sock',
  charset: 'utf8mb4',
};

async function main() {
  const filePath = path.join(__dirname, 'branch-list.txt');
  const content = fs.readFileSync(filePath, 'utf-8');
  const branchNames = content
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean);

  if (!branchNames.length) {
    console.log('No branches found in file.');
    return;
  }

  const connection = await mysql.createConnection(dbConfig);

  try {
    for (const branchName of branchNames) {
      try {
        await connection.execute(
          'INSERT INTO branch_list (branch_name) VALUES (?)',
          [branchName]
        );
        console.log(`Inserted: ${branchName}`);
      } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
          console.log(`Skipped (duplicate): ${branchName}`);
        } else {
          console.error(`Error inserting "${branchName}":`, err.message);
        }
      }
    }
  } finally {
    await connection.end();
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});