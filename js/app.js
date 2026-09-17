/* ==========================================================================
   DIGITAL PRODUCT STORE - CUSTOMER APP LOGIC (app.js)
   Sistem Desain Dynamic SaaS Pulse + Google Apps Script Integration
   ========================================================================== */

const API_URL = 'https://script.google.com/macros/s/AKfycbwcb7OCUNQgP-aeeXOa5nLbkVlrzLIlFgzKSHPy5CzXnlaO0ZUJ5Fygp91pn4g9fha3dg/exec';

// Empty mock data arrays - seluruh konten diisi dinamis dari Google Sheets & Admin
const MOCK_PRODUCTS = [];
const MOCK_REVIEWS = [];

// Helper: API Caller ke Google Apps Script backend
async function apiCall(action, params = {}) {
  const payload = { action, ...params };
  try {
    // 1. Primary: POST dengan text/plain (menghindari CORS OPTIONS preflight yang ditolak oleh GAS)
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload),
      redirect: 'follow'
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Terjadi kesalahan sistem');
    return data.data;
  } catch (err) {
    console.warn(`API call [${action}] primary POST error:`, err.message);

    // 2. Fallback: GET dengan query parameters
    try {
      const qParams = new URLSearchParams();
      for (const [k, v] of Object.entries(payload)) {
        if (v !== undefined && v !== null) {
          qParams.append(k, typeof v === 'object' ? JSON.stringify(v) : v);
        }
      }
      const getRes = await fetch(`${API_URL}?${qParams.toString()}`, {
        method: 'GET',
        redirect: 'follow'
      });
      const getData = await getRes.json();
      if (!getData.success) throw new Error(getData.error || 'Terjadi kesalahan sistem');
      return getData.data;
    } catch (fallbackErr) {
      console.warn(`API call [${action}] fallback GET error:`, fallbackErr.message);
      if (action === 'getProduk') return [];
      if (action === 'getProdukById') return null;
      if (action === 'getTestimoni') return [];
      throw fallbackErr;
    }
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
    const data = await apiCall('getProduk');
    allLoadedProducts = Array.isArray(data) ? data : [];
    updateCategoryPills(allLoadedProducts);
    renderFilteredProducts();
  } catch (err) {
    allLoadedProducts = [];
    updateCategoryPills([]);
    renderFilteredProducts();
  }
}

function updateCategoryPills(products) {
  const pillsContainer = document.getElementById('categoryPills');
  if (!pillsContainer) return;

  // Ekstrak kategori unik yang ada di produk nyata
  const categories = Array.from(
    new Set(
      products
        .map(p => (p.Kategori || p.kategori || '').trim())
        .filter(cat => cat.length > 0)
    )
  );

  let pillsHtml = `<button class="category-pill ${currentCategory === 'all' ? 'active' : ''}" data-cat="all">Semua</button>`;
  categories.forEach(cat => {
    const isActive = currentCategory.toLowerCase() === cat.toLowerCase() ? 'active' : '';
    pillsHtml += `<button class="category-pill ${isActive}" data-cat="${cat}">${cat}</button>`;
  });

  pillsContainer.innerHTML = pillsHtml;
  setupCatalogInteractions();
}

