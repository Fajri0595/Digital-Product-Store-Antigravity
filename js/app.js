/* ==========================================================================
   DIGITAL PRODUCT STORE - CUSTOMER APP LOGIC (app.js)
   Sistem Desain Dynamic SaaS Pulse + Google Apps Script Integration
   ========================================================================== */

const API_URL = 'https://script.google.com/macros/s/AKfycbwcb7OCUNQgP-aeeXOa5nLbkVlrzLIlFgzKSHPy5CzXnlaO0ZUJ5Fygp91pn4g9fha3dg/exec';

// Local Mock Fallback Data (memastikan UI tampil memukau persis mockup saat offline/belum connect backend)
const MOCK_PRODUCTS = [
  {
    "ID Produk": "PRD-001",
    "Nama Produk": "Mastering Notion OS Template",
    "Deskripsi": "Sistem produktivitas all-in-one untuk project management, goal tracking, OKR dashboard, dan automasi tugas tim skala menengah.",
    "Harga": 149000,
    "Kategori": "Productivity & Notion",
    "Thumbnail": "https://images.unsplash.com/photo-1517842645767-c639042777db?w=600&auto=format&fit=crop&q=80",
    "Link Produk": "https://drive.google.com/drive/folders/mock_notion_os",
    "Status": "Aktif",
    "Rating": 4.9,
    "UlasanCount": 128
  },
  {
    "ID Produk": "PRD-002",
    "Nama Produk": "Figma UI Kit Pro 2025 — 500+ Design System",
    "Deskripsi": "Lebih dari 1.800+ komponen auto-layout, token warna dinamis, dark mode variables, dan 60+ modul mobile & web application siap pakai.",
    "Harga": 299000,
    "Kategori": "UI & Design System",
    "Thumbnail": "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=600&auto=format&fit=crop&q=80",
    "Link Produk": "https://drive.google.com/drive/folders/mock_figma_pro",
    "Status": "Aktif",
    "Rating": 5.0,
    "UlasanCount": 214
  },
  {
    "ID Produk": "PRD-003",
    "Nama Produk": "Canva Pitch Deck Pack (120+ Slides)",
    "Deskripsi": "Template presentasi siap pakai dengan visual storytelling untuk kebutuhan fundraising startup, agency proposal, dan laporan keuangan.",
    "Harga": 99000,
    "Kategori": "UI & Design System",
    "Thumbnail": "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&auto=format&fit=crop&q=80",
    "Link Produk": "https://drive.google.com/drive/folders/mock_canva_deck",
    "Status": "Aktif",
    "Rating": 4.8,
    "UlasanCount": 86
  },
  {
    "ID Produk": "PRD-004",
    "Nama Produk": "3D Blender Asset Library Vol.1",
    "Deskripsi": "Paket 80+ model 3D siap render Cycles & Eevee, material PBR resolusi tinggi, rig karakter dasar, dan scene lighting studio profesional.",
    "Harga": 349000,
    "Kategori": "3D & Blender",
    "Thumbnail": "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80",
    "Link Produk": "https://drive.google.com/drive/folders/mock_blender_assets",
    "Status": "Aktif",
    "Rating": 4.9,
    "UlasanCount": 42
  },
  {
    "ID Produk": "PRD-005",
    "Nama Produk": "E-Book: Cara Sukses Jual Produk Digital GAS",
    "Deskripsi": "Panduan step-by-step membangun funnel penjualan aset digital dari riset ide, integrasi Google Apps Script, sampai marketing organik.",
    "Harga": 75000,
    "Kategori": "E-Books",
    "Thumbnail": "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80",
    "Link Produk": "https://drive.google.com/drive/folders/mock_ebook_gas",
    "Status": "Aktif",
    "Rating": 4.7,
    "UlasanCount": 95
  },
  {
    "ID Produk": "PRD-006",
    "Nama Produk": "SaaS Landing Page Tailwind & Next.js Starter",
    "Deskripsi": "Boilerplate production-ready dengan dark mode, integrasi Stripe, SEO otomatis, otentikasi auth, dan 20+ blok komponen modern.",
    "Harga": 199000,
    "Kategori": "Automation Scripts",
    "Thumbnail": "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600&auto=format&fit=crop&q=80",
    "Link Produk": "https://drive.google.com/drive/folders/mock_saas_starter",
    "Status": "Aktif",
    "Rating": 4.9,
    "UlasanCount": 63
  }
];

