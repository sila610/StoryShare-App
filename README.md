# Proyek Starter Aplikasi dengan Webpack

Proyek ini menyediakan **setup dasar** untuk aplikasi web yang menggunakan **Webpack** untuk proses bundling  untuk mentranspilasi JavaScript, dan mendukung proses build serta serving aplikasi.

## Daftar Isi

- [Langkah Awal](#langkah-awal)
- [Skrip](#skrip)
- [Struktur Proyek](#struktur-proyek)

## Langkah Awal

### Prasyarat

- [Node.js](https://nodejs.org/) (disarankan versi 12 atau lebih tinggi)
- [npm](https://www.npmjs.com/) (Node package manager)

### Instalasi

1. Clone atau download proyek ini dari repository: [https://github.com/sila610/StoryShareApp](https://github.com/sila610/StoryShareApp).
2. Di terminal atau command prompt, navigasikan ke folder proyek.
3. Pasang seluruh **dependencies** yang dibutuhkan dengan menjalankan perintah berikut:
   ```shell
   npm install

## Skrip

### Build untuk Produksi:

- Untuk membangun aplikasi untuk lingkungan produksi, gunakan perintah berikut:

```shell
npm run build

- Untuk menjalankan aplikasi dalam mode pengembangan dengan live reload, gunakan perintah berikut:

```shell
npm start
```

## Project Structure

CeritaApp/
├── dist/                   # Folder hasil build untuk produksi
├── public/                 # Berisi file publik seperti gambar dan favicon
│   ├── assets/             # Folder gambar dan ikon
│   ├── screenshots/        # Screenshots aplikasi (opsional)
│   |── index.html          # Template HTML yang digunakan oleh HtmlWebpackPlugin
|   |── index.js            # Entry point untuk aplikasi
│   |── sw-dev.js           # Service Worker untuk PWA
|   |__ offline.html        # Halaman offline
|   |__ app.webmanifest     # Manifest untuk PWA
├── src/                    # Kode sumber aplikasi
│   ├── api/                # API untuk komunikasi dengan server
│   ├── auth/               # Modul autentikasi (login, register)
│   ├── model/              # Model dan logika aplikasi (misal storyModel.js)
│   ├── presenter/          # Presenter yang memisahkan logika tampilan dan data
│   ├── utils/              # Utility functions (misal map.js, database.js)
│   ├── routes/             # Komponen utama aplikasi
│   ├── views/              # Views untuk merender tampilan
│   ├── styles/             # File CSS untuk styling aplikasi
│   └── app.js              # Entry point untuk aplikasi
|   ├── config.js           # Service Worker untuk PWA
├── package.json            # Dependensi proyek
├── package-lock.json       # Lock file untuk manajemen dependensi
├── gitignore               # File untuk mengabaikan file/folder tertentu dari Git
├── STUDENT.TEXT            # File untuk mengabaikan file/folder tertentu dari Git            
├── webpack.Config.js       # Konfigurasi Webpack umum
├── sw.js                   # Konfigurasi Webpack untuk development
├── sw-workbox.js           # Konfigurasi Webpack untuk produksi
└── README.md               # Dokumentasi proyek