function renderFilteredProducts() {
  const grid = document.getElementById('productGrid');
  if (!grid) return;

  // Jika memang belum ada data produk sama sekali di database
  if (!allLoadedProducts || allLoadedProducts.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 4.5rem 1.5rem; background: #ffffff; border: 1px dashed var(--border-subtle); border-radius: var(--radius-2xl);">
        <div style="width: 60px; height: 60px; border-radius: 50%; background: var(--surface-container); display: inline-flex; align-items: center; justify-content: center; margin-bottom: 1.25rem; color: var(--primary-indigo);">
          <span class="material-symbols-outlined" style="font-size: 30px;">inventory_2</span>
        </div>
        <h3 style="font-size: 1.35rem; font-weight: 800; color: var(--text-primary); margin-bottom: 0.5rem;">Katalog Masih Kosong</h3>
        <p style="color: var(--text-secondary); font-size: 0.925rem; max-width: 460px; margin: 0 auto 1.5rem; line-height: 1.6;">
          Belum ada produk digital yang dipublikasikan. Anda dapat menambahkan produk pertama secara langsung melalui Panel Admin atau Google Sheets.
        </p>
        <a href="admin.html" class="btn btn-primary btn-sm" style="display: inline-flex; align-items: center; gap: 0.4rem;">
          <span class="material-symbols-outlined" style="font-size: 16px;">admin_panel_settings</span>
          Buka Panel Admin
        </a>
      </div>`;
    return;
  }

  let filtered = allLoadedProducts.filter(p => {
    const pCat = (p.Kategori || p.kategori || '').toLowerCase();
    const pName = (p['Nama Produk'] || p.nama || '').toLowerCase();
    const pDesc = (p.Deskripsi || p.deskripsi || p.desc || '').toLowerCase();

    const matchCat = (currentCategory === 'all' || pCat === currentCategory.toLowerCase());
    const matchSearch = !searchQuery || (
      pName.includes(searchQuery.toLowerCase()) ||
      pDesc.includes(searchQuery.toLowerCase()) ||
      pCat.includes(searchQuery.toLowerCase())
    );
    return matchCat && matchSearch;
  });

  const sortVal = document.getElementById('sortSelect')?.value || 'popular';
  if (sortVal === 'price-low') {
    filtered.sort((a, b) => Number(a.Harga || a.harga || 0) - Number(b.Harga || b.harga || 0));
  } else if (sortVal === 'price-high') {
    filtered.sort((a, b) => Number(b.Harga || b.harga || 0) - Number(a.Harga || a.harga || 0));
  }

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 4rem 1rem;">
        <span class="material-symbols-outlined" style="font-size: 3rem; color: var(--text-muted);">sentiment_dissatisfied</span>
        <h3 style="margin-top: 0.5rem; font-size: 1.15rem; font-weight: 700;">Tidak ada aset yang cocok</h3>
        <p style="color: var(--text-secondary); font-size: 0.875rem;">Coba gunakan kata kunci pencarian lain atau pilih kategori 'Semua'.</p>
      </div>`;
    return;
  }

  grid.innerHTML = filtered.map(p => {
    const pId = p['ID Produk'] || p.id;
    const pName = p['Nama Produk'] || p.nama;
    const pCat = p.Kategori || p.kategori || 'Umum';
    const pDesc = p.Deskripsi || p.deskripsi || 'Aset digital resmi dengan akses cepat cloud storage.';
    const pHarga = Number(p.Harga || p.harga || 0);
    const rating = p.Rating || p.rating || '5.0';
    const reviews = p.UlasanCount || p.ulasanCount || 0;
    const thumb = p.Thumbnail || p.thumbnail || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80';

    return `
      <div class="product-card">
        <div class="product-img-wrap">
          <img src="${thumb}" alt="${pName}" loading="lazy">
          <span class="product-category-tag">${pCat}</span>
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

          <h3 class="product-card-title">${pName}</h3>
          <p class="product-card-desc">${pDesc}</p>

          <div class="product-card-footer">
            <div>
              <div class="product-price-label">Harga Akses</div>
              <div class="product-price-value">Rp ${pHarga.toLocaleString('id-ID')}</div>
            </div>
            <a href="product.html?id=${encodeURIComponent(pId)}" class="btn btn-outline btn-sm">
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
    btn.onclick = () => {
      document.querySelectorAll('.category-pill').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentCategory = btn.dataset.cat;
      renderFilteredProducts();
    };
  });

  // Search input
  const searchInput = document.getElementById('searchInput');
  if (searchInput && !searchInput.dataset.hasListener) {
    searchInput.dataset.hasListener = 'true';
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value.trim();
      renderFilteredProducts();
    });
  }

  // Sort select
  const sortSelect = document.getElementById('sortSelect');
  if (sortSelect && !sortSelect.dataset.hasListener) {
    sortSelect.dataset.hasListener = 'true';
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
  const id = params.get('id');

  const titleEl = document.getElementById('detailNama');
  const descEl = document.getElementById('detailDeskripsi');
  const catEl = document.getElementById('detailKategori');
  const priceEl = document.getElementById('detailHarga');
  const strikePriceEl = document.getElementById('detailHargaCoret');
  const thumbEl = document.getElementById('detailThumbnail');
  const btnCheckout = document.getElementById('btnCheckout');
  const btnText = document.getElementById('btnCheckoutText');
  const ratingValEl = document.getElementById('detailRatingVal');
  const reviewCountEl = document.getElementById('detailReviewCount');

  // Jika URL tidak memiliki parameter ID
  if (!id) {
    if (titleEl) titleEl.textContent = 'Pilih Produk dari Katalog';
    if (descEl) descEl.textContent = 'Silakan pilih produk digital terlebih dahulu dari halaman utama toko.';
    if (btnCheckout) {
      btnCheckout.href = 'index.html#katalog';
      if (btnText) btnText.textContent = 'Kembali ke Katalog Utama';
    }
    return;
  }

  try {
    const product = await apiCall('getProdukById', { id });
    if (!product) {
      if (titleEl) titleEl.textContent = 'Produk Tidak Ditemukan';
      if (descEl) descEl.textContent = 'Produk yang Anda cari belum terdaftar atau telah dinonaktifkan oleh admin.';
      if (btnCheckout) {
        btnCheckout.href = 'index.html#katalog';
        if (btnText) btnText.textContent = 'Kembali ke Katalog';
      }
      return;
    }

    const pName = product['Nama Produk'] || product.nama;
    const pCat = product.Kategori || product.kategori || 'Umum';
    const pDesc = product.Deskripsi || product.deskripsi || 'Aset digital resmi dengan akses instan Google Drive.';
    const pHarga = Number(product.Harga || product.harga || 0);
    const pThumb = product.Thumbnail || product.thumbnail;

    // Breadcrumbs
    const bcCat = document.getElementById('breadcrumbCategory');
    const bcName = document.getElementById('breadcrumbName');
    if (bcCat) bcCat.textContent = pCat;
    if (bcName) bcName.textContent = pName;

    // Title & info
    if (titleEl) titleEl.textContent = pName;
    if (descEl) descEl.textContent = pDesc;
    if (catEl) catEl.textContent = pCat;
    if (priceEl) priceEl.textContent = 'Rp ' + pHarga.toLocaleString('id-ID');
    if (strikePriceEl) {
      strikePriceEl.style.display = 'none'; // Bersih tanpa harga coret buatan
    }
    if (thumbEl && pThumb) thumbEl.src = pThumb;

    // Rating text
    if (ratingValEl) ratingValEl.textContent = product.Rating || '5.0';
    if (reviewCountEl) reviewCountEl.textContent = product.UlasanCount ? `(${product.UlasanCount} Ulasan)` : '(Belum ada ulasan)';

    // Checkout link
    if (btnCheckout) {
      btnCheckout.href = `checkout.html?id=${encodeURIComponent(product['ID Produk'] || id)}&name=${encodeURIComponent(pName)}&price=${pHarga}&thumb=${encodeURIComponent(pThumb || '')}`;
      if (btnText) btnText.textContent = `Beli Sekarang — Rp ${pHarga.toLocaleString('id-ID')}`;
    }

    // Load Testimonials
    loadProductReviews(id);

  } catch (err) {
    console.error('Failed to load detail:', err);
    if (titleEl) titleEl.textContent = 'Gagal Memuat Produk';
    if (descEl) descEl.textContent = 'Terjadi kendala saat menghubungkan ke database.';
  }
}

async function loadProductReviews(productId) {
  const container = document.getElementById('testimoniList');
  if (!container) return;

  try {
    const reviews = await apiCall('getTestimoni', { idProduk: productId });
    if (!reviews || reviews.length === 0) {
      container.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 3rem 1rem; background: #ffffff; border: 1px dashed var(--border-subtle); border-radius: var(--radius-xl); color: var(--text-secondary);">
          <span class="material-symbols-outlined" style="font-size: 32px; color: var(--text-muted); margin-bottom: 0.5rem; display: block;">rate_review</span>
          <p style="font-size: 0.95rem; font-weight: 600; color: var(--text-primary); margin-bottom: 0.25rem;">Belum Ada Ulasan</p>
          <p style="font-size: 0.8125rem;">Jadilah pembeli pertama yang memberikan ulasan untuk produk ini setelah transaksi berhasil!</p>
        </div>`;
      return;
    }

    container.innerHTML = reviews.map(r => `
      <div style="background: #ffffff; border: 1px solid var(--border-subtle); border-radius: var(--radius-xl); padding: 1.5rem; box-shadow: var(--shadow-sm); display: flex; flex-direction: column; justify-content: space-between;">
        <div>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
            <div style="color: #f59e0b; font-size: 1rem;">${'★'.repeat(Number(r.Rating || r.rating || 5))}${'☆'.repeat(5 - Number(r.Rating || r.rating || 5))}</div>
            <span class="badge badge-success" style="font-size: 0.6875rem;">• Terverifikasi Pembeli</span>
          </div>
          <p style="font-size: 0.875rem; color: var(--text-secondary); line-height: 1.55; margin-bottom: 1.25rem;">
            "${r['Isi Testimoni'] || r.isiTestimoni || ''}"
          </p>
        </div>

        <div style="display: flex; align-items: center; gap: 0.75rem; border-top: 1px solid var(--border-subtle); padding-top: 0.85rem;">
          <div style="width: 36px; height: 36px; border-radius: 50%; background: var(--surface-container); color: var(--primary-indigo); font-weight: 700; display: flex; align-items: center; justify-content: center; font-size: 0.875rem;">
            ${(r['Nama Customer'] || r.namaCustomer || 'C').slice(0, 1).toUpperCase()}
          </div>
          <div>
            <div style="font-weight: 700; font-size: 0.875rem; color: var(--text-primary);">${r['Nama Customer'] || r.namaCustomer}</div>
            <div style="font-size: 0.75rem; color: var(--text-tertiary);">Pembeli Terverifikasi</div>
          </div>
        </div>
      </div>
    `).join('');
  } catch (e) {
    container.innerHTML = `<div style="grid-column: 1 / -1; text-align: center; color: var(--text-muted); padding: 2rem;">Belum ada ulasan untuk produk ini.</div>`;
  }
}

