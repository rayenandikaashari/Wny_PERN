require('dotenv').config();

const { Pool } = require('pg');

const db = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 5432),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function seed() {
  const client = await db.connect();

  try {
    await client.query('BEGIN');

    const result = await client.query(
      'SELECT COUNT(*)::int AS total FROM barang'
    );

    if (result.rows[0].total > 0) {
      console.log(
        'Seeder dilewati: tabel barang sudah berisi data.'
      );
      await client.query('COMMIT');
      return;
    }

    const barang = [
      {
        nama: 'Beras',
        kategori: 'Sembako',
        harga: 15000,
        stok: 20,
        satuan: 'kg',
      },
      {
        nama: 'Minyak Goreng',
        kategori: 'Sembako',
        harga: 18000,
        stok: 15,
        satuan: 'liter',
      },
      {
        nama: 'Gula Pasir',
        kategori: 'Sembako',
        harga: 17000,
        stok: 10,
        satuan: 'kg',
      },
    ];

    for (const item of barang) {
      await client.query(
        `INSERT INTO barang
          (nama, kategori, harga, stok, satuan)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          item.nama,
          item.kategori,
          item.harga,
          item.stok,
          item.satuan,
        ]
      );
    }

    await client.query('COMMIT');
    console.log('Seeder berhasil: data barang contoh ditambahkan.');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Seeder gagal:', error.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await db.end();
  }
}

seed().catch(async (error) => {
  console.error('Koneksi database gagal:', error.message);
  await db.end();
  process.exitCode = 1;
});