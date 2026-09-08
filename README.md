# Digital Product Store - Frontend Implementation Guide

## 📦 Project Structure

```
/frontend
├── index.html          # Landing page
├── product.html        # Product detail page
├── checkout.html       # Checkout page
├── redeem.html         # Redeem code page
├── testimonial.html    # Submit testimonial page
├── admin.html          # Admin dashboard
├── css/style.css       # Main stylesheet
├── js/app.js           # Customer-side logic
├── js/admin.js         # Admin dashboard logic
└── README.md           # Implementation guide
```

## 🔧 Setup Instructions

### 1. Backend Setup (GAS)

1. **Buat Google Apps Script Project:**
   - Buka **script.google.com** → **New Project**.
   - Ganti nama project menjadi: **Digital Product Store Backend**.
   - Hapus semua kode default, lalu paste seluruh isi dari `gas-backend/Code.gs`.

2. **Sesuaikan Kredensial:**
   - Ubah `ADMIN_EMAIL` dan `ADMIN_PASSWORD` di bagian `CONFIG` pada `Code.gs`.

3. **Jalankan Auto-Setup:**
   - Pilih fungsi `setup` pada menu dropdown di atas editor.
   - Klik **Run** dan setujui permintaan perizinan (Permissions).
   - Spreadsheet dan Folder Google Drive akan otomatis terbuat di akun Google Anda tanpa perlu konfigurasi ID manual.

4. **Deploy sebagai Web App:**
   - Klik **Deploy** → **New Deployment**.
   - Pilih jenis **Web app**.
   - Set **Execute as**: `Me`.
   - Set **Who has access**: `Anyone`.
   - Klik **Deploy**, lalu copy **Web App URL** yang berakhiran `/exec`.

### 2. Frontend Setup (Local Computer)

1. **Persiapkan Folder Frontend:**
   - Pastikan semua file frontend ada di folder `frontend/` (HTML, CSS, JS, dll.)

2. **Install Git (jika belum terinstal):**
   ```bash
   # Windows (dengan Git for Windows)
   # Linux/macOS
   $ sudo apt install git
   ```

3. **Buat Folder Lokal & Inisialisasi Repo:**
   ```bash
   # Pindah ke parent folder
   $ cd /path/to/your/folder
   
   # Buat folder frontend (jika belum)
   $ mkdir landing-page
   $ cd landing-page
   
   # Copy semua file frontend ke dalam folder frontend
   # (atau gunakan drag-and-drop di explorer)
   $ cd frontend
   
   # Inisialisasi git repository
   $ git init
   ```

4. **Buat File .gitignore:**
   ```bash
   # Tambahkan file berikut
   node_modules/
   .env
   .DS_Store
   dist/
   build/
   *.log
   ```
   ```bash
   $ git add .gitignore
   $ git commit -m "Add .gitignore"
   ```

5. **Buat Repositori GitHub:**
   - Buka github.com → **New repository**
   - Isi:
     - **Repository name**: misal `digital-store-frontend`
     - **Description**: Front-end untuk Digital Product Store
     - **Visibility**: Public (atau Private)
   - **Do not initialize this repository with README** (karena sudah ada)
   - Klik **Create repository**

6. **Hubungkan Local Repo ke Remote GitHub:**
   ```bash
   # Tambahkan remote URL
   $ git remote add origin https://github.com/[USERNAME]/[REPOSITORY_NAME].git
   
   # Verifikasi remote
   $ git remote -v
   origin  https://github.com/[USERNAME]/[REPOSITORY_NAME].git (fetch)
   origin  https://github.com/[USERNAME]/[REPOSITORY_NAME].git (push)
   ```

7. **Configure Git User (optional):**
   ```bash
   $ git config user.name "Your Full Name"
   $ git config user.email "your.email@domain.com"
   
   # Verifikasi
   $ git config --list | grep user
   ```

