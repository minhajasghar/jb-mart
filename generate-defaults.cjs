const mysql = require('mysql2/promise');
const fs = require('fs');

(async () => {
  const conn = await mysql.createConnection({ host: 'localhost', user: 'root', password: '', database: 'jbmegamart_123' });

  // Categories
  const [cats] = await conn.query('SELECT id, name, display_order, image, has_subcategories FROM categories ORDER BY display_order');
  let out = 'const DEFAULT_CATEGORIES: Category[] = [\n';
  for (const c of cats) {
    const extra = c.has_subcategories ? ', hasSubcategories: true' : '';
    out += `  { id: '${c.id}', name: '${c.name}', displayOrder: ${c.display_order}, image: '${c.image || ''}'${extra} },\n`;
  }
  out += '];\n\n';

  // Subcategories
  const [subcats] = await conn.query('SELECT id, category_id, name, display_order FROM subcategories ORDER BY display_order');
  out += 'const DEFAULT_SUBCATEGORIES: Subcategory[] = [\n';
  for (const s of subcats) {
    out += `  { id: '${s.id}', categoryId: '${s.category_id}', name: '${s.name}', required: false, priceAdjustment: 0, displayOrder: ${s.display_order} },\n`;
  }
  out += '];\n\n';

  // Products
  const [prods] = await conn.query('SELECT id, name, price, cost_price, image, category_id, subcategory_id, variant, display_order FROM products ORDER BY display_order');
  out += 'const DEFAULT_PRODUCTS: Product[] = [\n';
  for (const p of prods) {
    const price = p.price !== null ? p.price : 'null';
    const subcatId = p.subcategory_id ? `, subcategoryId: '${p.subcategory_id}'` : '';
    const variant = p.variant ? `, variant: '${p.variant.replace(/'/g, "\\'")}'` : '';
    out += `  { id: '${p.id}', name: '${p.name.replace(/'/g, "\\'")}', price: ${price}, costPrice: ${p.cost_price}, image: '${p.image || ''}', categoryId: '${p.category_id}'${subcatId}${variant}, isOutOfStock: false },\n`;
  }
  out += '];\n';

  fs.writeFileSync(__dirname + '/generated-defaults.txt', out);
  console.log('Generated defaults written to generated-defaults.txt');
  console.log('Categories:', cats.length);
  console.log('Subcategories:', subcats.length);
  console.log('Products:', prods.length);

  await conn.end();
})();
