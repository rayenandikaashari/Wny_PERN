exports.up = (pgm) => {
  pgm.createTable('barang', {
    id: {
      type: 'serial',
      primaryKey: true,
    },
    nama: {
      type: 'varchar(100)',
      notNull: true,
    },
    kategori: {
      type: 'varchar(50)',
      notNull: true,
    },
    harga: {
      type: 'numeric(12,2)',
      notNull: true,
      check: 'harga >= 0',
    },
    stok: {
      type: 'integer',
      notNull: true,
      default: 0,
      check: 'stok >= 0',
    },
    satuan: {
      type: 'varchar(20)',
      notNull: true,
      default: 'pcs',
    },
    foto: {
      type: 'text',
    },
    deskripsi: {
      type: 'text',
    },
    created_at: {
      type: 'timestamp without time zone',
      default: pgm.func('CURRENT_TIMESTAMP'),
    },
    updated_at: {
      type: 'timestamp without time zone',
      default: pgm.func('CURRENT_TIMESTAMP'),
    },
  });

  pgm.createTable('pesanan', {
    id: {
  type: 'bigint',
  primaryKey: true,
  sequenceGenerated: {
    precedence: 'ALWAYS',
  },
},
    kode_pesanan: {
      type: 'varchar(40)',
      notNull: true,
      unique: true,
    },
    nama_pelanggan: {
      type: 'varchar(100)',
    },
    no_hp: {
      type: 'varchar(25)',
    },
    alamat: {
      type: 'text',
    },
    metode_pembayaran: {
      type: 'varchar(10)',
      notNull: true,
      check: "metode_pembayaran IN ('QRIS', 'COD')",
    },
    status: {
      type: 'varchar(30)',
      notNull: true,
      check: "status IN ('menunggu_pembayaran', 'menunggu_konfirmasi', 'diproses', 'dibayar', 'selesai', 'dibatalkan')",
    },
    total: {
      type: 'numeric(12,2)',
      notNull: true,
      check: 'total >= 0',
    },
    batas_waktu: {
      type: 'timestamp with time zone',
    },
    dibuat_pada: {
      type: 'timestamp with time zone',
      notNull: true,
      default: pgm.func('now()'),
    },
    diperbarui_pada: {
      type: 'timestamp with time zone',
      notNull: true,
      default: pgm.func('now()'),
    },
  });

  pgm.createTable('detail_pesanan', {
    id: {
      type: 'bigint',
      primaryKey: true,
      sequenceGenerated: {
        precedence: 'ALWAYS',
      },
    },
    pesanan_id: {
      type: 'bigint',
      notNull: true,
      references: 'pesanan(id)',
      onDelete: 'RESTRICT',
    },
    barang_id: {
      type: 'integer',
      notNull: true,
      references: 'barang(id)',
      onDelete: 'RESTRICT',
    },
    nama_barang: {
      type: 'varchar(100)',
      notNull: true,
    },
    harga: {
      type: 'numeric(12,2)',
      notNull: true,
      check: 'harga >= 0',
    },
    jumlah: {
      type: 'integer',
      notNull: true,
      check: 'jumlah > 0',
    },
    subtotal: {
      type: 'numeric(14,2)',
      notNull: true,
      check: 'subtotal >= 0',
    },
  });

  pgm.createIndex('detail_pesanan', 'pesanan_id', {
    name: 'idx_detail_pesanan_pesanan',
  });

  pgm.createTable('reservasi_stok', {
    id: {
  type: 'bigint',
  primaryKey: true,
  sequenceGenerated: {
    precedence: 'ALWAYS',
  },
},
    pesanan_id: {
      type: 'bigint',
      notNull: true,
      references: 'pesanan(id)',
      onDelete: 'RESTRICT',
    },
    barang_id: {
      type: 'integer',
      notNull: true,
      references: 'barang(id)',
      onDelete: 'RESTRICT',
    },
    jumlah: {
      type: 'integer',
      notNull: true,
      check: 'jumlah > 0',
    },
    status: {
      type: 'varchar(15)',
      notNull: true,
      default: 'aktif',
      check: "status IN ('aktif', 'terpakai', 'dilepas')",
    },
    dibuat_pada: {
      type: 'timestamp with time zone',
      notNull: true,
      default: pgm.func('now()'),
    },
    diperbarui_pada: {
      type: 'timestamp with time zone',
      notNull: true,
      default: pgm.func('now()'),
    },
  });

  pgm.addConstraint(
    'reservasi_stok',
    'reservasi_stok_pesanan_id_barang_id_key',
    {
      unique: ['pesanan_id', 'barang_id'],
    }
  );

  pgm.createIndex('pesanan', ['status', 'batas_waktu'], {
    name: 'idx_pesanan_status_batas',
  });

  pgm.createIndex('reservasi_stok', ['status', 'pesanan_id'], {
    name: 'idx_reservasi_status',
  });
};

exports.down = (pgm) => {
  pgm.dropTable('reservasi_stok');
  pgm.dropTable('detail_pesanan');
  pgm.dropTable('pesanan');
  pgm.dropTable('barang');
};