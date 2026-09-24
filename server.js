'use strict';
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const mysql = require('mysql2/promise');
const fs = require('fs');
const crypto = require('crypto');

global.startupLogs = [];
global.startupLogs.push('In-memory log initialized at ' + new Date().toISOString());

console.log = function (...args) {
  const msg = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : arg).join(' ');
  global.startupLogs.push(msg);
};

console.error = function (...args) {
  const msg = '[ERROR] ' + args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : arg).join(' ');
  global.startupLogs.push(msg);
};

dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
const port = process.env.PORT || 5000;

app.use((req, res, next) => {
  const method = req.headers['x-http-method-override'] || req.query._method;
  if (method) {
    req.method = method.toUpperCase();
  }
  console.log(`[Request] ${req.method} ${req.url}`);
  next();
});

app.use(cors());
app.use(express.json({ limit: '10mb' }));

const UPLOADS_DIR = path.join(__dirname, 'public', 'uploads');
try {
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
    console.log('Created uploads directory: ' + UPLOADS_DIR);
  }
  app.use('/uploads', express.static(UPLOADS_DIR));
} catch (err) {
  console.error('Could not create uploads directory at ' + UPLOADS_DIR + ': ' + err.message + '. Images will be stored as base64 in the database.');
}

function saveBase64Image(dataUri) {
  if (!dataUri || typeof dataUri !== 'string') return dataUri;
  if (!dataUri.startsWith('data:image/')) return dataUri;
  const matches = dataUri.match(/^data:image\/(\w+);base64,(.+)$/);
  if (!matches) return dataUri;
  try {
    const ext = matches[1] === 'jpeg' ? 'jpg' : matches[1];
    const buffer = Buffer.from(matches[2], 'base64');
    const filename = `img-${Date.now()}-${crypto.randomBytes(6).toString('hex')}.${ext}`;
    const filepath = path.join(UPLOADS_DIR, filename);
    fs.writeFileSync(filepath, buffer);
    console.log(`Saved image: ${filename} (${buffer.length} bytes)`);
    return `/uploads/${filename}`;
  } catch (err) {
    console.error('Failed to save image file, falling back to base64 storage:', err.message);
    return dataUri;
  }
}

const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'jbmegamart_123',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
};

let pool;