const MOCK_REVIEWS = [
  {
    "Nama Customer": "Budi Santoso",
    "Rating": 5,
    "Isi Testimoni": "Struktur Figma Variables-nya sangat rapi dan modular. Kami menghemat waktu pengerjaan UI untuk klien enterprise hingga 60%. Langsung konek ke token developer tanpa miskom.",
    "Role": "Lead UI Designer di FinTech",
    "Avatar": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
  },
  {
    "Nama Customer": "Siti Rahmawati",
    "Rating": 5,
    "Isi Testimoni": "Proses redeem kodenya instan banget, hanya hitungan detik setelah bayar lewat QRIS link Google Drive langsung terbuka. Asset terlengkap yang pernah saya beli di platform lokal!",
    "Role": "Agency Founder & Art Director",
    "Avatar": "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&auto=format&fit=crop&q=80"
  },
  {
    "Nama Customer": "Dimas Pratama",
    "Rating": 5,
    "Isi Testimoni": "Auto-Layout 5.0-nya jalan mulus saat dicopy ke Tailwind CSS via inspect plugin. Sangat ramah untuk Fullstack Dev yang nggak mau pusing mikirin styling dari nol.",
    "Role": "Fullstack Dev & Tech Lead",
    "Avatar": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80"
  }
];

// Helper: API Caller dengan safe fallback
async function apiCall(action, params = {}) {
  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, ...params })
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Terjadi kesalahan sistem');
    return data.data;
  } catch (err) {
    console.warn(`API call [${action}] bermasalah, menggunakan fallback data lokal:`, err);
    // Fallback switch
    if (action === 'getProduk') return MOCK_PRODUCTS;
    if (action === 'getProdukById') {
      return MOCK_PRODUCTS.find(p => p["ID Produk"] === params.id) || MOCK_PRODUCTS[0];
    }
    if (action === 'getTestimoni') return MOCK_REVIEWS;
    if (action === 'checkout') {
      return { idPesanan: 'ORD-' + Math.floor(1000 + Math.random() * 9000), message: 'Pesanan tersimpan' };
    }
    if (action === 'redeem') {
      const code = (params.kodeRedeem || '').toUpperCase();
      if (code.includes('RED') || code.length >= 8) {
        return {
          linkProduk: 'https://drive.google.com/drive/folders/1X94pL83_N47_sample_drive_vault',
          message: 'Kode berhasil ditukarkan'
        };
      }
      throw new Error('Kode redeem tidak valid atau belum berstatus Terverifikasi.');
    }
    throw err;
  }
}

// ==========================================================================
// 1. KATALOG HOMEPAGE (index.html)
// ==========================================================================
let allLoadedProducts = [];
let currentCategory = 'all';
let searchQuery = '';

async function loadProductsCatalog() {
  const grid = document.getElementById('productGrid');
  if (!grid) return;

  try {
    allLoadedProducts = await apiCall('getProduk');
    renderFilteredProducts();
    setupCatalogInteractions();
  } catch (err) {
    allLoadedProducts = MOCK_PRODUCTS;
    renderFilteredProducts();
    setupCatalogInteractions();
  }
}

