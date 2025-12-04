const express = require('express');
const path = require('path');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL && process.env.NODE_ENV === 'production'
    ? { rejectUnauthorized: false }
    : false,
});

async function ensureTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS inventory_items (
      id SERIAL PRIMARY KEY,
      product_name TEXT,
      stock INTEGER NOT NULL DEFAULT 0,
      required INTEGER NOT NULL DEFAULT 0,
      shortage INTEGER NOT NULL DEFAULT 0
    );
  `);
}

app.use(express.json());
app.use(express.static(path.join(__dirname)));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/inventory', async (req, res) => {
  try {
    await ensureTable();
    const result = await pool.query(
      'SELECT id, product_name, stock, required, shortage FROM inventory_items ORDER BY id ASC'
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching inventory', err);
    res.status(500).json({ error: 'Failed to fetch inventory' });
  }
});

app.post('/api/inventory/save', async (req, res) => {
  const { items } = req.body || {};
  if (!Array.isArray(items)) {
    return res.status(400).json({ error: 'items must be an array' });
  }

  const client = await pool.connect();
  try {
    await ensureTable();
    await client.query('BEGIN');
    await client.query('DELETE FROM inventory_items');

    for (const item of items) {
      const name = typeof item.name === 'string' ? item.name : '';
      const stock = Number.isFinite(Number(item.stock)) ? Number(item.stock) : 0;
      const required = Number.isFinite(Number(item.required)) ? Number(item.required) : 0;
      const shortage = Math.max(0, required - stock);

      await client.query(
        'INSERT INTO inventory_items (product_name, stock, required, shortage) VALUES ($1, $2, $3, $4)',
        [name, stock, required, shortage]
      );
    }

    await client.query('COMMIT');
    res.json({ success: true });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error saving inventory', err);
    res.status(500).json({ error: 'Failed to save inventory' });
  } finally {
    client.release();
  }
});

ensureTable()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server listening on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to initialize database', err);
    process.exit(1);
  });
