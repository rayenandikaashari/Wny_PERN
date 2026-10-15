# Warung Nenek Yoyoh



Aplikasi web Warung Nenek Yoyoh menggunakan React untuk frontend, Express.js untuk backend, dan PostgreSQL sebagai database.



## Teknologi



\- \*\*Frontend:\*\* React, Vite, Tailwind CSS

\- \*\*Backend:\*\* Node.js, Express.js

\- \*\*Database:\*\* PostgreSQL

\- \*\*Database driver:\*\* node-postgres (`pg`)

\- \*\*Migration:\*\* node-pg-migrate



## Persyaratan



Pastikan perangkat sudah memiliki:



\- Node.js dan npm

\- PostgreSQL

\- Git



## Struktur Proyek



```text

Warung Nenek Yoyoh/

├── backend/

│   ├── migrations/

│   ├── seeds/

│   ├── index.js

│   ├── migrate.config.mjs

│   ├── package.json

│   └── database\_schema.sql

├── frontend/

│   ├── src/

│   ├── public/

│   └── package.json

└── README.md

```



## Instalasi



Clone repository sesuai URL repository tim, lalu masuk ke folder proyek.



### 1. Instalasi Backend



```bash

cd backend

npm install

```



Buat file `.env` berdasarkan konfigurasi database lokal. Jangan membagikan file ini karena dapat berisi password.



Contoh format `.env`:



```env

DB\_HOST=localhost

DB\_PORT=5432

DB\_NAME=warung\_nenek\_yoyoh

DB\_USER=app\_wny

DB\_PASSWORD=isi\_password\_database

```



Sesuaikan nilainya dengan PostgreSQL masing-masing.



### 2. Siapkan Database



Buat database PostgreSQL kosong dengan nama yang sesuai dengan `DB\_NAME` pada `.env`.



Pastikan pengguna database mempunyai izin untuk membuat tabel dan menjalankan migration.



### 3. Jalankan Migration



Dari folder `backend`, jalankan:



```bash

npm run migrate:up

```



Migration membuat tabel dan indeks yang diperlukan oleh aplikasi.



Jalankan perintah ini pada database baru yang masih kosong. Untuk database yang sudah memiliki tabel dan data, periksa status migration terlebih dahulu agar tidak terjadi konflik.



### 4. Isi Data Awal



Untuk memasukkan data contoh:



```bash

npm run db:seed

```



Seeder saat ini menambahkan tiga barang contoh hanya jika tabel `barang` masih kosong. Seeder tidak menghapus data yang sudah ada.



### 5. Jalankan Backend



Dari folder `backend`:



```bash

npm run dev

```



Backend berjalan sesuai konfigurasi server di `index.js`.



### 6. Instalasi dan Jalankan Frontend



Buka terminal baru dari folder utama proyek:



```bash

cd frontend

npm install

npm run dev

```



Buka alamat lokal yang ditampilkan oleh Vite pada terminal.



## Perintah Penting



| Perintah | Fungsi |

|---|---|

| `npm run dev` | Menjalankan server development |

| `npm start` | Menjalankan backend |

| `npm run migrate:up` | Menjalankan migration yang belum diterapkan |

| `npm run migrate:down` | Membatalkan migration terakhir |

| `npm run db:seed` | Memasukkan data contoh |

| `npm run build` | Membuat build frontend |

| `npm run lint` | Memeriksa kode frontend |



Perintah backend dijalankan dari folder `backend`, sedangkan perintah frontend dijalankan dari folder `frontend`.



\*\*Perhatian:\*\* Jangan menjalankan `migrate:down` pada database utama tanpa memahami dampaknya. Perintah tersebut dapat menghapus tabel yang dibuat oleh migration.



## Catatan Keamanan



\- Jangan commit file `.env` ke repository.

\- Jangan membagikan password database.

\- Jangan commit `node\_modules`.

\- File backup database dapat berisi data sensitif. Bagikan hanya jika diperlukan dan diizinkan.

\- Gunakan database pengujian untuk menguji migration sebelum menerapkannya pada database yang berisi data penting.