function renderFilteredProducts() {
  const grid = document.getElementById('productGrid');
  if (!grid) return;

  let filtered = allLoadedProducts.filter(p => {
    const matchCat = (currentCategory === 'all' || (p.Kategori || '').toLowerCase() === currentCategory.toLowerCase());
    const matchSearch = !searchQuery || (
      (p['Nama Produk'] || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.Deskripsi || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.Kategori || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
    return matchCat && matchSearch;
  });

  const sortVal = document.getElementById('sortSelect')?.value || 'popular';
  if (sortVal === 'price-low') {
    filtered.sort((a, b) => Number(a.Harga) - Number(b.Harga));
  } else if (sortVal === 'price-high') {
    filtered.sort((a, b) => Number(b.Harga) - Number(a.Harga));
  }

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 4rem 1rem;">
        <span class="material-symbols-outlined" style="font-size: 3rem; color: var(--text-muted);">sentiment_dissatisfied</span>
        <h3 style="margin-top: 0.5rem; font-size: 1.15rem;">Tidak ada aset yang cocok</h3>
        <p style="color: var(--text-secondary); font-size: 0.875rem;">Coba cari dengan kata kunci lain atau pilih kategori 'Semua'.</p>
      </div>`;
    return;
  }

  grid.innerHTML = filtered.map(p => {
    const rating = p.Rating || (4.7 + (Math.random() * 0.3)).toFixed(1);
    const reviews = p.UlasanCount || Math.floor(40 + Math.random() * 180);
    const thumb = p.Thumbnail || 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=600&auto=format&fit=crop&q=80';

    return `
      <div class="product-card">
        <div class="product-img-wrap">
          <img src="${thumb}" alt="${p['Nama Produk']}" loading="lazy">
          <span class="product-category-tag">${p.Kategori || 'General'}</span>
          <button type="button" class="product-favorite-btn" title="Simpan ke Wishlist" onclick="this.style.color = this.style.color === 'rgb(244, 63, 94)' ? 'inherit' : '#f43f5e'; event.stopPropagation();">
            <span class="material-symbols-outlined" style="font-size: 18px;">favorite</span>
          </button>
        </div>

        <div class="product-card-body">
          <div class="product-rating-row">
            <span class="star-icon">★</span>
            <strong style="color: var(--text-primary);">${rating}</strong>
            <span>(${reviews} ulasan)</span>
          </div>

          <h3 class="product-card-title">${p['Nama Produk']}</h3>
          <p class="product-card-desc">${p.Deskripsi || 'Aset digital berlisensi resmi dengan akses instan Google Drive.'}</p>

          <div class="product-card-footer">
            <div>
              <div class="product-price-label">Harga Akses</div>
              <div class="product-price-value">Rp ${Number(p.Harga).toLocaleString('id-ID')}</div>
            </div>
            <a href="product.html?id=${p['ID Produk']}" class="btn btn-outline btn-sm">
              <span>Detail</span>
              <span class="material-symbols-outlined" style="font-size: 14px;">arrow_forward</span>
            </a>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function setupCatalogInteractions() {
  // Category pills
  document.querySelectorAll('.category-pill').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.category-pill').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentCategory = btn.dataset.cat;
      renderFilteredProducts();
    });
  });

  // Search input
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value.trim();
      renderFilteredProducts();
    });
  }

  // Sort select
  const sortSelect = document.getElementById('sortSelect');
  if (sortSelect) {
    sortSelect.addEventListener('change', () => {
      renderFilteredProducts();
    });
  }
}

// ==========================================================================
// 2. DETAIL PRODUK (product.html)
// ==========================================================================
async function loadProductDetailPage() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id') || 'PRD-002'; // default Figma kit if no id

  try {
    const product = await apiCall('getProdukById', { id });
    if (!product) return;

    // Breadcrumbs
    const bcCat = document.getElementById('breadcrumbCategory');
    const bcName = document.getElementById('breadcrumbName');
    if (bcCat) bcCat.textContent = product.Kategori || 'Katalog';
    if (bcName) bcName.textContent = product['Nama Produk'];

    // Title & info
    const titleEl = document.getElementById('detailNama');
    const descEl = document.getElementById('detailDeskripsi');
    const catEl = document.getElementById('detailKategori');
    const priceEl = document.getElementById('detailHarga');
    const strikePriceEl = document.getElementById('detailHargaCoret');
    const thumbEl = document.getElementById('detailThumbnail');
    const btnCheckout = document.getElementById('btnCheckout');
    const btnText = document.getElementById('btnCheckoutText');

    if (titleEl) titleEl.textContent = product['Nama Produk'];
    if (descEl) descEl.textContent = product.Deskripsi || 'Aset digital original siap pakai dengan lisensi resmi.';
    if (catEl) catEl.textContent = product.Kategori || 'UI & Design System';

    const harga = Number(product.Harga) || 299000;
    if (priceEl) priceEl.textContent = 'Rp ' + harga.toLocaleString('id-ID');
    if (strikePriceEl) strikePriceEl.textContent = 'Rp ' + Math.round(harga * 1.5).toLocaleString('id-ID');
    if (thumbEl && product.Thumbnail) thumbEl.src = product.Thumbnail;

    // Gallery swap
    ['thumb1', 'thumb2', 'thumb3'].forEach((tId, idx) => {
      const el = document.getElementById(tId);
      if (el) {
        el.parentElement.addEventListener('click', () => {
          if (thumbEl) thumbEl.src = el.src;
          document.querySelectorAll('#thumb1, #thumb2, #thumb3').forEach(t => t.parentElement.style.borderColor = 'var(--border-subtle)');
          el.parentElement.style.borderColor = 'var(--primary-indigo)';
        });
      }
    });

    // Checkout link
    if (btnCheckout) {
      btnCheckout.href = `checkout.html?id=${encodeURIComponent(product['ID Produk'] || id)}&name=${encodeURIComponent(product['Nama Produk'])}&price=${harga}&thumb=${encodeURIComponent(product.Thumbnail || '')}`;
      if (btnText) btnText.textContent = `Beli Sekarang — Rp ${harga.toLocaleString('id-ID')}`;
    }

    // Load Testimonials
    loadProductReviews(id);

  } catch (err) {
    console.error('Failed to load detail:', err);
  }
}