8. **Upload Pertama (Push Initial Commit):**
   ```bash
   # Tambahkan semua file
   $ git add .
   
   # Commit dengan pesan
   $ git commit -m "Initial commit: Frontend Digital Product Store
   
   - Landing page dengan katalog produk
   - Halaman detail produk dan checkout
   - Halaman redeem kode produk
   - Dashboard admin untuk manajemen
   - Gaya elegan, modern, responsif"
   
   # Push ke GitHub
   $ git push origin main
   ```

9. **Lengkapi Alur HTTPS (opsional - untuk autentikasi token):**
   ```bash
   # Buat token di Settings → Developer settings → Personal access tokens
   # Lalu klik "Set up Git credentials for this computer"
   ```

## 🚀 Deployment ke GitHub Pages

### 9.1. Enable GitHub Pages

1. Di repo GitHub → **Settings** → scroll ke bawah → **GitHub Pages**
2. Pada **Source**, pilih **Deploy from a branch**:
   - Branch: `main`
   - Folder: `/root` (karena root folder `frontend/` berisi semua file)
3. Klik **Save** → Tunggu proses build (maksimal 5-10 menit)

### 9.2. Custom Domain (Opsional)

1. Kembali ke **Settings** → **GitHub Pages**
2. Pada **Custom domain**, masukkan `yourdomain.com`
3. Verifikasi DNS di provider domain:
   - A Record: `CNAME` → `your-username.github.io`
   - Atau use GitHub Pages dengan redirect (lebih mudah)

### 9.3. URL Website

Setelah deployment berhasil, website akan tersedia di:
```
https://[USERNAME].github.io/[REPOSITORY_NAME]/    (default)
https://[USERNAME].github.io/                     (jika repo bernama your-username.github.io)
```

## ✅ Checklist Validasi

### Backend Validasi
- [ ] Kode `Code.gs` dipaste dengan benar
- [ ] Kredensial (`ADMIN_EMAIL`, `ADMIN_PASSWORD`) diupdate
- [ ] Fungsi `setup()` dijalankan sekali dan berhasil
- [ ] Web App URL (`/exec`) di-copy dan disimpan

### Frontend Validasi
- [ ] Semua file frontend ada di folder `frontend/`
- [ ] `API_URL` diupdate di `app.js` dan `admin.js`
- [ ] Semua halaman (index, product, checkout, redeem, testimonial, admin) bisa diakses
- [ ] Dashboard admin bisa diakses dengan kredensial dari backend
- [ ] Dashboard admin menampilkan data (produk, pesanan, testimoni)

### Integrasi
- [ ] URL Web App GAS dan URL GitHub Pages bisa diakses dari browser
- [ ] Produk bisa ditampilkan di katalog
- [ ] Alur pembelian + redeem berfungsi
- [ ] Admin bisa login dan mengelola produk/pesanan/testimoni

© 2025 Digital Product Store. All rights reserved.

## 🚀 Deployment

1. **Backend:**
   - GAS Web App is automatically accessible via `/exec` URL
   - No additional deployment needed

2. **Frontend:**
   - GitHub Pages will automatically deploy when you push to main branch
   - URL will be: `https://[username].github.io/[repo-name]/`

## 🛠️ Usage

- **Customer:**
  - Visit landing page to browse products
  - Click "Jelajahi Produk" to see catalog
  - Select product → click "Detail" → "Beli Sekarang" for checkout
  - Use "Tukar Kode Redeem" to access purchased products

- **Admin:**
  - Login to dashboard using credentials from CONFIG
  - Manage products, orders, testimonials, and reports
  - All changes in Google Sheets are automatically reflected in the app

## 📌 Important Notes

- All data is stored in Google Sheets and Drive
- CORS is handled by GAS - no additional configuration needed
- For production use, consider adding HTTPS and custom domain
- The system is designed for light traffic (10-30 transactions/day)
- Admin login is single-user only (as specified in PRD)

## 📞 Support

For questions or issues, please contact:
- Admin: admin@digitalstore.id
- Developer: [Your Name/Contact]

© 2025 Digital Product Store. All rights reserved.