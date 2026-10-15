
import { useEffect, useMemo, useState } from 'react';

const API = 'http://localhost:3000/api';
const API_BARANG = `${API}/barang`;
const API_CHECKOUT = `${API}/checkout`;
const API_PESANAN = `${API}/pesanan`;

function formatRupiah(harga) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(Number(harga) || 0);
}

function bacaKeranjang() {
  try {
    return JSON.parse(localStorage.getItem('keranjang-wny')) || [];
  } catch {
    return [];
  }
}

function formatWaktu(detik) {
  const menit = Math.floor(detik / 60);
  const sisaDetik = detik % 60;
  return `${String(menit).padStart(2, '0')}:${String(sisaDetik).padStart(2, '0')}`;
}

function labelStatus(status) {
  const labels = {
    menunggu_pembayaran: 'Menunggu Pembayaran',
    menunggu_konfirmasi: 'Menunggu Konfirmasi',
    dibayar: 'Pembayaran Berhasil',
    diproses: 'Pesanan Diproses',
    selesai: 'Pesanan Selesai',
    dibatalkan: 'Pesanan Dibatalkan',
  };

  return labels[status] || status || 'Status tidak diketahui';
}

function App() {
  const [barang, setBarang] = useState([]);
  const [keranjang, setKeranjang] = useState(bacaKeranjang);
  const [pencarian, setPencarian] = useState('');
  const [kategoriAktif, setKategoriAktif] = useState('Semua');
  const [halaman, setHalaman] = useState('katalog');
  const [barangDipilih, setBarangDipilih] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pesan, setPesan] = useState('');

  const [metodePembayaran, setMetodePembayaran] = useState('QRIS');
  const [pesananAktif, setPesananAktif] = useState(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [detikTersisa, setDetikTersisa] = useState(0);
  const [memuatStatus, setMemuatStatus] = useState(false);
  const [formBarang, setFormBarang] = useState({
    nama: '',
    kategori: '',
    harga: '',
    stok: '',
    satuan: 'pcs',
    foto: '',
    deskripsi: '',
  });
  const [barangEditId, setBarangEditId] = useState(null);

  const [tambahBarangLoading, setTambahBarangLoading] = useState(false);
  const [tambahBarangError, setTambahBarangError] = useState('');
  const [tambahBarangPesan, setTambahBarangPesan] = useState('');

  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminToken, setAdminToken] = useState('');
  const [adminPesanan, setAdminPesanan] = useState([]);
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminError, setAdminError] = useState('');


  async function ambilBarang() {
    try {
      const response = await fetch(API_BARANG);

      if (!response.ok) {
        throw new Error('Gagal mengambil data barang.');
      }

      const data = await response.json();
      setBarang(data);
      setError('');
    } catch {
      setError(
        'Data barang gagal dimuat. Pastikan backend dan database aktif.'
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    ambilBarang();
  }, []);

  useEffect(() => {
    localStorage.setItem('keranjang-wny', JSON.stringify(keranjang));
  }, [keranjang]);

  const daftarKategori = useMemo(
    () => ['Semua', ...new Set(barang.map((item) => item.kategori))],
    [barang]
  );

  const hasilPencarian = barang.filter((item) => {
    const cocokPencarian = `${item.nama} ${item.kategori}`
      .toLowerCase()
      .includes(pencarian.toLowerCase());

    const cocokKategori =
      kategoriAktif === 'Semua' || item.kategori === kategoriAktif;

    return cocokPencarian && cocokKategori;
  });

  const jumlahBarang = keranjang.reduce(
    (total, item) => total + item.jumlah,
    0
  );

  const totalBelanja = keranjang.reduce(
    (total, item) => total + Number(item.harga) * item.jumlah,
    0
  );

  function tampilkanPesan(teks) {
    setPesan(teks);
    window.setTimeout(() => setPesan(''), 3000);
  }

  function tambahKeKeranjang(item, jumlah = 1) {
    const stok = Number(item.stok) || 0;

    if (stok <= 0) {
      tampilkanPesan('Maaf, stok barang sedang habis.');
      return;
    }

    setKeranjang((sebelumnya) => {
      const ada = sebelumnya.find((x) => x.id === item.id);
      const jumlahSaatIni = ada ? ada.jumlah : 0;
      const jumlahBaru = jumlahSaatIni + jumlah;

      if (jumlahBaru > stok) {
        tampilkanPesan(`Stok ${item.nama} hanya ${stok} ${item.satuan}.`);
        return sebelumnya;
      }

      if (ada) {
        return sebelumnya.map((x) =>
          x.id === item.id ? { ...x, jumlah: jumlahBaru } : x
        );
      }

      return [
        ...sebelumnya,
        {
          id: item.id,
          nama: item.nama,
          kategori: item.kategori,
          harga: Number(item.harga),
          satuan: item.satuan,
          stok,
          foto: item.foto || null,
          jumlah,
        },
      ];
    });

    setBarangDipilih(null);
    tampilkanPesan(`${item.nama} ditambahkan ke keranjang.`);
  }

  function ubahJumlah(id, jumlahBaru) {
    if (jumlahBaru < 1) return;

    setKeranjang((sebelumnya) =>
      sebelumnya.map((item) => {
        if (item.id !== id) return item;

        if (jumlahBaru > item.stok) {
          tampilkanPesan(
            `Stok ${item.nama} hanya ${item.stok} ${item.satuan}.`
          );
          return item;
        }

        return { ...item, jumlah: jumlahBaru };
      })
    );
  }

  function hapusDariKeranjang(id) {
    setKeranjang((sebelumnya) =>
      sebelumnya.filter((item) => item.id !== id)
    );
    tampilkanPesan('Barang dihapus dari keranjang.');
  }

  function bukaKatalog() {
    setHalaman('katalog');
    setBarangDipilih(null);
  }

  function bukaKeranjang() {
    setHalaman('keranjang');
    setBarangDipilih(null);
  }

  async function buatPesanan() {
    if (keranjang.length === 0 || checkoutLoading) return;

    setCheckoutLoading(true);

    try {
      const response = await fetch(API_CHECKOUT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          metode_pembayaran: metodePembayaran,
          items: keranjang.map((item) => ({
            barang_id: item.id,
            jumlah: item.jumlah,
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Checkout gagal.');
      }

      if (!data.pesanan?.kode_pesanan) {
        throw new Error('Server tidak mengembalikan kode pesanan.');
      }

      setPesananAktif(data.pesanan);
      setKeranjang([]);
      setHalaman('pesanan');

      await ambilBarang();

      tampilkanPesan('Pesanan berhasil dibuat.');
    } catch (err) {
      tampilkanPesan(err.message || 'Gagal membuat pesanan.');
    } finally {
      setCheckoutLoading(false);
    }
  }

  async function perbaruiStatusPesanan() {
    if (!pesananAktif?.kode_pesanan || memuatStatus) return;

    setMemuatStatus(true);

    try {
      const response = await fetch(
        `${API_PESANAN}/${encodeURIComponent(pesananAktif.kode_pesanan)}`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Gagal mengambil status pesanan.');
      }

      if (data.pesanan) {
        setPesananAktif(data.pesanan);

        if (data.pesanan.status === 'dibatalkan') {
          await ambilBarang();
        }
      }
    } catch (err) {
      tampilkanPesan(err.message || 'Status pesanan gagal diperbarui.');
    } finally {
      setMemuatStatus(false);
    }
  }


async function loginAdmin(event) {
  event.preventDefault();
  setAdminLoading(true);
  setAdminError('');

  try {
    const response = await fetch(`${API}/admin/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: adminUsername,
        password: adminPassword,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Login admin gagal.');
    }

    setAdminToken(data.token);
    setAdminPassword('');
    await ambilPesananAdmin(data.token);
  } catch (err) {
    setAdminError(err.message || 'Tidak dapat menghubungi backend.');
  } finally {
    setAdminLoading(false);
  }
}

async function ambilPesananAdmin(token = adminToken) {
  if (!token) return;

  setAdminLoading(true);
  setAdminError('');

  try {
    const response = await fetch(`${API}/admin/pesanan`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Gagal mengambil pesanan.');
    }

    setAdminPesanan(data.data || []);
  } catch (err) {
    setAdminError(err.message || 'Gagal mengambil daftar pesanan.');
  } finally {
    setAdminLoading(false);
  }
}

async function tambahBarang(event) {
  event.preventDefault();

  if (!adminToken) {
    setTambahBarangError('Silakan login sebagai admin.');
    return;
  }

  setTambahBarangLoading(true);
  setTambahBarangError('');
  setTambahBarangPesan('');

  try {
    const response = await fetch(API_BARANG, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        ...formBarang,
        harga: Number(formBarang.harga),
        stok: Number(formBarang.stok),
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Gagal menambahkan barang.');
    }

    setTambahBarangPesan('Barang berhasil ditambahkan.');

    setFormBarang({
      nama: '',
      kategori: '',
      harga: '',
      stok: '',
      satuan: 'pcs',
      foto: '',
      deskripsi: '',
    });

    await ambilBarang();
  } catch (error) {
    setTambahBarangError(
      error.message || 'Tidak dapat menghubungi backend.'
    );
  } finally {
    setTambahBarangLoading(false);
  }
}


const mulaiEditBarang = (barang) => {
  setBarangEditId(barang.id);

  setFormBarang({
    nama: barang.nama ?? '',
    kategori: barang.kategori ?? '',
    harga: String(barang.harga ?? ''),
    stok: String(barang.stok ?? ''),
    satuan: barang.satuan ?? '',
    foto: barang.foto ?? '',
    deskripsi: barang.deskripsi ?? '',
  });

  setTambahBarangError('');
  setTambahBarangPesan('');
};

const simpanEditBarang = async (event) => {
  event.preventDefault();

  if (!barangEditId) return;

  setTambahBarangLoading(true);
  setTambahBarangError('');
  setTambahBarangPesan('');

  try {
    const response = await fetch(`${API_BARANG}/${barangEditId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        ...formBarang,
        harga: Number(formBarang.harga),
        stok: Number(formBarang.stok),
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Gagal memperbarui barang.');
    }

    await ambilBarang();

    setBarangEditId(null);
    setFormBarang({
      nama: '',
      kategori: '',
      harga: '',
      stok: '',
      satuan: '',
      foto: '',
      deskripsi: '',
    });

    setTambahBarangPesan('Barang berhasil diperbarui!');
  } catch (error) {
    setTambahBarangError(error.message || 'Terjadi kesalahan.');
  } finally {
    setTambahBarangLoading(false);
  }
};

async function ubahStatusPesanan(pesanan, statusBaru) {
  const konfirmasi = {
    selesai: `Tandai pesanan ${pesanan.kode_pesanan} sebagai selesai?`,
    dibatalkan: `Batalkan pesanan ${pesanan.kode_pesanan}? Stok reservasi aktif akan dikembalikan.`,
  };

  if (!window.confirm(konfirmasi[statusBaru])) return;

  setAdminLoading(true);
  setAdminError('');

  try {
    const response = await fetch(
      `${API}/admin/pesanan/${encodeURIComponent(pesanan.kode_pesanan)}/status`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ status: statusBaru }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Gagal mengubah status pesanan.');
    }

    await ambilPesananAdmin(adminToken);
  } catch (err) {
    setAdminError(err.message || 'Terjadi kesalahan.');
  } finally {
    setAdminLoading(false);
  }
}

function logoutAdmin() {
  setAdminToken('');
  setAdminUsername('');
  setAdminPassword('');
  setAdminPesanan([]);
  setAdminError('');
  setHalaman('katalog');
}

  // Periksa status secara berkala. Status final ditentukan backend.
  useEffect(() => {
    if (halaman !== 'pesanan' || !pesananAktif?.kode_pesanan) return;

    const statusFinal = [
      'dibayar',
      'diproses',
      'selesai',
      'dibatalkan',
    ].includes(pesananAktif.status);

    if (statusFinal) return;

    const interval = window.setInterval(() => {
      perbaruiStatusPesanan();
    }, 3000);

    return () => window.clearInterval(interval);
  }, [
    halaman,
    pesananAktif?.kode_pesanan,
    pesananAktif?.status,
  ]);

  // Countdown hanya untuk pesanan yang masih menunggu.
  useEffect(() => {
    if (halaman !== 'pesanan' || !pesananAktif) return;

    const statusMenunggu = [
      'menunggu_pembayaran',
      'menunggu_konfirmasi',
    ].includes(pesananAktif.status);

    if (!statusMenunggu || !pesananAktif.batas_waktu) {
      setDetikTersisa(0);
      return;
    }

    function hitungSisaWaktu() {
      const sisa = Math.max(
        0,
        Math.ceil(
          (new Date(pesananAktif.batas_waktu).getTime() - Date.now()) / 1000
        )
      );

      setDetikTersisa(sisa);
    }

    hitungSisaWaktu();

    const timer = window.setInterval(hitungSisaWaktu, 1000);

    return () => window.clearInterval(timer);
  }, [
    halaman,
    pesananAktif?.kode_pesanan,
    pesananAktif?.status,
    pesananAktif?.batas_waktu,
  ]);

  const statusMenunggu = [
    'menunggu_pembayaran',
    'menunggu_konfirmasi',
  ].includes(pesananAktif?.status);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <header className="sticky top-0 z-30 bg-emerald-700 text-white shadow-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <button onClick={bukaKatalog} className="text-left">
            <p className="text-xs text-emerald-100 sm:text-sm">
              Selamat datang di
            </p>
            <h1 className="text-lg font-bold sm:text-2xl">
              Warung Sembako Nenek Yoyoh
            </h1>
          </button>

          <button
            onClick={bukaKeranjang}
            className="relative flex shrink-0 items-center gap-2 rounded-xl bg-white/15 px-3 py-2 transition hover:bg-white/25 sm:px-4"
          >
            <span aria-hidden="true">🛒</span>
            <span className="hidden sm:inline">Keranjang</span>
            <span className="rounded-full bg-white px-2 py-0.5 text-xs font-bold text-emerald-800">
              {jumlahBarang}
            </span>
          </button>

<button
  onClick={() => {
    setAdminError('');
    setHalaman('admin');
  }}
  className="shrink-0 rounded-xl bg-white px-3 py-2 font-semibold text-emerald-800 transition hover:bg-emerald-50 sm:px-4"
>
  Admin
</button>

        </div>
      </header>

      {pesan && (
        <div
          role="status"
          className="fixed right-4 top-24 z-50 max-w-sm rounded-xl bg-slate-900 px-5 py-3 text-sm text-white shadow-lg"
        >
          {pesan}
        </div>
      )}

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">


{/* ================= ADMIN ================= */}
{halaman === 'admin' && (
  <section className="mx-auto max-w-5xl">
    {!adminToken ? (
      <div className="mx-auto max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <button
          onClick={bukaKatalog}
          className="mb-6 font-semibold text-emerald-700"
        >
          ← Kembali ke katalog
        </button>

        <div className="mb-6 text-center">
          <div className="text-5xl">🔐</div>
          <h2 className="mt-4 text-2xl font-bold">Login Admin</h2>
          <p className="mt-2 text-sm text-slate-500">
            Warung Sembako Nenek Yoyoh
          </p>
        </div>

        <form onSubmit={loginAdmin} className="space-y-4">
          <div>
            <label className="mb-2 block font-medium">
              Username
            </label>
            <input
              value={adminUsername}
              onChange={(event) =>
                setAdminUsername(event.target.value)
              }
              autoComplete="username"
              required
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-emerald-600"
              placeholder="Masukkan username"
            />
          </div>

          <div>
            <label className="mb-2 block font-medium">
              Password
            </label>
            <input
              type="password"
              value={adminPassword}
              onChange={(event) =>
                setAdminPassword(event.target.value)
              }
              autoComplete="current-password"
              required
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-emerald-600"
              placeholder="Masukkan password"
            />
          </div>

          {adminError && (
            <p role="alert" className="text-sm text-red-600">
              {adminError}
            </p>
          )}

          <button
            type="submit"
            disabled={adminLoading}
            className="w-full rounded-xl bg-emerald-700 px-4 py-3 font-semibold text-white hover:bg-emerald-800 disabled:opacity-50"
          >
            {adminLoading ? 'Memproses...' : 'Login'}
          </button>
        </form>
      </div>
    ) : (
      <>
        {/* HEADER ADMIN */}
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="font-semibold text-emerald-700">
              PANEL ADMIN
            </p>
            <h2 className="mt-1 text-3xl font-bold">
              Daftar Pesanan
            </h2>
            <p className="mt-2 text-slate-500">
              Kelola pesanan pelanggan warung.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => ambilPesananAdmin()}
              disabled={adminLoading}
              className="rounded-xl border border-emerald-700 px-4 py-2 font-semibold text-emerald-700 disabled:opacity-50"
            >
              {adminLoading ? 'Memuat...' : 'Refresh'}
            </button>

            <button
              onClick={logoutAdmin}
              className="rounded-xl bg-red-600 px-4 py-2 font-semibold text-white hover:bg-red-700"
            >
              Keluar
            </button>
          </div>
        </div>

        {adminError && (
          <p
            role="alert"
            className="mt-5 rounded-xl bg-red-50 p-4 text-red-700"
          >
            {adminError}
          </p>
        )}

        {/* STATISTIK */}
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-sm text-slate-500">Total Pesanan</p>
            <p className="mt-2 text-3xl font-bold">
              {adminPesanan.length}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-sm text-slate-500">
              Menunggu Pembayaran
            </p>
            <p className="mt-2 text-3xl font-bold text-amber-600">
              {adminPesanan.filter(
                (p) => p.status === 'menunggu_pembayaran'
              ).length}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-sm text-slate-500">
              Menunggu Konfirmasi COD
            </p>
            <p className="mt-2 text-3xl font-bold text-blue-600">
              {adminPesanan.filter(
                (p) => p.status === 'menunggu_konfirmasi'
              ).length}
            </p>
          </div>     
      </div>
      
{/* DAFTAR BARANG ADMIN */}
<div className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
  <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
    <div>
      <h3 className="text-xl font-bold">Kelola Barang</h3>
      <p className="mt-1 text-sm text-slate-500">
        Pilih barang untuk mengubah informasi produk.
      </p>
    </div>

    <button
      type="button"
      onClick={() => {
        setBarangEditId(null);
        setFormBarang({
          nama: '',
          kategori: '',
          harga: '',
          stok: '',
          satuan: 'pcs',
          foto: '',
          deskripsi: '',
        });
        setTambahBarangError('');
        setTambahBarangPesan('');
      }}
      className="w-full rounded-xl bg-emerald-700 px-4 py-2 font-semibold text-white hover:bg-emerald-800 sm:w-auto"
    >
      + Barang Baru
    </button>
  </div>

  <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
    {barang.length === 0 ? (
      <p className="rounded-xl bg-slate-50 p-4 text-slate-500 md:col-span-2 xl:col-span-3">
        Belum ada barang di katalog.
      </p>
    ) : (
      barang.map((item) => (
        <div
          key={item.id}
          className="flex min-w-0 items-center justify-between gap-3 rounded-xl border border-slate-200 p-3 transition hover:border-emerald-300 hover:bg-emerald-50/30"
        >
          <div className="flex min-w-0 items-center gap-3">
            {item.foto ? (
              <img
                src={item.foto}
                alt={item.nama}
                className="h-14 w-14 shrink-0 rounded-lg object-cover"
              />
            ) : (
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-2xl">
                🛒
              </div>
            )}

            <div className="min-w-0">
              <p className="truncate font-semibold text-slate-800">
                {item.nama}
              </p>
              <p className="truncate text-sm text-slate-500">
                {item.kategori}
              </p>
              <p className="text-xs text-slate-500">
                Stok: {item.stok} {item.satuan}
              </p>
              <p className="mt-1 text-sm font-semibold text-emerald-700">
                {formatRupiah(item.harga)}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => mulaiEditBarang(item)}
            className="shrink-0 rounded-lg border border-emerald-700 px-3 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-700 hover:text-white"
          >
            Edit
          </button>
        </div>
      ))
    )}
  </div>
</div>
        
{/* FORM TAMBAH BARANG */}
<div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
  <h3 className="text-xl font-bold">
  {barangEditId ? 'Edit Barang' : 'Tambah Barang'}
</h3>
  <p className="mt-1 text-sm text-slate-500">
  {barangEditId
    ? 'Ubah informasi barang yang dipilih.'
    : 'Tambahkan produk baru ke katalog warung.'}
</p>

  <form
  onSubmit={barangEditId ? simpanEditBarang : tambahBarang}
  className="mt-5 space-y-4"
>
    <div className="grid gap-4 sm:grid-cols-2">
      <div>
        <label className="mb-2 block font-medium">Nama Barang</label>
        <input
          value={formBarang.nama}
          onChange={(e) =>
            setFormBarang({ ...formBarang, nama: e.target.value })
          }
          required
          className="w-full rounded-xl border border-slate-300 px-4 py-3"
          placeholder="Contoh: Gula Pasir"
        />
      </div>

      <div>
        <label className="mb-2 block font-medium">Kategori</label>
        <input
          value={formBarang.kategori}
          onChange={(e) =>
            setFormBarang({ ...formBarang, kategori: e.target.value })
          }
          required
          className="w-full rounded-xl border border-slate-300 px-4 py-3"
          placeholder="Contoh: Sembako"
        />
      </div>

      <div>
        <label className="mb-2 block font-medium">Harga (Rp)</label>
        <input
          type="number"
          min="1"
          step="1"
          value={formBarang.harga}
          onChange={(e) =>
            setFormBarang({ ...formBarang, harga: e.target.value })
          }
          required
          className="w-full rounded-xl border border-slate-300 px-4 py-3"
          placeholder="Contoh: 15000"
        />
      </div>

      <div>
        <label className="mb-2 block font-medium">Stok</label>
        <input
          type="number"
          min="0"
          step="1"
          value={formBarang.stok}
          onChange={(e) =>
            setFormBarang({ ...formBarang, stok: e.target.value })
          }
          required
          className="w-full rounded-xl border border-slate-300 px-4 py-3"
          placeholder="Contoh: 20"
        />
      </div>

      <div>
        <label className="mb-2 block font-medium">Satuan</label>
        <select
          value={formBarang.satuan}
          onChange={(e) =>
            setFormBarang({ ...formBarang, satuan: e.target.value })
          }
          required
          className="w-full rounded-xl border border-slate-300 px-4 py-3"
        >
          <option value="pcs">pcs</option>
          <option value="kg">kg</option>
          <option value="liter">liter</option>
          <option value="bungkus">bungkus</option>
          <option value="pack">pack</option>
          <option value="botol">botol</option>
        </select>
      </div>

      <div>
        <label className="mb-2 block font-medium">URL Foto (opsional)</label>
        <input
          type="url"
          value={formBarang.foto}
          onChange={(e) =>
            setFormBarang({ ...formBarang, foto: e.target.value })
          }
          className="w-full rounded-xl border border-slate-300 px-4 py-3"
          placeholder="https://..."
        />
      </div>
    </div>

    <div>
      <label className="mb-2 block font-medium">Deskripsi (opsional)</label>
      <textarea
        value={formBarang.deskripsi}
        onChange={(e) =>
          setFormBarang({ ...formBarang, deskripsi: e.target.value })
        }
        rows={3}
        className="w-full rounded-xl border border-slate-300 px-4 py-3"
        placeholder="Keterangan barang..."
      />
    </div>

    {tambahBarangError && (
      <p role="alert" className="rounded-xl bg-red-50 p-3 text-red-700">
        {tambahBarangError}
      </p>
    )}

    {tambahBarangPesan && (
      <p role="status" className="rounded-xl bg-emerald-50 p-3 text-emerald-700">
        {tambahBarangPesan}
      </p>
    )}

    <div className="flex flex-wrap gap-3">
  <button
    type="submit"
    disabled={tambahBarangLoading}
    className="rounded-xl bg-emerald-700 px-5 py-3 font-semibold text-white hover:bg-emerald-800 disabled:opacity-50"
  >
    {tambahBarangLoading
      ? 'Menyimpan...'
      : barangEditId
        ? 'Simpan Perubahan'
        : 'Tambah Barang'}
  </button>

  {barangEditId && (
    <button
      type="button"
      onClick={() => {
        setBarangEditId(null);
        setFormBarang({
          nama: '',
          kategori: '',
          harga: '',
          stok: '',
          satuan: 'pcs',
          foto: '',
          deskripsi: '',
        });
        setTambahBarangError('');
        setTambahBarangPesan('');
      }}
      className="rounded-xl border border-slate-300 px-5 py-3 font-semibold text-slate-700 hover:bg-slate-100"
    >
      Batal Edit
    </button>
  )}
</div>
  </form>
</div>


        {/* DAFTAR PESANAN */}
        <div className="mt-6 space-y-4">
          {adminPesanan.length === 0 && !adminLoading ? (
            <div className="rounded-2xl bg-white p-8 text-center text-slate-500">
              Belum ada pesanan.
            </div>
          ) : (
            adminPesanan.map((pesanan) => (
              <article
                key={pesanan.id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                {/* INFORMASI PESANAN */}
                <div className="flex flex-col justify-between gap-3 sm:flex-row">
                  <div>
                    <p className="break-all font-bold text-emerald-700">
                      {pesanan.kode_pesanan}
                    </p>

                    <p className="mt-1 text-sm text-slate-500">
                      {pesanan.metode_pembayaran} ·{' '}
                      {new Date(
                        pesanan.dibuat_pada
                      ).toLocaleString('id-ID')}
                    </p>
                  </div>

                  <span className="h-fit rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold">
                    {labelStatus(pesanan.status)}
                  </span>
                </div>

                {/* RINCIAN BARANG */}
                <div className="mt-4 border-t border-slate-100 pt-4">
                  <p className="text-sm text-slate-500">Barang</p>

                  <ul className="mt-2 space-y-1">
                    {(pesanan.items || []).map((item, index) => (
                      <li
                        key={`${item.barang_id}-${index}`}
                        className="flex justify-between gap-3 text-sm"
                      >
                        <span>
                          {item.nama_barang} × {item.jumlah}
                        </span>

                        <span className="shrink-0">
                          {formatRupiah(item.subtotal)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* TOTAL DAN TOMBOL AKSI */}
                <div className="mt-4 flex flex-col justify-between gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center">
                  <div>
                    <p className="text-sm text-slate-500">Total</p>
                    <p className="text-xl font-bold">
                      {formatRupiah(pesanan.total)}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {/* KONFIRMASI COD */}
                    {pesanan.status === 'menunggu_konfirmasi' &&
                      pesanan.metode_pembayaran === 'COD' && (
                        <button
                          onClick={async () => {
                            const yakin = window.confirm(
                              'Pastikan uang tunai sudah benar-benar diterima. Konfirmasi pesanan ini?'
                            );

                            if (!yakin) return;

                            setAdminLoading(true);
                            setAdminError('');

                            try {
                              const response = await fetch(
                                `${API_PESANAN}/${encodeURIComponent(
                                  pesanan.kode_pesanan
                                )}/konfirmasi-cod`,
                                {
                                  method: 'POST',
                                  headers: {
                                    Authorization: `Bearer ${adminToken}`,
                                  },
                                }
                              );

                              const data = await response.json();

                              if (!response.ok) {
                                throw new Error(
                                  data.message ||
                                    'Konfirmasi COD gagal.'
                                );
                              }

                              await ambilPesananAdmin();
                              tampilkanPesan(
                                'Pesanan COD berhasil dikonfirmasi.'
                              );
                            } catch (err) {
                              setAdminError(
                                err.message || 'Konfirmasi COD gagal.'
                              );
                            } finally {
                              setAdminLoading(false);
                            }
                          }}
                          disabled={adminLoading}
                          className="rounded-xl bg-emerald-700 px-4 py-3 font-semibold text-white hover:bg-emerald-800 disabled:opacity-50"
                        >
                          Uang Diterima · Proses Pesanan
                        </button>
                      )}

                    {/* SELESAIKAN PESANAN */}
                    {pesanan.status === 'diproses' && (
                      <button
                        onClick={() =>
                          ubahStatusPesanan(pesanan, 'selesai')
                        }
                        disabled={adminLoading}
                        className="rounded-xl bg-blue-700 px-4 py-3 font-semibold text-white hover:bg-blue-800 disabled:opacity-50"
                      >
                        Selesaikan Pesanan
                      </button>
                    )}

                    {/* BATALKAN PESANAN */}
                    {[
                      'menunggu_pembayaran',
                      'menunggu_konfirmasi',
                    ].includes(pesanan.status) && (
                      <button
                        onClick={() =>
                          ubahStatusPesanan(pesanan, 'dibatalkan')
                        }
                        disabled={adminLoading}
                        className="rounded-xl border border-red-300 px-4 py-3 font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
                      >
                        Batalkan Pesanan
                      </button>
                    )}
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      </>
    )}
  </section>
)}


        {/* ================= KATALOG ================= */}
        {halaman === 'katalog' && (
          <>
            <section className="mb-8 rounded-3xl bg-emerald-50 px-6 py-8 sm:px-10 sm:py-12">
              <p className="mb-2 font-semibold text-emerald-700">
                Kebutuhan sehari-hari, lebih mudah dicari
              </p>
              <h2 className="max-w-2xl text-3xl font-bold leading-tight sm:text-4xl">
                Cari sembako sebelum datang
              </h2>
              <p className="mt-3 max-w-2xl text-slate-600">
                Lihat harga dan ketersediaan barang di Warung Sembako Nenek
                Yoyoh.
              </p>
              <button
                onClick={() =>
                  document.getElementById('daftar-barang')?.scrollIntoView({
                    behavior: 'smooth',
                  })
                }
                className="mt-6 rounded-xl bg-emerald-700 px-5 py-3 font-semibold text-white transition hover:bg-emerald-800"
              >
                Lihat Barang
              </button>
            </section>

            <section id="daftar-barang">
              <div className="mb-5">
                <label
                  htmlFor="cari-barang"
                  className="mb-2 block font-medium"
                >
                  Cari nama atau kategori barang
                </label>
                <input
                  id="cari-barang"
                  type="search"
                  value={pencarian}
                  onChange={(event) => setPencarian(event.target.value)}
                  placeholder="Contoh: beras, minyak, gula..."
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                />
              </div>

              <div className="mb-6 flex flex-wrap gap-2">
                {daftarKategori.map((kategori) => (
                  <button
                    key={kategori}
                    onClick={() => setKategoriAktif(kategori)}
                    className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                      kategoriAktif === kategori
                        ? 'bg-emerald-700 text-white'
                        : 'border border-slate-200 bg-white text-slate-600 hover:border-emerald-500 hover:text-emerald-700'
                    }`}
                  >
                    {kategori}
                  </button>
                ))}
              </div>

              <div className="mb-5 flex items-center justify-between gap-3">
                <h3 className="text-xl font-bold">Daftar Barang</h3>
                <span className="text-sm text-slate-500">
                  {hasilPencarian.length} barang
                </span>
              </div>

              {loading ? (
                <p className="py-10 text-center text-slate-500">
                  Memuat data barang...
                </p>
              ) : error ? (
                <div className="rounded-xl bg-red-50 p-5 text-red-700">
                  <p>{error}</p>
                  <button
                    onClick={ambilBarang}
                    className="mt-3 font-semibold underline"
                  >
                    Coba lagi
                  </button>
                </div>
              ) : hasilPencarian.length === 0 ? (
                <p className="rounded-xl bg-white p-8 text-center text-slate-500 shadow-sm">
                  Barang tidak ditemukan.
                </p>
              ) : (
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {hasilPencarian.map((item) => (
                    <article
                      key={item.id}
                      className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                    >
                      <button
                        onClick={() => setBarangDipilih(item)}
                        className="flex h-40 items-center justify-center overflow-hidden bg-emerald-50 text-6xl"
                        aria-label={`Lihat detail ${item.nama}`}
                      >
                        {item.foto ? (
                          <img
                            src={item.foto}
                            alt={item.nama}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span aria-hidden="true">🛒</span>
                        )}
                      </button>

                      <div className="flex flex-1 flex-col p-5">
                        <div>
                          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                            {item.kategori}
                          </span>
                          <button
                            onClick={() => setBarangDipilih(item)}
                            className="mt-3 block text-left text-lg font-bold hover:text-emerald-700"
                          >
                            {item.nama}
                          </button>
                          <p className="mt-2 text-xl font-bold text-emerald-700">
                            {formatRupiah(item.harga)}
                            <span className="ml-1 text-sm font-normal text-slate-500">
                              / {item.satuan}
                            </span>
                          </p>
                          <p
                            className={`mt-3 text-sm ${
                              Number(item.stok) > 0
                                ? 'text-emerald-700'
                                : 'text-red-600'
                            }`}
                          >
                            {Number(item.stok) > 0
                              ? `Stok tersedia: ${item.stok} ${item.satuan}`
                              : 'Stok habis'}
                          </p>
                        </div>

                        <div className="mt-5 grid grid-cols-2 gap-2">
                          <button
                            onClick={() => setBarangDipilih(item)}
                            className="rounded-xl border border-emerald-700 px-3 py-2.5 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50"
                          >
                            Detail
                          </button>
                          <button
                            onClick={() => tambahKeKeranjang(item)}
                            disabled={Number(item.stok) <= 0}
                            className="rounded-xl bg-emerald-700 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-300"
                          >
                            + Keranjang
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </>
        )}

        {/* ================= KERANJANG ================= */}
        {halaman === 'keranjang' && (
          <section>
            <button
              onClick={bukaKatalog}
              className="mb-6 font-semibold text-emerald-700 hover:text-emerald-900"
            >
              ← Kembali ke katalog
            </button>

            <h2 className="text-3xl font-bold">Keranjang Belanja</h2>
            <p className="mt-2 text-slate-500">
              Periksa barang dan jumlah belanjaanmu.
            </p>

            {keranjang.length === 0 ? (
              <div className="mt-8 rounded-2xl bg-white p-10 text-center shadow-sm">
                <div className="text-5xl" aria-hidden="true">
                  🛒
                </div>
                <h3 className="mt-4 text-xl font-bold">
                  Keranjang masih kosong
                </h3>
                <p className="mt-2 text-slate-500">
                  Yuk, pilih barang yang kamu butuhkan.
                </p>
                <button
                  onClick={bukaKatalog}
                  className="mt-5 rounded-xl bg-emerald-700 px-5 py-3 font-semibold text-white hover:bg-emerald-800"
                >
                  Mulai Belanja
                </button>
              </div>
            ) : (
              <div className="mt-7 grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
                <div className="space-y-4 lg:col-span-2">
                  {keranjang.map((item) => (
                    <article
                      key={item.id}
                      className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center"
                    >
                      <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-emerald-50 text-3xl">
                        {item.foto ? (
                          <img
                            src={item.foto}
                            alt={item.nama}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          '🛒'
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-emerald-700">
                          {item.kategori}
                        </p>
                        <h3 className="mt-1 font-bold">{item.nama}</h3>
                        <p className="mt-1 text-sm text-slate-500">
                          {formatRupiah(item.harga)} / {item.satuan}
                        </p>
                        <p className="mt-2 font-semibold text-emerald-700">
                          {formatRupiah(item.harga * item.jumlah)}
                        </p>
                      </div>

                      <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() =>
                              item.jumlah === 1
                                ? hapusDariKeranjang(item.id)
                                : ubahJumlah(item.id, item.jumlah - 1)
                            }
                            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 font-bold hover:bg-slate-50"
                            aria-label={`Kurangi ${item.nama}`}
                          >
                            −
                          </button>
                          <span className="min-w-5 text-center font-semibold">
                            {item.jumlah}
                          </span>
                          <button
                            onClick={() =>
                              ubahJumlah(item.id, item.jumlah + 1)
                            }
                            disabled={item.jumlah >= item.stok}
                            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 font-bold hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                            aria-label={`Tambah ${item.nama}`}
                          >
                            +
                          </button>
                        </div>

                        <button
                          onClick={() => hapusDariKeranjang(item.id)}
                          className="text-sm font-medium text-red-600 hover:text-red-800"
                        >
                          Hapus
                        </button>
                      </div>
                    </article>
                  ))}
                </div>

                <aside className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:sticky lg:top-28">
                  <h3 className="text-lg font-bold">Ringkasan Belanja</h3>
                  <div className="mt-5 flex justify-between gap-3 text-sm text-slate-600">
                    <span>Jumlah barang</span>
                    <span>{jumlahBarang} item</span>
                  </div>
                  <div className="mt-3 flex justify-between gap-3 text-sm text-slate-600">
                    <span>Subtotal</span>
                    <span>{formatRupiah(totalBelanja)}</span>
                  </div>
                  <div className="my-5 border-t border-slate-200" />
                  <div className="flex items-start justify-between gap-3">
                    <span className="font-semibold">Total</span>
                    <span className="text-right text-xl font-bold text-emerald-700">
                      {formatRupiah(totalBelanja)}
                    </span>
                  </div>
                  <p className="mt-4 text-xs leading-relaxed text-slate-500">
                    Harga dan ketersediaan stok akan diperiksa kembali saat
                    pesanan dibuat.
                  </p>
                  <button
                    onClick={() => setHalaman('checkout')}
                    className="mt-6 w-full rounded-xl bg-emerald-700 px-4 py-3 font-semibold text-white transition hover:bg-emerald-800"
                  >
                    Lanjutkan Checkout
                  </button>
                  <button
                    onClick={bukaKatalog}
                    className="mt-3 w-full rounded-xl border border-slate-300 px-4 py-3 font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    Tambah Barang
                  </button>
                </aside>
              </div>
            )}
          </section>
        )}

        {/* ================= CHECKOUT ================= */}
        {halaman === 'checkout' && (
          <section className="mx-auto max-w-3xl">
            <button
              onClick={bukaKeranjang}
              className="mb-6 font-semibold text-emerald-700 hover:text-emerald-900"
            >
              ← Kembali ke keranjang
            </button>

            <h2 className="text-3xl font-bold">Checkout</h2>
            <p className="mt-2 text-slate-500">
              Pilih metode pembayaran untuk membuat pesanan.
            </p>

            {keranjang.length === 0 ? (
              <div className="mt-6 rounded-2xl bg-white p-8 text-center shadow-sm">
                <p>Keranjang kosong. Tambahkan barang sebelum checkout.</p>
                <button
                  onClick={bukaKatalog}
                  className="mt-4 rounded-xl bg-emerald-700 px-5 py-3 font-semibold text-white"
                >
                  Kembali ke katalog
                </button>
              </div>
            ) : (
              <div className="mt-7 grid gap-6 md:grid-cols-5">
                <div className="space-y-4 md:col-span-3">
                  <div className="rounded-2xl border border-slate-200 bg-white p-5">
                    <h3 className="text-lg font-bold">Metode Pembayaran</h3>

                    <label className="mt-4 flex cursor-pointer gap-3 rounded-xl border border-slate-200 p-4 transition hover:border-emerald-500">
                      <input
                        type="radio"
                        name="metode"
                        value="QRIS"
                        checked={metodePembayaran === 'QRIS'}
                        onChange={() => setMetodePembayaran('QRIS')}
                        className="mt-1 accent-emerald-700"
                      />
                      <span>
                        <span className="block font-semibold">QRIS</span>
                        <span className="mt-1 block text-sm text-slate-500">
                          Pembayaran perlu dikonfirmasi setelah benar-benar
                          diterima.
                        </span>
                      </span>
                    </label>

                    <label className="mt-3 flex cursor-pointer gap-3 rounded-xl border border-slate-200 p-4 transition hover:border-emerald-500">
                      <input
                        type="radio"
                        name="metode"
                        value="COD"
                        checked={metodePembayaran === 'COD'}
                        onChange={() => setMetodePembayaran('COD')}
                        className="mt-1 accent-emerald-700"
                      />
                      <span>
                        <span className="block font-semibold">
                          COD / Tunai di Warung
                        </span>
                        <span className="mt-1 block text-sm text-slate-500">
                          Pembayaran tunai harus dikonfirmasi oleh penjaga
                          warung.
                        </span>
                      </span>
                    </label>

                    <div className="mt-5 rounded-xl bg-amber-50 p-4 text-sm leading-relaxed text-amber-900">
                      <p className="font-semibold">Batas waktu: 5 menit</p>
                      <p className="mt-1">
                        Waktu dimulai setelah pesanan berhasil dibuat. Jika
                        pembayaran atau konfirmasi tidak selesai tepat waktu,
                        pesanan akan dibatalkan dan stok dikembalikan.
                      </p>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-5">
                    <h3 className="text-lg font-bold">Barang yang Dipesan</h3>
                    <div className="mt-4 space-y-3">
                      {keranjang.map((item) => (
                        <div
                          key={item.id}
                          className="flex justify-between gap-4 text-sm"
                        >
                          <span>
                            {item.nama} × {item.jumlah}
                          </span>
                          <span className="shrink-0 font-semibold">
                            {formatRupiah(item.harga * item.jumlah)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-5 md:col-span-2">
                  <h3 className="text-lg font-bold">Ringkasan</h3>
                  <div className="mt-4 flex justify-between gap-3 text-sm">
                    <span className="text-slate-500">Jumlah barang</span>
                    <span>{jumlahBarang} item</span>
                  </div>
                  <div className="mt-3 flex justify-between gap-3">
                    <span className="font-semibold">Total</span>
                    <span className="text-right text-xl font-bold text-emerald-700">
                      {formatRupiah(totalBelanja)}
                    </span>
                  </div>
                  <button
                    onClick={buatPesanan}
                    disabled={checkoutLoading || keranjang.length === 0}
                    className="mt-6 w-full rounded-xl bg-emerald-700 px-4 py-3 font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {checkoutLoading ? 'Membuat Pesanan...' : 'Buat Pesanan'}
                  </button>
                  <p className="mt-3 text-xs leading-relaxed text-slate-500">
                    Pesanan akan divalidasi berdasarkan harga dan stok di
                    database.
                  </p>
                </aside>
              </div>
            )}
          </section>
        )}

        {/* ================= STATUS PESANAN ================= */}
        {halaman === 'pesanan' && pesananAktif && (
          <section className="mx-auto max-w-2xl">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-9">
              <div className="text-center">
                <div className="text-5xl" aria-hidden="true">
                  {pesananAktif.status === 'dibatalkan' ? '❌' : '🧾'}
                </div>
                <h2 className="mt-4 text-2xl font-bold">
                  Detail Pesanan
                </h2>
                <p className="mt-2 text-slate-500">
                  Simpan kode pesanan ini untuk memeriksa statusnya.
                </p>

                <div className="mt-5 rounded-xl bg-emerald-50 p-4">
                  <p className="text-sm text-emerald-800">Kode Pesanan</p>
                  <p className="mt-1 break-all text-lg font-bold text-emerald-900">
                    {pesananAktif.kode_pesanan}
                  </p>
                  <button
                    onClick={() => {
                      navigator.clipboard?.writeText(
                        pesananAktif.kode_pesanan
                      );
                      tampilkanPesan('Kode pesanan disalin.');
                    }}
                    className="mt-2 text-sm font-semibold text-emerald-800 underline"
                  >
                    Salin kode pesanan
                  </button>
                </div>

                <div className="mt-5 rounded-xl border border-slate-200 p-4">
                  <p className="text-sm text-slate-500">Status Pesanan</p>
                  <p className="mt-1 text-lg font-bold text-emerald-700">
                    {labelStatus(pesananAktif.status)}
                  </p>
                  <p className="mt-3 text-sm text-slate-500">
                    Metode: {pesananAktif.metode_pembayaran}
                  </p>
                  <p className="mt-1 text-2xl font-bold">
                    {formatRupiah(pesananAktif.total)}
                  </p>
                </div>
              </div>

              {statusMenunggu && (
                <div className="mt-6 rounded-2xl bg-amber-50 p-5 text-center">
                  <p className="font-semibold text-amber-900">
                    {detikTersisa > 0
                      ? 'Selesaikan pembayaran sebelum waktu habis'
                      : 'Waktu habis, menunggu konfirmasi pembatalan dari server'}
                  </p>
                  <p className="my-3 text-4xl font-bold tabular-nums text-amber-900">
                    {formatWaktu(detikTersisa)}
                  </p>
                  <p className="text-sm leading-relaxed text-amber-900">
                    {pesananAktif.metode_pembayaran === 'QRIS'
                      ? 'Gunakan QRIS resmi yang disediakan warung. Pembayaran belum otomatis terverifikasi oleh aplikasi ini.'
                      : 'Hubungi atau temui penjaga warung untuk melakukan pembayaran tunai dan meminta konfirmasi.'}
                  </p>
                </div>
              )}

              {pesananAktif.status === 'dibatalkan' && (
                <div className="mt-6 rounded-xl bg-red-50 p-4 text-sm leading-relaxed text-red-800">
                  Pesanan telah dibatalkan. Stok yang sebelumnya dicadangkan
                  akan dikembalikan oleh backend.
                </div>
              )}

              {['dibayar', 'diproses', 'selesai'].includes(
                pesananAktif.status
              ) && (
                <div className="mt-6 rounded-xl bg-emerald-50 p-4 text-sm leading-relaxed text-emerald-800">
                  Status pesanan sudah diperbarui oleh backend.
                </div>
              )}

              <div className="mt-6 rounded-xl border border-slate-200 p-4">
                <h3 className="font-bold">Rincian Barang</h3>
                <div className="mt-3 space-y-3">
                  {(pesananAktif.items || []).map((item, index) => (
                    <div
                      key={`${item.barang_id}-${index}`}
                      className="flex justify-between gap-3 text-sm"
                    >
                      <span>
                        {item.nama_barang || item.nama} × {item.jumlah}
                      </span>
                      <span className="shrink-0 font-semibold">
                        {formatRupiah(
                          item.subtotal ??
                            Number(item.harga) * Number(item.jumlah)
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={perbaruiStatusPesanan}
                disabled={memuatStatus}
                className="mt-6 w-full rounded-xl border border-emerald-700 px-4 py-3 font-semibold text-emerald-700 transition hover:bg-emerald-50 disabled:opacity-50"
              >
                {memuatStatus ? 'Memeriksa Status...' : 'Perbarui Status'}
              </button>

              <button
                onClick={async () => {
                  await ambilBarang();
                  bukaKatalog();
                }}
                className="mt-3 w-full rounded-xl bg-emerald-700 px-4 py-3 font-semibold text-white transition hover:bg-emerald-800"
              >
                Kembali ke Katalog
              </button>
            </div>
          </section>
        )}
      </main>

      <footer className="mt-12 border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-6 text-center text-sm text-slate-500 sm:px-6">
          © {new Date().getFullYear()} Warung Sembako Nenek Yoyoh
        </div>
      </footer>

      {/* ================= DETAIL BARANG ================= */}
      {barangDipilih && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/50 p-4"
          onClick={() => setBarangDipilih(null)}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="judul-detail"
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="relative flex h-56 items-center justify-center overflow-hidden bg-emerald-50 text-7xl">
              {barangDipilih.foto ? (
                <img
                  src={barangDipilih.foto}
                  alt={barangDipilih.nama}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span aria-hidden="true">🛒</span>
              )}

              <button
                onClick={() => setBarangDipilih(null)}
                aria-label="Tutup detail"
                className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-white text-xl shadow hover:bg-slate-100"
              >
                ×
              </button>
            </div>

            <div className="p-6">
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                {barangDipilih.kategori}
              </span>

              <h2 id="judul-detail" className="mt-4 text-2xl font-bold">
                {barangDipilih.nama}
              </h2>

              <p className="mt-3 text-2xl font-bold text-emerald-700">
                {formatRupiah(barangDipilih.harga)}
                <span className="ml-1 text-sm font-normal text-slate-500">
                  / {barangDipilih.satuan}
                </span>
              </p>

              <div className="mt-5 rounded-xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Ketersediaan</p>
                <p
                  className={`mt-1 font-semibold ${
                    Number(barangDipilih.stok) > 0
                      ? 'text-emerald-700'
                      : 'text-red-600'
                  }`}
                >
                  {Number(barangDipilih.stok) > 0
                    ? `${barangDipilih.stok} ${barangDipilih.satuan} tersedia`
                    : 'Stok habis'}
                </p>
              </div>

              {barangDipilih.deskripsi && (
                <div className="mt-5">
                  <h3 className="font-semibold">Deskripsi</h3>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-600">
                    {barangDipilih.deskripsi}
                  </p>
                </div>
              )}

              <button
                onClick={() => tambahKeKeranjang(barangDipilih)}
                disabled={Number(barangDipilih.stok) <= 0}
                className="mt-6 w-full rounded-xl bg-emerald-700 px-4 py-3 font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                + Tambahkan ke Keranjang
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

export default App;