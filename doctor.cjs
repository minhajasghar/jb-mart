const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

(async () => {
  const sql = fs.readFileSync(path.join(__dirname, 'database.sql'), 'utf8');
  const cleaned = sql.replace(/--.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
  const statements = cleaned.split(';').map(s => s.trim()).filter(s => s.length > 0);

  const conn = await mysql.createConnection({ host: 'localhost', user: 'root', password: '' });

  await conn.query('CREATE DATABASE IF NOT EXISTS jbmegamart_123');
  await conn.end();

  const conn2 = await mysql.createConnection({ host: 'localhost', user: 'root', password: '', database: 'jbmegamart_123' });

  let success = 0, errors = 0;
  for (const stmt of statements) {
    if (stmt.toUpperCase().startsWith('CREATE DATABASE') || stmt.toUpperCase().startsWith('USE ')) continue;
    try {
      await conn2.query(stmt);
      success++;
    } catch (e) {
      if (!e.message.includes('Duplicate column') && !e.message.includes('Duplicate entry') && !e.message.includes('already exists')) {
        console.error('Error:', stmt.substring(0, 100), '...', e.message);
        errors++;
      } else {
        success++;
      }
    }
  }
  console.log('Executed:', success, 'statements,', errors, 'errors');

  const [tables] = await conn.execute('SHOW TABLES');
  for (const t of tables.map(r => Object.values(r)[0])) {
    const [rows] = await conn.execute('SELECT COUNT(*) AS cnt FROM `' + t + '`');
    console.log('  ' + t + ': ' + rows[0].cnt + ' rows');
  }

  await conn.end();
})();