async function initDb() {
  try {
    pool = mysql.createPool(DB_CONFIG);
    const conn = await pool.getConnection();
    console.log('Connected to MySQL database: ' + DB_CONFIG.database);

    // Auto-seed database if categories table is empty or missing
    let needsSeeding = false;
    try {
      const [rows] = await conn.query('SELECT COUNT(*) AS cnt FROM categories');
      if (rows[0].cnt === 0) {
        needsSeeding = true;
      }
    } catch (err) {
      needsSeeding = true;
    }

    if (needsSeeding) {
      console.log('Database empty or categories missing. Seeding from database.sql...');
      const sqlPath = path.join(__dirname, 'database.sql');
      if (fs.existsSync(sqlPath)) {
        const sqlContent = fs.readFileSync(sqlPath, 'utf8');
        const cleaned = sqlContent.replace(/--.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
        const statements = cleaned.split(';').map(s => s.trim()).filter(s => s.length > 0);
        for (const stmt of statements) {
          if (stmt.toUpperCase().startsWith('CREATE DATABASE') || stmt.toUpperCase().startsWith('USE ')) continue;
          try {
            await conn.query(stmt);
          } catch (stmtErr) {
            if (!stmtErr.message.includes('Duplicate column') && 
                !stmtErr.message.includes('Duplicate entry') && 
                !stmtErr.message.includes('already exists')) {
              console.warn('Migration statement warning:', stmt.substring(0, 100), '...', stmtErr.message);
            }
          }
        }
        console.log('Database seeding completed successfully.');
      } else {
        console.error('database.sql not found at ' + sqlPath + ', cannot auto-seed.');
      }
    }

    // Ensure users table exists and is seeded
    await conn.query(`CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL UNIQUE,
      role VARCHAR(50) NOT NULL DEFAULT 'user',
      password VARCHAR(255) NOT NULL DEFAULT '123',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);
    const [existing] = await conn.query('SELECT COUNT(*) AS cnt FROM users');
    if (existing[0].cnt === 0) {
      await conn.query(`INSERT INTO users (name, role, password) VALUES ('admin', 'admin', 'admin123')`);
      await conn.query(`INSERT INTO users (name, role, password) VALUES ('cook', 'cook', 'cook123')`);
      console.log('Seeded default users');
    } else {
      console.log('Users table ready (' + existing[0].cnt + ' users)');
    }
    // Ensure missing columns exist on existing tables (safe to run every startup)
    const migrations = [
      "ALTER TABLE categories ADD COLUMN has_subcategories BOOLEAN DEFAULT FALSE",
      "ALTER TABLE products ADD COLUMN subcategory_id VARCHAR(100) DEFAULT NULL",
      "ALTER TABLE products ADD COLUMN is_special BOOLEAN DEFAULT FALSE",
      "ALTER TABLE products MODIFY COLUMN price DECIMAL(10,2) NULL",
      "ALTER TABLE subcategories ADD COLUMN image TEXT",
    ];
    for (const sql of migrations) {
      try { await conn.execute(sql); } catch (_) {}
    }
    await runSubcategoryMigration(conn);
    conn.release();
  } catch (err) {
    console.error('Failed to connect to MySQL:', err.message);
    process.exit(1);
  }
}

async function runSubcategoryMigration(conn) {
  try {
    // Check if migration already ran
    await conn.execute(`CREATE TABLE IF NOT EXISTS schema_migrations (
      migration_name VARCHAR(255) PRIMARY KEY,
      applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);
    const [migrated] = await conn.execute("SELECT COUNT(*) AS cnt FROM schema_migrations WHERE migration_name = 'drinks_category_split'");
    if (migrated[0].cnt > 0) {
      console.log('Drinks category migration already applied, skipping');
      return;
    }
    console.log('Running drinks category migration...');

    // 1. Add Next Cola, Pepsi, Coke categories (if Drinks existed, keep it for transition)
    const newCats = [
      ['category-next-cola', 'Next Cola', 14, '/drinks.png', 1],
      ['category-pepsi',     'Pepsi',     15, '/drinks.png', 1],
      ['category-coke',      'Coke',      16, '/drinks.png', 1],
    ];
    for (const [id, name, order, img, hasSub] of newCats) {
      await conn.execute('INSERT IGNORE INTO categories (id, name, display_order, image, has_subcategories) VALUES (?, ?, ?, ?, ?)', [id, name, order, img, hasSub]);
    }
    // Set default image only if category has no image yet (preserve user-uploaded images)
    await conn.execute("UPDATE categories SET image = COALESCE(NULLIF(image, ''), '/drinks.png') WHERE id IN ('category-next-cola','category-pepsi','category-coke')");
    // Equivalent: only updates rows where image is NULL or empty string
    await conn.execute("INSERT IGNORE INTO schema_migrations (migration_name) VALUES ('drinks_category_split')");

    // 2. Delete old subcat-drinks-* subcategories
    await conn.execute("DELETE FROM subcategories WHERE id LIKE 'subcat-drinks-%'");

    // 3. Create new subcategories for Next Cola, Pepsi, Coke
    const newSubcategories = [
      ['subcat-nextcola-nextcola', 'category-next-cola', 'Next Cola',       1, '/drinks.png'],
      ['subcat-nextcola-fizzup',   'category-next-cola', 'Fizzup',          2, '/fizzup.jpeg'],
      ['subcat-nextcola-water',    'category-next-cola', 'Next Water',      3, '/Water.png'],
      ['subcat-pepsi-pepsi',       'category-pepsi',     'Pepsi',           1, '/pepsi.png'],
      ['subcat-pepsi-7up',         'category-pepsi',     '7Up',             2, '/7up.png'],
      ['subcat-pepsi-mirinda',     'category-pepsi',     'Mirinda',         3, '/mirinda.png'],
      ['subcat-pepsi-dew',         'category-pepsi',     'Mountain Dew',    4, '/Mountain dew.png'],
      ['subcat-pepsi-water',       'category-pepsi',     'Water',           5, '/Water.png'],
      ['subcat-coke-coke',         'category-coke',      'Coca-Cola',       1, '/cocacola.png'],
      ['subcat-coke-sprite',       'category-coke',      'Sprite',          2, '/Sprite.png'],
      ['subcat-coke-fanta',        'category-coke',      'Fanta',           3, '/Fanta.png'],
      ['subcat-coke-juices',       'category-coke',      'Juices',          4, '/Juice.jpeg'],
      ['subcat-coke-water',        'category-coke',      'Water',           5, '/Water.png'],
    ];
    for (const [id, catId, name, order, img] of newSubcategories) {
      await conn.execute('INSERT IGNORE INTO subcategories (id, category_id, name, display_order, image) VALUES (?, ?, ?, ?, ?)', [id, catId, name, order, img]);
    }

    // 4. Add Next Cola products (if not exist)
    const nextColaProducts = [
      ['next-cola-300ml',  'Next Cola 300ml',  70,  35,  '/drinks.png', 'category-next-cola', 'subcat-nextcola-nextcola', 1],
      ['next-cola-500ml',  'Next Cola 500ml',  90,  45,  '/drinks.png', 'category-next-cola', 'subcat-nextcola-nextcola', 2],
      ['next-cola-1ltr',   'Next Cola 1ltr',   130, 65,  '/drinks.png', 'category-next-cola', 'subcat-nextcola-nextcola', 3],
      ['next-cola-1500ml', 'Next Cola 1500ml', 160, 80,  '/drinks.png', 'category-next-cola', 'subcat-nextcola-nextcola', 4],
    ];
    for (const [id, name, price, cost, img, catId, subcatId, order] of nextColaProducts) {
      await conn.execute('INSERT IGNORE INTO products (id, name, price, cost_price, image, category_id, subcategory_id, display_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [id, name, price, cost, img, catId, subcatId, order]);
    }

    // 5. Move products to new categories and subcategories

    // Next Cola category
    await conn.execute("UPDATE products SET category_id = 'category-next-cola', subcategory_id = 'subcat-nextcola-fizzup', image = COALESCE(image, '/drinks.png') WHERE id IN ('fizzup-300ml','fizzup-500ml','fizzup-1ltr','fizzup-1500ml')");
    await conn.execute("UPDATE products SET category_id = 'category-next-cola', subcategory_id = 'subcat-nextcola-water', image = COALESCE(image, '/drinks.png') WHERE id IN ('next-water-500ml','next-water-1500ml')");

    // Pepsi category
    await conn.execute("UPDATE products SET category_id = 'category-pepsi', subcategory_id = 'subcat-pepsi-pepsi' WHERE id LIKE 'pepsi-%' AND id NOT LIKE 'pepsi-%'");
    // Actually, update each Pepsi product individually
    const pepsiIds = ['pepsi-345ml','pepsi-zero-345ml','pepsi-500ml','pepsi-zero-500ml','pepsi-1ltr','pepsi-zero-1ltr','pepsi-1500ml','pepsi-zero-1500ml','pepsi-can-250ml','pepsi-diet-can-250ml'];
    const ph1 = pepsiIds.map(() => '?').join(',');
    await conn.execute(`UPDATE products SET category_id = 'category-pepsi', subcategory_id = 'subcat-pepsi-pepsi', image = COALESCE(image, '/drinks.png') WHERE id IN (${ph1})`, pepsiIds);

    await conn.execute("UPDATE products SET category_id = 'category-pepsi', subcategory_id = 'subcat-pepsi-7up', image = COALESCE(image, '/drinks.png') WHERE id LIKE '7up-%'");
    await conn.execute("UPDATE products SET category_id = 'category-pepsi', subcategory_id = 'subcat-pepsi-mirinda', image = COALESCE(image, '/drinks.png') WHERE id LIKE 'mirinda-%'");
    await conn.execute("UPDATE products SET category_id = 'category-pepsi', subcategory_id = 'subcat-pepsi-dew', image = COALESCE(image, '/drinks.png') WHERE id LIKE 'dew-%'");
    await conn.execute("UPDATE products SET category_id = 'category-pepsi', subcategory_id = 'subcat-pepsi-water', image = COALESCE(image, '/drinks.png') WHERE id LIKE 'aqyafina-%'");

    // Coke category
    const cokeIds = ['coke-can-250ml','coke-zero-can-250ml','coke-345ml','coke-zero-345ml','coke-500ml','coke-zero-500ml','coke-1ltr','coke-zero-1ltr','coke-1500ml','coke-zero-1500ml'];
    const ph2 = cokeIds.map(() => '?').join(',');
    await conn.execute(`UPDATE products SET category_id = 'category-coke', subcategory_id = 'subcat-coke-coke', image = COALESCE(image, '/drinks.png') WHERE id IN (${ph2})`, cokeIds);

    await conn.execute("UPDATE products SET category_id = 'category-coke', subcategory_id = 'subcat-coke-sprite', image = COALESCE(image, '/drinks.png') WHERE id LIKE 'sprite-%'");
    await conn.execute("UPDATE products SET category_id = 'category-coke', subcategory_id = 'subcat-coke-fanta', image = COALESCE(image, '/drinks.png') WHERE id LIKE 'fanta-%'");
    await conn.execute("UPDATE products SET category_id = 'category-coke', subcategory_id = 'subcat-coke-juices', image = COALESCE(image, '/drinks.png') WHERE id = 'cappy-palpi-300ml'");
    await conn.execute("UPDATE products SET category_id = 'category-coke', subcategory_id = 'subcat-coke-water', image = COALESCE(image, '/drinks.png') WHERE id LIKE 'dasani-%'");

    // 6. Update display orders
    await conn.execute("UPDATE products SET display_order = 1 WHERE id = 'pepsi-can-250ml' AND display_order != 1");
    await conn.execute("UPDATE products SET display_order = 2 WHERE id = 'pepsi-diet-can-250ml' AND display_order != 2");
    await conn.execute("UPDATE products SET display_order = 3 WHERE id = 'pepsi-345ml' AND display_order != 3");
    await conn.execute("UPDATE products SET display_order = 4 WHERE id = 'pepsi-zero-345ml' AND display_order != 4");
    await conn.execute("UPDATE products SET display_order = 5 WHERE id = 'pepsi-500ml' AND display_order != 5");
    await conn.execute("UPDATE products SET display_order = 6 WHERE id = 'pepsi-zero-500ml' AND display_order != 6");
    await conn.execute("UPDATE products SET display_order = 7 WHERE id = 'pepsi-1ltr' AND display_order != 7");
    await conn.execute("UPDATE products SET display_order = 8 WHERE id = 'pepsi-zero-1ltr' AND display_order != 8");
    await conn.execute("UPDATE products SET display_order = 9 WHERE id = 'pepsi-1500ml' AND display_order != 9");
    await conn.execute("UPDATE products SET display_order = 10 WHERE id = 'pepsi-zero-1500ml' AND display_order != 10");

    console.log('Drinks category migration done');
  } catch (_) { console.log('Migration skipped (table may not exist)'); }
}

initDb();

function query(sql, params = []) {
  return pool.execute(sql, params);
}

// ─── CATEGORIES API ───

app.get('/api/categories', async (req, res) => {
  try {
    const [rows] = await query(
      'SELECT id, name, display_order AS displayOrder, image, has_subcategories AS hasSubcategories FROM categories ORDER BY display_order ASC'
    );
    res.json(rows.map(r => ({ ...r, hasSubcategories: !!r.hasSubcategories })));
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

app.post('/api/categories', async (req, res) => {
  const { id, name, displayOrder, image, hasSubcategories } = req.body;
  if (!id || !name) {
    return res.status(400).json({ error: 'Missing required fields: id, name' });
  }
  const savedImage = saveBase64Image(image);
  try {
    await query(
      'INSERT INTO categories (id, name, display_order, image, has_subcategories) VALUES (?, ?, ?, ?, ?)',
      [id, name, displayOrder || 0, savedImage, hasSubcategories ? 1 : 0]
    );
    const [rows] = await query('SELECT id, name, display_order AS displayOrder, image, has_subcategories AS hasSubcategories FROM categories ORDER BY display_order ASC');
    res.status(201).json({ message: 'Category created successfully', id, categories: rows.map(r => ({ ...r, hasSubcategories: !!r.hasSubcategories })) });
  } catch (error) {
    if (error.message && error.message.includes('Duplicate')) {
      return res.status(400).json({ error: 'Category ID already exists' });
    }
    console.error('Database error:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

const updateCategoryHandler = async (req, res) => {
  const { id } = req.params;
  const { name, displayOrder, image, hasSubcategories } = req.body;
  try {
    const [existing] = await query('SELECT * FROM categories WHERE id = ?', [id]);
    if (existing.length === 0) return res.status(404).json({ error: 'Category not found' });

    const savedImage = image !== undefined ? saveBase64Image(image) : undefined;
    console.log(`Updating category ${id}: image=${savedImage ? savedImage.substring(0, 80) : '(none)'}`);

    await query(
      'UPDATE categories SET name = COALESCE(?, name), display_order = COALESCE(?, display_order), image = COALESCE(?, image), has_subcategories = COALESCE(?, has_subcategories) WHERE id = ?',
      [name || null, displayOrder || null, savedImage !== undefined ? savedImage : null, hasSubcategories !== undefined ? (hasSubcategories ? 1 : 0) : null, id]
    );
    const [rows] = await query('SELECT id, name, display_order AS displayOrder, image, has_subcategories AS hasSubcategories FROM categories ORDER BY display_order ASC');
    res.json({ message: 'Category updated successfully', categories: rows.map(r => ({ ...r, hasSubcategories: !!r.hasSubcategories })) });
  } catch (error) {
    console.error('Database error updating category:', error.message, 'Params:', JSON.stringify({ id, name, displayOrder, hasSubcategories, image: image ? image.substring(0, 80) : undefined }));
    res.status(500).json({ error: 'Database error: ' + error.message });
  }
};

const deleteCategoryHandler = async (req, res) => {
  const { id } = req.params;
  try {
    await query('UPDATE products SET category_id = NULL WHERE category_id = ?', [id]);
    await query('DELETE FROM categories WHERE id = ?', [id]);
    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Database error' });
  }
};

app.put('/api/categories/:id', updateCategoryHandler);
app.post('/api/categories-update/:id', updateCategoryHandler);
app.delete('/api/categories/:id', deleteCategoryHandler);
app.post('/api/categories-delete/:id', deleteCategoryHandler);

// ─── PRODUCTS API ───

app.get('/api/products', async (req, res) => {
  try {
    const [rows] = await query(`
      SELECT id, name, price, cost_price AS costPrice, image,
        category_id AS categoryId, subcategory_id AS subcategoryId, variant,
        is_out_of_stock AS isOutOfStock, is_special AS isSpecial,
        display_order AS displayOrder
      FROM products ORDER BY display_order ASC
    `);
    res.json(rows.map(r => ({
      ...r,
      price: r.price !== null ? Number(r.price) : null,
      costPrice: Number(r.costPrice),
      isOutOfStock: !!r.isOutOfStock,
      isSpecial: !!r.isSpecial
    })));
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

app.post('/api/products', async (req, res) => {
  const { id, name, price, costPrice, image, categoryId, subcategoryId, variant, isOutOfStock, isSpecial, displayOrder } = req.body;
  if (!id || !name) {
    return res.status(400).json({ error: 'Missing required fields: id, name' });
  }
  const savedImage = saveBase64Image(image);
  try {
    await query(
      `INSERT INTO products (id, name, price, cost_price, image, category_id, subcategory_id, variant, is_out_of_stock, is_special, display_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, name, price !== undefined && price !== null ? parseFloat(price) : null, parseFloat(costPrice) || 0, savedImage, categoryId || null, subcategoryId || null, variant || null, isOutOfStock ? 1 : 0, isSpecial ? 1 : 0, displayOrder || 0]
    );
    const [rows] = await query(`SELECT id, name, price, cost_price AS costPrice, image, category_id AS categoryId, subcategory_id AS subcategoryId, variant, is_out_of_stock AS isOutOfStock, is_special AS isSpecial, display_order AS displayOrder FROM products ORDER BY display_order ASC`);
    res.status(201).json({ message: 'Product created', id, products: rows.map(r => ({ ...r, price: r.price !== null ? Number(r.price) : null, costPrice: Number(r.costPrice), isOutOfStock: !!r.isOutOfStock, isSpecial: !!r.isSpecial })) });
  } catch (error) {
    if (error.message && error.message.includes('Duplicate')) return res.status(400).json({ error: 'Product ID exists' });
    console.error('DB error:', error);
    res.status(500).json({ error: 'DB error' });
  }
});

const updateProductHandler = async (req, res) => {
  const { id } = req.params;
  const { name, price, costPrice, image, categoryId, subcategoryId, variant, isOutOfStock, isSpecial, displayOrder } = req.body;
  const savedImage = image !== undefined ? saveBase64Image(image) : undefined;
  try {
    const [existing] = await query('SELECT * FROM products WHERE id = ?', [id]);
    if (existing.length === 0) return res.status(404).json({ error: 'Product not found' });

    await query(
      `UPDATE products SET
        name = COALESCE(?, name), price = COALESCE(?, price),
        cost_price = COALESCE(?, cost_price), image = COALESCE(?, image),
        category_id = COALESCE(?, category_id), subcategory_id = COALESCE(?, subcategory_id),
        variant = COALESCE(?, variant), is_out_of_stock = COALESCE(?, is_out_of_stock),
        is_special = COALESCE(?, is_special), display_order = COALESCE(?, display_order),
        updated_at = NOW()
       WHERE id = ?`,
      [name || null, price !== null && price !== undefined ? parseFloat(price) : null, costPrice !== undefined ? parseFloat(costPrice) : null, savedImage !== undefined ? savedImage : null, categoryId || null, subcategoryId || null, variant || null, isOutOfStock !== undefined ? (isOutOfStock ? 1 : 0) : null, isSpecial !== undefined ? (isSpecial ? 1 : 0) : null, displayOrder || null, id]
    );
    const [rows] = await query('SELECT id, name, price, cost_price AS costPrice, image, category_id AS categoryId, subcategory_id AS subcategoryId, variant, is_out_of_stock AS isOutOfStock, is_special AS isSpecial, display_order AS displayOrder FROM products ORDER BY display_order ASC');
    res.json({ message: 'Product updated', products: rows.map(r => ({ ...r, price: r.price !== null ? Number(r.price) : null, costPrice: Number(r.costPrice), isOutOfStock: !!r.isOutOfStock, isSpecial: !!r.isSpecial })) });
  } catch (error) {
    console.error('DB error:', error);
    res.status(500).json({ error: 'DB error' });
  }
};

const deleteProductHandler = async (req, res) => {
  const { id } = req.params;
  try {
    await query('DELETE FROM products WHERE id = ?', [id]);
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Database error' });
  }
};

app.put('/api/products/:id', updateProductHandler);
app.post('/api/products-update/:id', updateProductHandler);
app.delete('/api/products/:id', deleteProductHandler);
app.post('/api/products-delete/:id', deleteProductHandler);

// ─── SUBCATEGORIES API ───

app.get('/api/subcategories', async (req, res) => {
  try {
    const [rows] = await query(
      'SELECT id, category_id AS categoryId, name, display_order AS displayOrder, image FROM subcategories ORDER BY display_order ASC'
    );
    res.json(rows);
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

app.post('/api/subcategories', async (req, res) => {
  const { id, categoryId, name, displayOrder, image } = req.body;
  if (!id || !categoryId || !name) {
    return res.status(400).json({ error: 'Missing required fields: id, categoryId, name' });
  }
  try {
    await query(
      'INSERT INTO subcategories (id, category_id, name, display_order, image) VALUES (?, ?, ?, ?, ?)',
      [id, categoryId, name, displayOrder || 0, image || null]
    );
    const [rows] = await query('SELECT id, category_id AS categoryId, name, display_order AS displayOrder, image FROM subcategories ORDER BY display_order ASC');
    res.status(201).json({ message: 'Subcategory created', id, subcategories: rows });
  } catch (error) {
    if (error.message && error.message.includes('Duplicate')) return res.status(400).json({ error: 'Subcategory ID exists' });
    console.error('Database error:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

const updateSubcategoryHandler = async (req, res) => {
  const { id } = req.params;
  const { name, displayOrder, image } = req.body;
  try {
    await query(
      'UPDATE subcategories SET name = COALESCE(?, name), display_order = COALESCE(?, display_order), image = COALESCE(?, image) WHERE id = ?',
      [name || null, displayOrder || null, image !== undefined ? image : null, id]
    );
    const [rows] = await query('SELECT id, category_id AS categoryId, name, display_order AS displayOrder, image FROM subcategories ORDER BY display_order ASC');
    res.json({ message: 'Subcategory updated', subcategories: rows });
  } catch (error) {
    console.error('DB error:', error);
    res.status(500).json({ error: 'DB error' });
  }
};

const deleteSubcategoryHandler = async (req, res) => {
  const { id } = req.params;
  try {
    await query('UPDATE products SET subcategory_id = NULL WHERE subcategory_id = ?', [id]);
    await query('DELETE FROM subcategories WHERE id = ?', [id]);
    res.json({ message: 'Subcategory deleted' });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Database error' });
  }
};

const updateSettingsHandler = async (req, res) => {
  const settings = req.body;
  if (!settings || typeof settings !== 'object') {
    return res.status(400).json({ error: 'Settings object is required' });
  }
  try {
    for (const [key, value] of Object.entries(settings)) {
      await query(
        'INSERT INTO store_settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?, updated_at = NOW()',
        [key, String(value), String(value)]
      );
    }
    res.json({ message: 'Settings saved successfully' });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Database error' });
  }
};

app.get('/api/settings', async (req, res) => {
  try {
    const [rows] = await query('SELECT setting_key AS settingKey, setting_value AS settingValue FROM store_settings');
    const settings = {};
    for (const row of rows) {
      settings[row.settingKey] = row.settingValue;
    }
    res.json(settings);
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

app.put('/api/subcategories/:id', updateSubcategoryHandler);
app.post('/api/subcategories-update/:id', updateSubcategoryHandler);
app.delete('/api/subcategories/:id', deleteSubcategoryHandler);
app.post('/api/subcategories-delete/:id', deleteSubcategoryHandler);
app.put('/api/settings', updateSettingsHandler);
app.post('/api/settings-update', updateSettingsHandler);

// ─── ORDERS API ───

app.get('/api/orders', async (req, res) => {
  try {
    const [rows] = await query(`
      SELECT id, customer_name AS customerName, customer_phone AS customerPhone,
        address, items, total, total_cost AS totalCost, profit, status,
        payment_method AS paymentMethod, tax_amount AS taxAmount,
        tax_rate AS taxRate, created_at AS createdAt
      FROM orders ORDER BY created_at DESC
    `);
    res.json(rows.map(row => ({
      ...row,
      items: typeof row.items === 'string' ? JSON.parse(row.items) : row.items,
      total: Number(row.total),
      totalCost: Number(row.totalCost),
      profit: Number(row.profit),
      taxAmount: Number(row.taxAmount || 0),
      taxRate: Number(row.taxRate || 0),
    })));
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

app.post('/api/orders', async (req, res) => {
  const { id, customerName, customerPhone, address, items, total, totalCost, profit, status, paymentMethod, taxAmount, taxRate, createdAt } = req.body;
  if (!id || !customerName || !items) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  try {
    await query(
      `INSERT INTO orders (id, customer_name, customer_phone, address, items, total, total_cost, profit, status, payment_method, tax_amount, tax_rate, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, customerName, customerPhone, address, JSON.stringify(items), parseFloat(total) || 0, parseFloat(totalCost) || 0, parseFloat(profit) || 0, status || 'Pending', paymentMethod || 'COD', parseFloat(taxAmount || 0), parseFloat(taxRate || 0), createdAt ? new Date(createdAt).toISOString().replace('T', ' ').replace('Z', '') : new Date().toISOString().replace('T', ' ').replace('Z', '')]
    );
    res.status(201).json({ message: 'Order created successfully', orderId: id });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

app.post('/api/orders/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  if (!status) return res.status(400).json({ error: 'Missing status' });
  try {
    const [result] = await query('UPDATE orders SET status = ? WHERE id = ?', [status, id]);
    if (result.affectedRows > 0) {
      res.json({ message: 'Order status updated successfully' });
    } else {
      res.status(404).json({ error: 'Order not found' });
    }
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// ─── DIAGNOSE / LOGS ───

app.get('/api/diagnose-db', async (req, res) => {
  try {
    const [tables] = await query("SHOW TABLES");
    const [rows] = await query('SELECT id, status, customer_name FROM orders');
    res.json({ tables, rows });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/debug/categories', async (req, res) => {
  try {
    const [rows] = await query(
      'SELECT id, name, LENGTH(image) AS image_length, LEFT(image, 50) AS image_preview, display_order AS displayOrder, has_subcategories AS hasSubcategories FROM categories ORDER BY display_order ASC'
    );
    res.json(rows.map(r => ({ ...r, hasSubcategories: !!r.hasSubcategories })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/debug/category-image/:id', async (req, res) => {
  try {
    const [rows] = await query('SELECT id, name, LENGTH(image) AS image_length, LEFT(image, 100) AS image_preview, image FROM categories WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Category not found' });
    const r = rows[0];
    res.json({
      id: r.id,
      name: r.name,
      image_length: r.image_length,
      image_preview: r.image_preview,
      is_data_uri: r.image ? r.image.startsWith('data:') : false,
      is_upload_path: r.image ? r.image.startsWith('/uploads/') : false,
      is_empty: !r.image || r.image === '',
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/logs', (req, res) => {
  try {
    res.type('text/plain').send(global.startupLogs.join('\n'));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─── IMAGE UPLOAD ───

app.post('/api/upload', async (req, res) => {
  try {
    const { image } = req.body;
    if (!image || typeof image !== 'string') {
      return res.status(400).json({ error: 'Missing image data' });
    }
    const matches = image.match(/^data:image\/(png|jpeg|jpg|gif|webp);base64,(.+)$/);
    if (!matches) {
      return res.status(400).json({ error: 'Invalid image format' });
    }
    const ext = matches[1] === 'jpeg' ? 'jpg' : matches[1];
    const buffer = Buffer.from(matches[2], 'base64');
    const filename = `${Date.now()}-${crypto.randomBytes(4).toString('hex')}.${ext}`;
    fs.writeFileSync(path.join(UPLOADS_DIR, filename), buffer);
    res.json({ url: `/uploads/${filename}` });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
});

// ─── REORDER API ───

app.put('/api/reorder', async (req, res) => {
  const { items } = req.body;
  if (!items || !Array.isArray(items)) {
    return res.status(400).json({ error: 'items array is required' });
  }
  try {
    for (const item of items) {
      if (item.type === 'category') {
        await query('UPDATE categories SET display_order = ? WHERE id = ?', [item.displayOrder, item.id]);
      } else if (item.type === 'subcategory') {
        await query('UPDATE subcategories SET display_order = ? WHERE id = ?', [item.displayOrder, item.id]);
      } else if (item.type === 'product') {
        await query('UPDATE products SET display_order = ? WHERE id = ?', [item.displayOrder, item.id]);
      }
    }
    res.json({ message: 'Reordered successfully' });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

app.get('/api/check-permissions', (req, res) => {
  try {
    const testFile = path.join(UPLOADS_DIR, 'test-write.txt');
    fs.writeFileSync(testFile, 'write test');
    fs.unlinkSync(testFile);
    res.json({ writable: true, path: UPLOADS_DIR });
  } catch (err) {
    res.status(500).json({ writable: false, path: UPLOADS_DIR, error: err.message });
  }
});

app.post('/api/subscribe', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });
  try {
    await query('INSERT INTO subscribers (email) VALUES (?)', [email]);
    res.status(201).json({ message: 'Subscribed successfully' });
  } catch (error) {
    if (error.message && error.message.includes('Duplicate')) {
      return res.status(400).json({ error: 'This email is already subscribed!' });
    }
    console.error('Database error:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// ─── USERS API ───

app.get('/api/users', async (req, res) => {
  try {
    const [rows] = await query('SELECT id, name, role, created_at AS createdAt FROM users ORDER BY name ASC');
    res.json(rows);
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

app.post('/api/users', async (req, res) => {
  const { name, password, role } = req.body;
  if (!name || !password || !role) {
    return res.status(400).json({ error: 'Missing required fields: name, password, role' });
  }
  try {
    const [result] = await query('INSERT INTO users (name, role, password) VALUES (?, ?, ?)', [name, role, password]);
    res.status(201).json({ message: 'User created', id: result.insertId });
  } catch (error) {
    if (error.message && error.message.includes('Duplicate')) {
      return res.status(400).json({ error: 'Username already exists' });
    }
    console.error('Database error:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

const updateUserHandler = async (req, res) => {
  const { id } = req.params;
  const { name, password, role } = req.body;
  try {
    await query(
      'UPDATE users SET name = COALESCE(?, name), role = COALESCE(?, role), password = COALESCE(?, password) WHERE id = ?',
      [name || null, role || null, password || null, id]
    );
    res.json({ message: 'User updated' });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Database error' });
  }
};

const deleteUserHandler = async (req, res) => {
  const { id } = req.params;
  try {
    await query('DELETE FROM users WHERE id = ?', [id]);
    res.json({ message: 'User deleted' });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Database error' });
  }
};

app.put('/api/users/:id', updateUserHandler);
app.post('/api/users-update/:id', updateUserHandler);
app.delete('/api/users/:id', deleteUserHandler);
app.post('/api/users-delete/:id', deleteUserHandler);

app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }
  try {
    const [rows] = await query('SELECT id, name, role FROM users WHERE name = ? AND password = ?', [username, password]);
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }
    res.json({ user: rows[0] });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// ─── STATIC FILE SERVING ───

app.use(express.static(path.join(__dirname, 'public')));

app.get('*', (req, res) => {
  if (!req.path.startsWith('/api/')) {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  }
});

app.listen(port, () => {
  console.log('Express server (MySQL) is running on port ' + port);
});