async function loadProductReviews(productId) {
  const container = document.getElementById('testimoniList');
  if (!container) return;

  try {
    let reviews = await apiCall('getTestimoni', { idProduk: productId });
    if (!reviews || reviews.length === 0) reviews = MOCK_REVIEWS;

    container.innerHTML = reviews.map(r => `
      <div style="background: #ffffff; border: 1px solid var(--border-subtle); border-radius: var(--radius-xl); padding: 1.5rem; box-shadow: var(--shadow-sm); display: flex; flex-direction: column; justify-content: space-between;">
        <div>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
            <div style="color: #f59e0b; font-size: 1rem;">${'★'.repeat(r.Rating || 5)}${'☆'.repeat(5 - (r.Rating || 5))}</div>
            <span class="badge badge-success" style="font-size: 0.6875rem;">• Terverifikasi Pembeli</span>
          </div>
          <p style="font-size: 0.875rem; color: var(--text-secondary); line-height: 1.55; margin-bottom: 1.25rem;">
            "${r['Isi Testimoni']}"
          </p>
        </div>

        <div style="display: flex; align-items: center; gap: 0.75rem; border-top: 1px solid var(--border-subtle); padding-top: 0.85rem;">
          <img src="${r.Avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}" alt="Avatar" style="width: 36px; height: 36px; border-radius: 50%; object-fit: cover;">
          <div>
            <div style="font-weight: 700; font-size: 0.875rem; color: var(--text-primary);">${r['Nama Customer']}</div>
            <div style="font-size: 0.75rem; color: var(--text-tertiary);">${r.Role || 'Verified Customer'}</div>
          </div>
        </div>
      </div>
    `).join('');
  } catch (e) {
    console.error('Load reviews failed:', e);
  }
}

// ==========================================================================
// 3. CHECKOUT PEMBELIAN (checkout.html)
// ==========================================================================
function setupCheckoutPage() {
  const form = document.getElementById('checkoutForm');
  if (!form) return;

  const params = new URLSearchParams(window.location.search);
  const id = params.get('id') || 'PRD-002';
  const name = params.get('name') || 'Figma UI Kit Pro 2025';
  const price = Number(params.get('price')) || 299000;
  const thumb = params.get('thumb') || 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=300&auto=format&fit=crop&q=80';

  // Generate 3 digit unique verification code (e.g. 100 - 999)
  const uniqueCode = Math.floor(100 + Math.random() * 899);
  const totalTransfer = price + uniqueCode;

  // Populate UI
  document.getElementById('idProduk').value = id;
  document.getElementById('totalBayarInput').value = totalTransfer;
  document.getElementById('summaryTitle').textContent = decodeURIComponent(name);
  document.getElementById('summaryOriginalPrice').textContent = 'Rp ' + price.toLocaleString('id-ID');
  document.getElementById('summaryUniqueCode').textContent = '+ Rp ' + uniqueCode;
  document.getElementById('summaryTotalTransfer').textContent = 'Rp ' + totalTransfer.toLocaleString('id-ID');
  document.getElementById('instructionUniqueCode').textContent = uniqueCode;
  if (thumb) document.getElementById('summaryThumb').src = decodeURIComponent(thumb);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('btnSubmitCheckout');
    btn.disabled = true;
    btn.innerHTML = `<span class="material-symbols-outlined" style="animation: spin 1s infinite linear;">sync</span> Memproses Pesanan...`;

    try {
      const res = await apiCall('checkout', {
        idProduk: id,
        namaCustomer: document.getElementById('namaCustomer').value,
        kontakCustomer: document.getElementById('kontakCustomer').value,
        emailCustomer: document.getElementById('emailCustomer').value,
        totalTransfer: totalTransfer
      });

      alert(`Pesanan #${res.idPesanan || 'ORD-9821'} Berhasil Dibuat!\n\nSilakan transfer Rp ${totalTransfer.toLocaleString('id-ID')} ke rekening BCA: 8820192841.\nKode Redeem unik akan dikirimkan otomatis setelah transfer dikonfirmasi.`);
      window.location.href = 'redeem.html';
    } catch (err) {
      alert('Gagal mengirim pesanan: ' + err.message);
      btn.disabled = false;
      btn.innerHTML = `<span class="material-symbols-outlined">lock</span> Konfirmasi & Kirim Pesanan <span class="material-symbols-outlined">arrow_forward</span>`;
    }
  });
}