// ==========================================================================
// 3. CHECKOUT PEMBELIAN (checkout.html)
// ==========================================================================
function setupCheckoutPage() {
  const form = document.getElementById('checkoutForm');
  if (!form) return;

  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  const name = params.get('name');
  const price = Number(params.get('price')) || 0;
  const thumb = params.get('thumb');

  const summaryTitleEl = document.getElementById('summaryTitle');
  const summaryPriceEl = document.getElementById('summaryOriginalPrice');
  const summaryCodeEl = document.getElementById('summaryUniqueCode');
  const summaryTotalEl = document.getElementById('summaryTotalTransfer');
  const instructionCodeEl = document.getElementById('instructionUniqueCode');
  const summaryThumbEl = document.getElementById('summaryThumb');
  const btnSubmit = document.getElementById('btnSubmitCheckout');

  if (!id) {
    if (summaryTitleEl) summaryTitleEl.textContent = 'Belum Ada Produk Dipilih';
    if (summaryPriceEl) summaryPriceEl.textContent = 'Rp 0';
    if (summaryTotalEl) summaryTotalEl.textContent = 'Rp 0';
    if (btnSubmit) {
      btnSubmit.disabled = true;
      btnSubmit.textContent = 'Pilih Produk Terlebih Dahulu dari Katalog';
    }
    return;
  }

  // State kalkulasi diskon & kupon
  let appliedCouponCode = '';
  let discountAmount = 0;

  // Generate 3 digit unique verification code (e.g. 100 - 999)
  const uniqueCode = Math.floor(100 + Math.random() * 899);

  function recalculateCheckout() {
    const netProductPrice = Math.max(0, price - discountAmount);
    const totalTransfer = netProductPrice + uniqueCode;

    document.getElementById('idProduk').value = id;
    document.getElementById('totalBayarInput').value = totalTransfer;
    if (summaryTitleEl) summaryTitleEl.textContent = decodeURIComponent(name || 'Produk Digital');
    if (summaryPriceEl) summaryPriceEl.textContent = 'Rp ' + price.toLocaleString('id-ID');
    if (summaryCodeEl) summaryCodeEl.textContent = '+ Rp ' + uniqueCode;
    if (summaryTotalEl) summaryTotalEl.textContent = 'Rp ' + totalTransfer.toLocaleString('id-ID');
    if (instructionCodeEl) instructionCodeEl.textContent = uniqueCode;
    if (thumb && summaryThumbEl) summaryThumbEl.src = decodeURIComponent(thumb);

    const rowDiskon = document.getElementById('rowDiskonKupon');
    const summaryCouponCode = document.getElementById('summaryCouponCode');
    const summaryDiscountAmount = document.getElementById('summaryDiscountAmount');

    if (discountAmount > 0) {
      if (rowDiskon) rowDiskon.style.display = 'flex';
      if (summaryCouponCode) summaryCouponCode.textContent = appliedCouponCode;
      if (summaryDiscountAmount) summaryDiscountAmount.textContent = '- Rp ' + discountAmount.toLocaleString('id-ID');
    } else {
      if (rowDiskon) rowDiskon.style.display = 'none';
    }

    return totalTransfer;
  }

  recalculateCheckout();

  // Handle Coupon Apply
  const inputKupon = document.getElementById('inputKodeKupon');
  const btnKupon = document.getElementById('btnApplyCoupon');
  const feedbackKupon = document.getElementById('couponFeedback');

  if (btnKupon && inputKupon) {
    btnKupon.addEventListener('click', async () => {
      const kode = inputKupon.value.trim().toUpperCase();
      if (!kode) {
        alert('Silakan masukkan kode kupon');
        return;
      }

      btnKupon.disabled = true;
      btnKupon.innerHTML = `<span class="material-symbols-outlined" style="animation: spin 1s infinite linear; font-size: 14px;">sync</span>`;

      try {
        const res = await apiCall('validasiKupon', {
          kodeKupon: kode,
          totalBelanja: price
        });

        appliedCouponCode = res.kodeKupon;
        discountAmount = res.potongan || 0;
        recalculateCheckout();

        if (feedbackKupon) {
          feedbackKupon.style.display = 'block';
          feedbackKupon.style.color = 'var(--accent-success)';
          feedbackKupon.textContent = `✓ ${res.message || 'Kupon berhasil diterapkan!'}`;
        }
      } catch (err) {
        discountAmount = 0;
        appliedCouponCode = '';
        recalculateCheckout();

        if (feedbackKupon) {
          feedbackKupon.style.display = 'block';
          feedbackKupon.style.color = 'var(--accent-danger)';
          feedbackKupon.textContent = `✕ ${err.message || 'Kupon tidak valid'}`;
        }
      } finally {
        btnKupon.disabled = false;
        btnKupon.textContent = 'Terapkan';
      }
    });
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const currentTotal = recalculateCheckout();

    btnSubmit.disabled = true;
    btnSubmit.innerHTML = `<span class="material-symbols-outlined" style="animation: spin 1s infinite linear;">sync</span> Memproses Pesanan...`;

    try {
      const res = await apiCall('checkout', {
        idProduk: id,
        namaCustomer: document.getElementById('namaCustomer').value,
        kontakCustomer: document.getElementById('kontakCustomer').value,
        emailCustomer: document.getElementById('emailCustomer').value,
        kodeKupon: appliedCouponCode || '',
        totalTransfer: currentTotal
      });

      alert(`✅ Pesanan #${res.idPesanan || 'ORD'} Berhasil Dibuat!\n\nSilakan transfer:\nRp ${currentTotal.toLocaleString('id-ID')}\n\nKe rekening BCA: 8161449962\na.n. Ahmad Fajri Fadhili\n\nPastikan transfer TEPAT hingga 3 digit terakhir.\nKode Redeem akan dikirim via WhatsApp dalam 5–15 menit setelah verifikasi.`);
      window.location.href = 'redeem.html';
    } catch (err) {
      alert('Gagal mengirim pesanan: ' + err.message);
      btnSubmit.disabled = false;
      btnSubmit.innerHTML = `<span class="material-symbols-outlined">lock</span> Konfirmasi & Kirim Pesanan <span class="material-symbols-outlined">arrow_forward</span>`;
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
  const successBox = document.getElementById('redeemSuccessResult');
  const errorBox = document.getElementById('redeemErrorResult');
  const errorText = document.getElementById('redeemErrorText');

  // Paste from clipboard
  document.getElementById('btnPasteClip')?.addEventListener('click', async () => {
    try {
      const text = await navigator.clipboard.readText();
      input.value = text.trim();
    } catch (e) {
      alert('Silakan tempel kode redeem secara manual ke kolom input.');
    }
  });

  function showRedeemSuccess(link, name, driveGranted, emailCustomer) {
    if (errorBox) errorBox.style.display = 'none';
    if (successBox) successBox.style.display = 'block';
    const titleEl = document.getElementById('unlockedTitle');
    const dlBtn = document.getElementById('btnDownloadGDrive');
    const copyFallbackBtn = document.getElementById('btnCopyFallbackLink');
    const driveStatusText = document.getElementById('drivePermissionNotice');

    if (titleEl) titleEl.textContent = name || 'Aset Digital Terverifikasi';
    if (dlBtn) dlBtn.href = link || 'https://drive.google.com';
    if (copyFallbackBtn) {
      copyFallbackBtn.onclick = () => {
        navigator.clipboard.writeText(link || 'https://drive.google.com');
        alert('Tautan akses Google Drive berhasil disalin ke clipboard!');
      };
    }

    if (driveStatusText) {
      if (driveGranted && emailCustomer) {
        driveStatusText.innerHTML = `✓ Hak akses Google Drive telah otomatis diberikan ke <strong>${emailCustomer}</strong> (Viewer Mode). Silakan klik tombol di atas dengan akun tersebut.`;
        driveStatusText.style.display = 'block';
      } else {
        driveStatusText.innerHTML = `Tautan unduhan aman ini terhubung langsung ke Google Drive Storage resmi.`;
        driveStatusText.style.display = 'block';
      }
    }
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('btnSubmitRedeem');
    btn.disabled = true;
    btn.innerHTML = `<span class="material-symbols-outlined" style="animation: spin 1s infinite linear;">sync</span> Memvalidasi Token...`;

    try {
      const res = await apiCall('redeem', { kodeRedeem: input.value.trim() });
      showRedeemSuccess(res.linkProduk, res.namaProduk, res.driveGranted, res.emailCustomer);
    } catch (err) {
      if (successBox) successBox.style.display = 'none';
      if (errorBox) errorBox.style.display = 'block';
      if (errorText) errorText.textContent = err.message || 'Kode redeem tidak ditemukan dalam database atau status pembayaran belum Terverifikasi.';
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
      if (!products || products.length === 0) {
        select.innerHTML = `<option value="" disabled selected>Belum ada produk di etalase toko</option>`;
      } else {
        select.innerHTML = `<option value="">Pilih salah satu produk digital...</option>`;
        products.forEach(p => {
          const pId = p['ID Produk'] || p.id;
          const pName = p['Nama Produk'] || p.nama;
          select.innerHTML += `<option value="${pId}">${pName}</option>`;
        });
      }
    }).catch(() => {
      select.innerHTML = `<option value="" disabled selected>Belum ada produk di etalase toko</option>`;
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
      if (scoreText) scoreText.textContent = `${val}.0 / 5.0`;
      if (ratingLabel) ratingLabel.textContent = labelMap[val] || '';
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
    if (!select.value) {
      alert('Silakan pilih produk yang Anda ulas terlebih dahulu.');
      return;
    }

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

// Global Visit Tracker
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