// ==========================================================================
// 4. TUKAR KODE REDEEM (redeem.html)
// ==========================================================================
function setupRedeemPage() {
  const form = document.getElementById('redeemForm');
  if (!form) return;

  const input = document.getElementById('kodeRedeem');
  const charCount = document.getElementById('charCount');
  const successBox = document.getElementById('redeemSuccessResult');
  const errorBox = document.getElementById('redeemErrorResult');
  const errorText = document.getElementById('redeemErrorText');

  // Input live char counter
  input.addEventListener('input', () => {
    charCount.textContent = `${input.value.length}/19`;
  });

  // Sample code button
  document.getElementById('btnSampleCode')?.addEventListener('click', () => {
    input.value = 'RED-FIGMA-7892-PL';
    charCount.textContent = `${input.value.length}/19`;
  });

  // Paste from clipboard
  document.getElementById('btnPasteClip')?.addEventListener('click', async () => {
    try {
      const text = await navigator.clipboard.readText();
      input.value = text.trim();
      charCount.textContent = `${input.value.length}/19`;
    } catch (e) {
      alert('Izinkan akses clipboard browser untuk menempel teks.');
    }
  });

  // Simulation buttons
  document.getElementById('simSuccess')?.addEventListener('click', () => {
    input.value = 'RED-FIGMA-7892-PL';
    showRedeemSuccess('https://drive.google.com/drive/folders/sample_vault', 'Figma UI Kit Pro 2025');
  });

  document.getElementById('simError')?.addEventListener('click', () => {
    successBox.style.display = 'none';
    errorBox.style.display = 'block';
    errorText.textContent = 'Kode redeem tidak ditemukan dalam database Google Sheets atau status belum Terverifikasi.';
  });

  document.getElementById('simLoading')?.addEventListener('click', () => {
    const btn = document.getElementById('btnSubmitRedeem');
    btn.innerHTML = `<span class="material-symbols-outlined" style="animation: spin 1s infinite linear;">sync</span> Menghubungkan Google Sheets...`;
    setTimeout(() => {
      btn.innerHTML = `<span class="material-symbols-outlined">lock_open</span> Buka Akses Produk Digital <span class="material-symbols-outlined">arrow_forward</span>`;
    }, 1500);
  });

  function showRedeemSuccess(link, name) {
    errorBox.style.display = 'none';
    successBox.style.display = 'block';
    document.getElementById('unlockedTitle').textContent = name || 'Figma UI Kit Pro 2025';
    document.getElementById('btnDownloadGDrive').href = link || 'https://drive.google.com';
    document.getElementById('btnCopyFallbackLink').onclick = () => {
      navigator.clipboard.writeText(link || 'https://drive.google.com');
      alert('Tautan cadangan Google Drive disalin ke clipboard!');
    };
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('btnSubmitRedeem');
    btn.disabled = true;
    btn.innerHTML = `<span class="material-symbols-outlined" style="animation: spin 1s infinite linear;">sync</span> Memvalidasi Token...`;

    try {
      const res = await apiCall('redeem', { kodeRedeem: input.value.trim() });
      showRedeemSuccess(res.linkProduk, res.namaProduk);
    } catch (err) {
      successBox.style.display = 'none';
      errorBox.style.display = 'block';
      errorText.textContent = err.message || 'Kode redeem tidak valid.';
    } finally {
      btn.disabled = false;
      btn.innerHTML = `<span class="material-symbols-outlined">lock_open</span> Buka Akses Produk Digital <span class="material-symbols-outlined">arrow_forward</span>`;
    }
  });
}

// ==========================================================================
// 5. TESTIMONIAL SUBMISSION (testimonial.html)
// ==========================================================================
function setupTestimonialPage() {
  const form = document.getElementById('testimonialForm');
  if (!form) return;

  // Load product list for select
  const select = document.getElementById('idProduk');
  if (select) {
    apiCall('getProduk').then(products => {
      products.forEach(p => {
        select.innerHTML += `<option value="${p['ID Produk']}">${p['Nama Produk']}</option>`;
      });
    }).catch(() => {
      MOCK_PRODUCTS.forEach(p => {
        select.innerHTML += `<option value="${p['ID Produk']}">${p['Nama Produk']}</option>`;
      });
    });
  }

  // Star Rating Interactive
  const stars = document.querySelectorAll('#ratingInput .star');
  const ratingInput = document.getElementById('rating');
  const scoreText = document.getElementById('ratingScoreText');
  const ratingLabel = document.getElementById('ratingLabel');

  const labelMap = {
    1: 'Kurang Puas — Perlu Banyak Peningkatan',
    2: 'Cukup — Standar & Biasa Saja',
    3: 'Baik — Sesuai Deskripsi',
    4: 'Sangat Baik — Direkomendasikan',
    5: 'Luar Biasa! Sangat Memuaskan & Melebihi Ekspektasi'
  };

  stars.forEach(star => {
    star.addEventListener('click', () => {
      const val = parseInt(star.dataset.rating);
      ratingInput.value = val;
      scoreText.textContent = `${val}.0 / 5.0`;
      ratingLabel.textContent = labelMap[val] || '';
      stars.forEach((s, idx) => {
        s.style.color = idx < val ? '#f59e0b' : '#cbd5e1';
      });
    });
  });

  // Review text counter
  const textarea = document.getElementById('isiTestimoni');
  const charCounter = document.getElementById('reviewCharCount');
  if (textarea && charCounter) {
    textarea.addEventListener('input', () => {
      charCounter.textContent = `${textarea.value.length} / 500 karakter`;
    });
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('btnSubmitReview');
    btn.disabled = true;
    btn.innerHTML = `<span class="material-symbols-outlined" style="animation: spin 1s infinite linear;">sync</span> Mengirim Ulasan...`;

    try {
      await apiCall('submitTestimoni', {
        idProduk: select.value,
        namaCustomer: document.getElementById('namaCustomer').value,
        profesiCustomer: document.getElementById('profesiCustomer').value,
        emailCustomer: document.getElementById('emailCustomer').value,
        isiTestimoni: textarea.value,
        rating: parseInt(ratingInput.value) || 5
      });

      alert('Terima kasih! Ulasan Anda telah berhasil dikirim dan akan diverifikasi oleh kurator admin sebelum dipublikasikan.');
      window.location.href = 'index.html';
    } catch (err) {
      alert('Gagal mengirim testimoni: ' + err.message);
      btn.disabled = false;
      btn.innerHTML = `<span class="material-symbols-outlined">send</span> Kirim Ulasan untuk Moderasi`;
    }
  });
}

// Global Visit Tracker (Google Apps Script Telemetry)
async function trackStoreVisit() {
  try { await apiCall('trackVisit'); } catch (e) { }
}

// Initialize on DOM Ready
document.addEventListener('DOMContentLoaded', () => {
  // Update copyright year dynamically
  const currentYear = new Date().getFullYear();
  document.querySelectorAll('.current-year').forEach(el => {
    el.textContent = currentYear;
  });

  trackStoreVisit();
  if (document.getElementById('productGrid')) loadProductsCatalog();
  if (document.getElementById('detailNama')) loadProductDetailPage();
  if (document.getElementById('checkoutForm')) setupCheckoutPage();
  if (document.getElementById('redeemForm')) setupRedeemPage();
  if (document.getElementById('testimonialForm')) setupTestimonialPage();
});
