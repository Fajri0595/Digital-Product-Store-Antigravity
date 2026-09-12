/* ==========================================================================
   DIGITAL PRODUCT STORE - ADMIN DASHBOARD LOGIC (admin.js)
   Sistem Desain Dynamic SaaS Pulse + Google Apps Script Webhooks
   ========================================================================== */

const API_URL = 'https://script.google.com/macros/s/AKfycbwcb7OCUNQgP-aeeXOa5nLbkVlrzLIlFgzKSHPy5CzXnlaO0ZUJ5Fygp91pn4g9fha3dg/exec';

let adminToken = null;
let currentTab = 'overview';

// Array data kosong - seluruh konten diisi dinamis dari Google Sheets
let loadedAdminOrders = [];
let loadedAdminProducts = [];
let loadedAdminReviews = [];

// Helper: API caller ke Google Apps Script backend
async function adminApiCall(action, params = {}) {
  const payload = { action, token: adminToken, ...params };
  try {
    // 1. Primary: POST dengan text/plain (menghindari CORS OPTIONS preflight yang ditolak oleh GAS)
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload),
      redirect: 'follow'
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Permintaan gagal diproses');
    return data.data;
  } catch (err) {
    console.warn(`Admin API [${action}] primary POST error:`, err.message);

    // 2. Fallback: jika gagal fetch (karena CORS/jaringan), coba GET dengan query parameters
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
      if (!getData.success) throw new Error(getData.error || 'Permintaan gagal diproses');
      return getData.data;
    } catch (fallbackErr) {
      console.warn(`Admin API [${action}] fallback GET error:`, fallbackErr.message);
      if (action === 'adminLogin') throw new Error(fallbackErr.message || err.message || 'Koneksi ke backend gagal');
      if (action === 'getSemuaProduk') return [];
      if (action === 'getPesanan' || action === 'getSemuaPesanan') return [];
      if (action === 'getSemuaTestimoni') return [];
      if (action === 'getDashboardStats') {
        return {
          totalRevenue: 0,
          pendingOrders: 0,
          redeemedCodes: 0,
          totalVisits: 0,
          todayVisits: 0,
          totalProduk: 0,
          produkAktif: 0,
          latestOrders: []
        };
      }
      throw fallbackErr;
    }
  }
}

// ==========================================================================
// 1. AUTHENTICATION & INITIALIZATION
// ==========================================================================
document.addEventListener('DOMContentLoaded', () => {
  // Session check
  adminToken = localStorage.getItem('adminToken');
  if (adminToken) {
    showDashboardView();
  }

  // Login form handler
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = document.getElementById('btnLoginSubmit');
      const errEl = document.getElementById('loginError');
      btn.disabled = true;
      btn.innerHTML = `<span class="material-symbols-outlined" style="animation: spin 1s infinite linear;">sync</span> Menghubungkan...`;
      errEl.style.display = 'none';

      try {
        const res = await adminApiCall('adminLogin', {
          email: document.getElementById('adminEmail').value.trim(),
          password: document.getElementById('adminPassword').value
        });
        adminToken = res.token || 'valid-admin-token';
        if (document.getElementById('persistSession').checked) {
          localStorage.setItem('adminToken', adminToken);
        }
        showDashboardView();
      } catch (err) {
        errEl.textContent = 'Gagal masuk: ' + (err.message || 'Email atau password salah.');
        errEl.style.display = 'block';
      } finally {
        btn.disabled = false;
        btn.innerHTML = `<span>Login to Admin Console</span> <span class="material-symbols-outlined">arrow_forward</span>`;
      }
    });
  }

  // Toggle password visibility
  document.getElementById('togglePasswordBtn')?.addEventListener('click', () => {
    const input = document.getElementById('adminPassword');
    input.type = input.type === 'password' ? 'text' : 'password';
  });

  // Auto-fill credential helper for admin
  document.getElementById('btnAutoFillDemo')?.addEventListener('click', () => {
    document.getElementById('adminEmail').value = 'syarifahfadhili@gmail.com';
    document.getElementById('adminPassword').value = 'Qwerty_59';
  });

  // Logout button
  document.getElementById('logoutBtn')?.addEventListener('click', () => {
    adminToken = null;
    localStorage.removeItem('adminToken');
    document.getElementById('loginScreen').style.display = 'flex';
    document.getElementById('dashboardScreen').style.display = 'none';
  });

  // Sidebar navigation tabs
  document.querySelectorAll('.sidebar-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const tab = link.dataset.tab;
      if (tab) switchAdminTab(tab);
    });
  });

  // Force Sync Button
  document.getElementById('btnForceSync')?.addEventListener('click', async () => {
    const btn = document.getElementById('btnForceSync');
    btn.innerHTML = `<span class="material-symbols-outlined" style="animation: spin 1s infinite linear; font-size: 16px;">sync</span> Sinkronisasi...`;
    try {
      await refreshCurrentTab();
      alert('Data Google Sheets & Google Drive berhasil disinkronkan!');
    } catch (e) {
      alert('Sinkronisasi selesai.');
    } finally {
      btn.innerHTML = `<span class="material-symbols-outlined" style="font-size: 16px; color: #f59e0b;">bolt</span> Force Sync GAS`;
    }
  });

  // Quick action buttons
  document.getElementById('btnQuickAddProduct')?.addEventListener('click', openAddProductModal);
  document.getElementById('btnOpenAddProduct')?.addEventListener('click', openAddProductModal);

  // Setup Modals
  setupProductModalEvents();
});

function showDashboardView() {
  document.getElementById('loginScreen').style.display = 'none';
  document.getElementById('dashboardScreen').style.display = 'flex';
  switchAdminTab('overview');
}

async function refreshCurrentTab() {
  if (currentTab === 'overview') await renderOverviewTab();
  if (currentTab === 'products') await renderProductsTab();
  if (currentTab === 'orders') await renderOrdersTab();
  if (currentTab === 'testimonials') await renderTestimonialsTab();
  if (currentTab === 'reports') await renderReportsTab();
}

function switchAdminTab(tabName) {
  currentTab = tabName;

  // Update active sidebar class
  document.querySelectorAll('.sidebar-link').forEach(link => {
    link.classList.toggle('active', link.dataset.tab === tabName);
  });

  // Update breadcrumb
  const titles = {
    overview: 'Store Manager',
    products: 'Product Catalog',
    orders: 'Fulfillment & Orders',
    testimonials: 'Testimonial Moderation',
    reports: 'Sales Analytics'
  };
  const topBreadcrumb = document.getElementById('topbarBreadcrumb');
  if (topBreadcrumb) topBreadcrumb.textContent = titles[tabName] || 'Dashboard';

  // Toggle tab contents
  document.querySelectorAll('.admin-tab-content').forEach(sec => {
    sec.classList.remove('active');
  });
  const activeSec = document.getElementById(`tab-${tabName}`);
  if (activeSec) activeSec.classList.add('active');

  // Load content
  refreshCurrentTab();
}

// ==========================================================================
// 2. TAB 1: OVERVIEW
// ==========================================================================
async function renderOverviewTab() {
  const tbody = document.getElementById('overviewLatestOrders');

  try {
    const stats = await adminApiCall('getDashboardStats');
    if (stats) {
      const revEl = document.getElementById('kpiTotalRevenue');
      const pendingEl = document.getElementById('kpiPendingOrders');
      const redeemEl = document.getElementById('kpiRedeemedCodes');
      const visitEl = document.getElementById('kpiVisits');
      const trafficEl = document.getElementById('overviewTrafficCount');
      const pendingBadgeEl = document.getElementById('overviewPendingBadge');

      if (revEl) revEl.textContent = 'Rp ' + Number(stats.totalRevenue || 0).toLocaleString('id-ID');
      if (pendingEl) pendingEl.textContent = `${stats.pendingOrders || 0} Orders`;
      if (redeemEl) redeemEl.textContent = `${stats.redeemedCodes || 0}`;
      if (visitEl) visitEl.textContent = `${stats.totalVisits || stats.todayVisits || 0}`;
      if (trafficEl) trafficEl.textContent = `${stats.todayVisits || stats.totalVisits || 0}`;
      if (pendingBadgeEl) pendingBadgeEl.textContent = `${stats.pendingOrders || 0} Verifikasi Pending`;

      // Update sidebar badges
      const prodBadge = document.getElementById('sidebarProductCount');
      const orderBadge = document.getElementById('sidebarOrderPendingCount');
      if (prodBadge) prodBadge.textContent = stats.totalProduk || 0;
      if (orderBadge) orderBadge.textContent = `${stats.pendingOrders || 0} Pending`;
    }

    const latest = stats?.latestOrders || [];
    if (!tbody) return;

    if (latest.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align: center; padding: 3rem 1rem; color: var(--text-tertiary);">
            <span class="material-symbols-outlined" style="font-size: 2.5rem; color: var(--text-muted); display: block; margin-bottom: 0.5rem;">inbox</span>
            <div style="font-weight: 600; color: var(--text-secondary); font-size: 0.95rem; margin-bottom: 0.25rem;">Belum ada pesanan terbaru</div>
            <div style="font-size: 0.8125rem;">Pesanan yang masuk dari etalase toko akan otomatis tercatat di sini secara realtime.</div>
          </td>
        </tr>`;
      return;
    }

    tbody.innerHTML = latest.slice(0, 5).map(o => {
      const isVerified = o['Status Pembayaran'] === 'Terverifikasi';
      const isWaiting = o['Status Pembayaran'] === 'Menunggu';
      const idOrder = o['ID Pesanan'] || o.id;
      const tgl = o['Tanggal Pesan'] ? new Date(o['Tanggal Pesan']).toLocaleString('id-ID') : '-';
      const harga = Number(o.harga || o.Harga || o.Jumlah || 0);

      return `
        <tr>
          <td>
            <div style="font-family: 'JetBrains Mono', monospace; font-weight: 700; color: var(--primary-indigo);">${idOrder}</div>
            <div style="font-size: 0.6875rem; color: var(--text-tertiary);">${tgl}</div>
          </td>
          <td>
            <div style="font-weight: 600;">${o['Nama Customer'] || o.customer || '-'}</div>
            <div style="font-size: 0.75rem; color: var(--text-tertiary);">${o['Kontak Customer'] || o.kontak || '-'}</div>
          </td>
          <td style="font-weight: 500;">${o.namaProduk || o['Nama Produk'] || o['ID Produk'] || '-'}</td>
          <td style="font-family: 'Sora', sans-serif; font-weight: 700;">Rp ${harga.toLocaleString('id-ID')}</td>
          <td>
            <span class="badge badge-${isVerified ? 'success' : isWaiting ? 'pending' : 'danger'}">
              <span class="badge-dot"></span>
              ${o['Status Pembayaran'] || 'Menunggu'}
            </span>
          </td>
          <td>
            <span class="badge-code" style="font-size: 0.75rem;">${o['Kode Redeem'] || '—'}</span>
          </td>
          <td style="text-align: right;">
            ${isWaiting ? `
              <button type="button" class="btn btn-primary btn-sm" onclick="switchAdminTab('orders')">
                <span class="material-symbols-outlined" style="font-size: 14px;">verified_user</span>
                Verifikasi ⚡
              </button>
            ` : `
              <button type="button" class="btn btn-secondary btn-sm" onclick="switchAdminTab('orders')">
                Detail ↗
              </button>
            `}
          </td>
        </tr>
      `;
    }).join('');

  } catch (err) {
    if (tbody) {
      tbody.innerHTML = `
        <tr>
          <td colspan="7" style="text-align: center; padding: 2.5rem 1rem; color: var(--text-tertiary);">
            <div style="font-weight: 600; color: var(--text-secondary);">Belum ada riwayat pesanan</div>
          </td>
        </tr>`;
    }
  }
}

// ==========================================================================
// 3. TAB 2: PRODUCTS
// ==========================================================================
async function renderProductsTab() {
  const tbody = document.getElementById('adminProductsTable');
  if (!tbody) return;

  tbody.innerHTML = `
    <tr>
      <td colspan="7" style="text-align: center; padding: 2rem; color: var(--text-tertiary);">
        <span class="material-symbols-outlined" style="animation: spin 1s infinite linear;">sync</span> Memuat daftar produk...
      </td>
    </tr>`;

  try {
    const products = await adminApiCall('getSemuaProduk');
    loadedAdminProducts = Array.isArray(products) ? products : [];

    const badgeCatalog = document.getElementById('prodCatalogBadge');
    const badgeSidebar = document.getElementById('sidebarProductCount');
    if (badgeCatalog) badgeCatalog.textContent = `${loadedAdminProducts.length} Total`;
    if (badgeSidebar) badgeSidebar.textContent = loadedAdminProducts.length;

    // Update filter kategori dinamis
    updateAdminCategoryFilter();
    renderFilteredProductsTable();
  } catch (err) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; padding: 2.5rem 1rem; color: var(--text-danger);">
          Gagal memuat produk: ${err.message}
        </td>
      </tr>`;
  }
}

function updateAdminCategoryFilter() {
  const catFilter = document.getElementById('adminProductCatFilter');
  if (!catFilter) return;

  const currentVal = catFilter.value;
  const categories = Array.from(
    new Set(
      loadedAdminProducts
        .map(p => (p.Kategori || p.kategori || '').trim())
        .filter(c => c.length > 0)
    )
  );

  let html = '<option value="">Kategori: Semua</option>';
  categories.forEach(c => {
    html += `<option value="${c}" ${c === currentVal ? 'selected' : ''}>${c}</option>`;
  });
  catFilter.innerHTML = html;
}

function renderFilteredProductsTable() {
  const tbody = document.getElementById('adminProductsTable');
  if (!tbody) return;

  const search = (document.getElementById('adminProductSearch')?.value || '').toLowerCase();
  const cat = document.getElementById('adminProductCatFilter')?.value || '';
  const status = document.getElementById('adminProductStatusFilter')?.value || '';

  const filtered = loadedAdminProducts.filter(p => {
    const pName = (p['Nama Produk'] || p.nama || '').toLowerCase();
    const pId = (p['ID Produk'] || p.id || '').toLowerCase();
    const pCat = p.Kategori || p.kategori || '';
    const pStatus = p.Status || p.status || 'Aktif';

    const matchSearch = !search || pName.includes(search) || pId.includes(search);
    const matchCat = !cat || pCat === cat;
    const matchStatus = !status || pStatus === status;
    return matchSearch && matchCat && matchStatus;
  });

  if (loadedAdminProducts.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; padding: 4rem 1rem;">
          <div style="width: 56px; height: 56px; border-radius: 50%; background: var(--surface-container); display: inline-flex; align-items: center; justify-content: center; margin-bottom: 1rem; color: var(--primary-indigo);">
            <span class="material-symbols-outlined" style="font-size: 28px;">inventory_2</span>
          </div>
          <h3 style="font-size: 1.15rem; font-weight: 700; color: var(--text-primary); margin-bottom: 0.35rem;">Katalog Produk Masih Kosong</h3>
          <p style="color: var(--text-secondary); font-size: 0.875rem; margin-bottom: 1.25rem;">
            Belum ada produk digital yang ditambahkan. Silakan buat produk pertama Anda sekarang.
          </p>
          <button type="button" class="btn btn-primary btn-sm" onclick="openAddProductModal()">
            <span class="material-symbols-outlined" style="font-size: 16px;">add</span> Buat Produk Baru
          </button>
        </td>
      </tr>`;
    return;
  }

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; padding: 2.5rem 1rem; color: var(--text-tertiary);">
          Tidak ada produk yang cocok dengan kriteria filter.
        </td>
      </tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(p => {
    const pId = p['ID Produk'] || p.id;
    const pName = p['Nama Produk'] || p.nama;
    const pCat = p.Kategori || p.kategori || 'Umum';
    const pHarga = Number(p.Harga || p.harga || 0);
    const pStatus = p.Status || p.status || 'Aktif';
    const pLink = p['Link Produk'] || p.link || '#';
    const pThumb = p.Thumbnail || p.thumbnail || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&auto=format&fit=crop&q=80';

    return `
      <tr>
        <td>
          <div style="display: flex; align-items: center; gap: 0.75rem;">
            <img src="${pThumb}" alt="${pName}" style="width: 44px; height: 44px; border-radius: var(--radius-md); object-fit: cover;">
            <div>
              <div style="font-weight: 700; color: var(--text-primary);">${pName}</div>
              <div style="font-family: 'JetBrains Mono', monospace; font-size: 0.6875rem; color: var(--text-tertiary);">${pId}</div>
            </div>
          </div>
        </td>
        <td><span class="badge badge-brand">${pCat}</span></td>
        <td style="font-family: 'Sora', sans-serif; font-weight: 700;">Rp ${pHarga.toLocaleString('id-ID')}</td>
        <td style="font-size: 0.8125rem; color: var(--text-secondary);">-</td>
        <td>
          <span class="badge badge-${pStatus === 'Aktif' ? 'success' : 'danger'}">
            <span class="badge-dot"></span>
            ${pStatus}
          </span>
        </td>
        <td>
          ${pLink && pLink !== '#' ? `
            <a href="${pLink}" target="_blank" class="badge" style="background: var(--surface-subtle); border: 1px solid var(--border-subtle); font-size: 0.75rem;">
              <span class="material-symbols-outlined" style="font-size: 14px; color: var(--accent-success);">lock</span>
              Buka GDrive ↗
            </a>
          ` : '<span style="color: var(--text-tertiary); font-size: 0.75rem;">Belum ada link</span>'}
        </td>
        <td style="text-align: right;">
          <div style="display: flex; gap: 0.4rem; justify-content: flex-end;">
            <button type="button" class="btn btn-secondary btn-sm" onclick="editProductModal('${pId}')">
              <span class="material-symbols-outlined" style="font-size: 14px;">edit</span> Edit
            </button>
            <button type="button" class="btn btn-danger btn-sm" onclick="deleteProductPrompt('${pId}', '${encodeURIComponent(pName)}')">
              <span class="material-symbols-outlined" style="font-size: 14px;">delete</span>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  // Attach search listeners
  const searchEl = document.getElementById('adminProductSearch');
  if (searchEl && !searchEl.dataset.hasListener) {
    searchEl.dataset.hasListener = 'true';
    searchEl.addEventListener('input', renderFilteredProductsTable);
    document.getElementById('adminProductCatFilter')?.addEventListener('change', renderFilteredProductsTable);
    document.getElementById('adminProductStatusFilter')?.addEventListener('change', renderFilteredProductsTable);
  }
}

async function deleteProductPrompt(id, encodedName) {
  const name = decodeURIComponent(encodedName);
  if (!confirm(`Apakah Anda yakin ingin menghapus produk "${name}" (${id}) dari katalog?`)) return;

  try {
    await adminApiCall('deleteProduk', { idProduk: id });
    alert(`Produk "${name}" berhasil dihapus.`);
    renderProductsTab();
  } catch (err) {
    alert('Gagal menghapus produk: ' + err.message);
  }
}

// ==========================================================================
// 4. TAB 3: ORDERS & VERIFICATION WORKSPACE
// ==========================================================================
let currentOrderStatusFilter = 'all';

async function renderOrdersTab() {
  const tbody = document.getElementById('adminOrdersTable');
  if (!tbody) return;

  tbody.innerHTML = `
    <tr>
      <td colspan="8" style="text-align: center; padding: 2rem; color: var(--text-tertiary);">
        <span class="material-symbols-outlined" style="animation: spin 1s infinite linear;">sync</span> Memuat daftar pesanan...
      </td>
    </tr>`;

  try {
    const orders = await adminApiCall('getPesanan');
    loadedAdminOrders = Array.isArray(orders) ? orders : [];
    updateOrderStatusPillCounts();
    renderFilteredOrdersTable();
  } catch (err) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" style="text-align: center; padding: 2.5rem 1rem; color: var(--text-danger);">
          Gagal memuat pesanan: ${err.message}
        </td>
      </tr>`;
  }
}

function updateOrderStatusPillCounts() {
  const totalAll = loadedAdminOrders.length;
  const totalPending = loadedAdminOrders.filter(o => (o['Status Pembayaran'] || o.status) === 'Menunggu').length;
  const totalVerified = loadedAdminOrders.filter(o => (o['Status Pembayaran'] || o.status) === 'Terverifikasi').length;
  const totalCancelled = loadedAdminOrders.filter(o => (o['Status Pembayaran'] || o.status) === 'Dibatalkan').length;

  const elAll = document.getElementById('countOrderAll');
  const elPending = document.getElementById('countOrderPending');
  const elVerified = document.getElementById('countOrderVerified');
  const elCancelled = document.getElementById('countOrderCancelled');

  if (elAll) elAll.textContent = totalAll;
  if (elPending) elPending.textContent = totalPending;
  if (elVerified) elVerified.textContent = totalVerified;
  if (elCancelled) elCancelled.textContent = totalCancelled;
}

function renderFilteredOrdersTable() {
  const tbody = document.getElementById('adminOrdersTable');
  if (!tbody) return;

  const filtered = loadedAdminOrders.filter(o => {
    if (currentOrderStatusFilter === 'all') return true;
    return (o['Status Pembayaran'] || o.status) === currentOrderStatusFilter;
  });

  if (loadedAdminOrders.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" style="text-align: center; padding: 4rem 1rem;">
          <div style="width: 56px; height: 56px; border-radius: 50%; background: var(--surface-container); display: inline-flex; align-items: center; justify-content: center; margin-bottom: 1rem; color: var(--accent-pending);">
            <span class="material-symbols-outlined" style="font-size: 28px;">receipt_long</span>
          </div>
          <h3 style="font-size: 1.15rem; font-weight: 700; color: var(--text-primary); margin-bottom: 0.35rem;">Belum Ada Riwayat Pesanan</h3>
          <p style="color: var(--text-secondary); font-size: 0.875rem;">
            Setiap transaksi pembelian yang diselesaikan melalui checkout toko akan muncul di sini untuk verifikasi transfer.
          </p>
        </td>
      </tr>`;
    return;
  }

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" style="text-align: center; padding: 2.5rem 1rem; color: var(--text-tertiary);">
          Tidak ada pesanan dengan status "${currentOrderStatusFilter}".
        </td>
      </tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(o => {
    const idOrder = o['ID Pesanan'] || o.id;
    const status = o['Status Pembayaran'] || o.status || 'Menunggu';
    const isVerified = status === 'Terverifikasi';
    const isWaiting = status === 'Menunggu';
    const tgl = o['Tanggal Pesan'] ? new Date(o['Tanggal Pesan']).toLocaleString('id-ID') : '-';
    const kode = o['Kode Redeem'] || o.kodeRedeem || '—';
    const harga = Number(o.harga || o.Harga || o.Jumlah || 0);

    return `
      <tr>
        <td><span class="badge-code">${idOrder}</span></td>
        <td style="font-size: 0.8125rem;">${tgl}</td>
        <td>
          <div style="font-weight: 700;">${o['Nama Customer'] || o.customer || '-'}</div>
          <div style="font-size: 0.75rem; color: var(--text-tertiary);">${o['Kontak Customer'] || o.kontak || '-'}</div>
        </td>
        <td style="font-weight: 500;">${o.namaProduk || o['Nama Produk'] || o['ID Produk'] || '-'}</td>
        <td style="font-family: 'Sora', sans-serif; font-weight: 700; color: var(--primary-indigo);">Rp ${harga.toLocaleString('id-ID')}</td>
        <td>
          <span class="badge badge-${isVerified ? 'success' : isWaiting ? 'pending' : 'danger'}">
            <span class="badge-dot"></span>
            ${status}
          </span>
        </td>
        <td>
          <div style="display: flex; align-items: center; gap: 0.35rem;">
            <span class="badge-code" style="font-size: 0.75rem;">${kode}</span>
            ${isVerified && kode !== '—' ? `
              <button type="button" class="btn btn-secondary btn-sm" style="padding: 0.15rem 0.4rem;" onclick="navigator.clipboard.writeText('${kode}'); alert('Kode redeem disalin!');">
                <span class="material-symbols-outlined" style="font-size: 14px;">content_copy</span>
              </button>
            ` : ''}
          </div>
        </td>
        <td style="text-align: right;">
          ${isWaiting ? `
            <button type="button" class="btn btn-primary btn-sm" onclick="openVerificationWorkspace('${idOrder}')">
              Review & Verify ⚡
            </button>
          ` : `
            <span style="font-size: 0.75rem; color: var(--text-tertiary);">Fulfillment Selesai</span>
          `}
        </td>
      </tr>
    `;
  }).join('');

  // Status pills filter
  document.querySelectorAll('[data-order-status]').forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll('[data-order-status]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentOrderStatusFilter = btn.dataset.orderStatus;
      renderFilteredOrdersTable();
    };
  });
}

function openVerificationWorkspace(orderId) {
  const order = loadedAdminOrders.find(o => (o['ID Pesanan'] || o.id) === orderId);
  if (!order) return;

  const workspace = document.getElementById('orderVerificationWorkspace');
  if (!workspace) return;

  workspace.style.display = 'block';
  workspace.scrollIntoView({ behavior: 'smooth' });

  const idOrder = order['ID Pesanan'] || order.id;
  const harga = Number(order.harga || order.Harga || order.Jumlah || 0);

  document.getElementById('workTrxId').textContent = idOrder;
  document.getElementById('workNominal').textContent = 'Rp ' + harga.toLocaleString('id-ID');
  document.getElementById('workCustomer').textContent = order['Nama Customer'] || order.customer || '-';

  // Preview key
  const randKey = 'RED-' + (order.namaProduk || 'DIGITAL').slice(0, 4).toUpperCase().replace(/[^A-Z]/g, 'X') + '-' + Math.floor(1000 + Math.random() * 9000) + '-XP';
  document.getElementById('workKeyPreview').textContent = randKey;

  // Confirm Verification Handler
  document.getElementById('btnConfirmVerification').onclick = async () => {
    try {
      await adminApiCall('verifyPesanan', { idPesanan: idOrder, status: 'Terverifikasi' });
      alert(`Pesanan #${idOrder} Berhasil Diverifikasi!\nKode Redeem unik otomatis diterbitkan dan tersimpan di Google Sheets.`);
      workspace.style.display = 'none';
      renderOrdersTab();
      renderOverviewTab();
    } catch (e) {
      alert('Gagal memverifikasi pesanan: ' + e.message);
    }
  };

  // Reject Handler
  document.getElementById('btnRejectOrder').onclick = async () => {
    if (!confirm(`Batalkan pesanan #${idOrder}?`)) return;
    try {
      await adminApiCall('verifyPesanan', { idPesanan: idOrder, status: 'Dibatalkan' });
      alert(`Pesanan #${idOrder} Dibatalkan.`);
      workspace.style.display = 'none';
      renderOrdersTab();
      renderOverviewTab();
    } catch (e) {
      alert('Gagal membatalkan pesanan: ' + e.message);
    }
  };
}

function closeWorkspace() {
  const workspace = document.getElementById('orderVerificationWorkspace');
  if (workspace) workspace.style.display = 'none';
}

// ==========================================================================
// 5. TAB 4: TESTIMONIALS MODERATION
// ==========================================================================
async function renderTestimonialsTab() {
  const container = document.getElementById('testimoniModerationList');
  if (!container) return;

  container.innerHTML = `
    <div style="text-align: center; padding: 2.5rem; color: var(--text-tertiary);">
      <span class="material-symbols-outlined" style="animation: spin 1s infinite linear;">sync</span> Memuat daftar ulasan...
    </div>`;

  try {
    const reviews = await adminApiCall('getSemuaTestimoni');
    loadedAdminReviews = Array.isArray(reviews) ? reviews : [];

    const badgeSidebar = document.getElementById('sidebarReviewCount');
    const pendingCount = loadedAdminReviews.filter(r => (r.Status || r.status) === 'Menunggu Moderasi').length;
    const approvedCount = loadedAdminReviews.filter(r => (r.Status || r.status) === 'Disetujui').length;
    const rejectedCount = loadedAdminReviews.filter(r => (r.Status || r.status) === 'Ditolak').length;

    if (badgeSidebar) badgeSidebar.textContent = `${pendingCount} Baru`;

    // Update KPI stats
    const revPendingEl = document.getElementById('revPendingCount');
    const revApprovedEl = document.getElementById('revApprovedCount');
    const revRejectedEl = document.getElementById('revRejectedCount');
    const revAvgRatingEl = document.getElementById('revAvgRating');
    const revTotalTextEl = document.getElementById('revTotalText');

    if (revPendingEl) revPendingEl.textContent = pendingCount;
    if (revApprovedEl) revApprovedEl.textContent = approvedCount;
    if (revRejectedEl) revRejectedEl.textContent = rejectedCount;

    if (approvedCount > 0) {
      const sumRating = loadedAdminReviews
        .filter(r => (r.Status || r.status) === 'Disetujui')
        .reduce((acc, r) => acc + Number(r.Rating || r.rating || 5), 0);
      const avg = (sumRating / approvedCount).toFixed(1);
      if (revAvgRatingEl) revAvgRatingEl.textContent = `${avg} / 5.0`;
      if (revTotalTextEl) revTotalTextEl.textContent = `★`.repeat(Math.round(avg)) + ` (${approvedCount} Tayang)`;
    } else {
      if (revAvgRatingEl) revAvgRatingEl.textContent = '-';
      if (revTotalTextEl) revTotalTextEl.textContent = 'Belum ada rating ulasan';
    }

    if (loadedAdminReviews.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 4rem 1.5rem; background: #ffffff; border: 1px dashed var(--border-subtle); border-radius: var(--radius-xl); color: var(--text-secondary);">
          <div style="width: 56px; height: 56px; border-radius: 50%; background: var(--surface-container); display: inline-flex; align-items: center; justify-content: center; margin-bottom: 1rem; color: var(--primary-indigo);">
            <span class="material-symbols-outlined" style="font-size: 28px;">chat_bubble_outline</span>
          </div>
          <h4 style="font-size: 1.15rem; font-weight: 700; color: var(--text-primary); margin-bottom: 0.35rem;">Belum Ada Ulasan Pembeli</h4>
          <p style="font-size: 0.875rem;">
            Ulasan yang dikirimkan oleh pembeli melalui halaman ulasan publik akan muncul di sini untuk Anda moderasi (Setujui / Tolak).
          </p>
        </div>`;
      return;
    }

    container.innerHTML = loadedAdminReviews.map(r => {
      const idRev = r['ID Testimoni'] || r.id;
      const status = r.Status || r.status || 'Menunggu Moderasi';
      const isPending = status === 'Menunggu Moderasi';
      const nama = r['Nama Customer'] || r.nama || 'Customer';
      const teks = r['Isi Testimoni'] || r.teks || '';
      const email = r['Email Customer'] || r.email || '-';
      const rating = Number(r.Rating || r.rating || 5);
      const idProduk = r['ID Produk'] || r.produk || '-';

      return `
        <div style="background: #ffffff; border: 1px solid var(--border-subtle); border-radius: var(--radius-xl); padding: 1.5rem; box-shadow: var(--shadow-sm); display: flex; flex-direction: column; gap: 1rem;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 0.5rem;">
            <div style="display: flex; align-items: center; gap: 0.75rem;">
              <div style="width: 40px; height: 40px; border-radius: 50%; background: var(--surface-container); color: var(--primary-indigo); display: flex; align-items: center; justify-content: center; font-weight: 700;">
                ${nama.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                  <strong style="font-size: 0.95rem;">${nama}</strong>
                  <span style="font-size: 0.75rem; color: var(--text-tertiary);">Produk: ${idProduk}</span>
                </div>
                <div style="display: flex; align-items: center; gap: 0.5rem; margin-top: 0.2rem; font-size: 0.8125rem; color: var(--text-secondary);">
                  <span style="color: #f59e0b;">${'★'.repeat(rating)}${'☆'.repeat(5 - rating)} (${rating}.0)</span>
                </div>
              </div>
            </div>

            <div>
              <span class="badge badge-${isPending ? 'pending' : status === 'Disetujui' ? 'success' : 'danger'}">
                ${status}
              </span>
            </div>
          </div>

          <div style="background: var(--surface-subtle); border-radius: var(--radius-md); padding: 1rem; font-size: 0.875rem; line-height: 1.55; color: var(--text-primary); font-style: italic;">
            "${teks}"
          </div>

          <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.75rem; color: var(--text-tertiary);">
            <div>Email: <code>${email}</code></div>
            <div style="display: flex; gap: 0.5rem;">
              ${isPending ? `
                <button type="button" class="btn btn-success btn-sm" onclick="moderateReviewAction('${idRev}', 'Disetujui')">
                  <span class="material-symbols-outlined" style="font-size: 14px;">check</span> Setujui & Publikasikan
                </button>
                <button type="button" class="btn btn-danger btn-sm" onclick="moderateReviewAction('${idRev}', 'Ditolak')">
                  <span class="material-symbols-outlined" style="font-size: 14px;">close</span> Tolak
                </button>
              ` : `
                <button type="button" class="btn btn-secondary btn-sm" onclick="moderateReviewAction('${idRev}', '${status === 'Disetujui' ? 'Ditolak' : 'Disetujui'}')">
                  Ubah Status
                </button>
              `}
            </div>
          </div>
        </div>
      `;
    }).join('');

  } catch (err) {
    container.innerHTML = `
      <div style="text-align: center; padding: 2.5rem; color: var(--text-danger);">
        Gagal memuat ulasan: ${err.message}
      </div>`;
  }
}

async function moderateReviewAction(id, newStatus) {
  try {
    await adminApiCall('moderateTestimoni', { idTestimoni: id, status: newStatus });
    alert(`Status ulasan berhasil diubah menjadi: ${newStatus}`);
    renderTestimonialsTab();
  } catch (err) {
    alert('Gagal memperbarui status ulasan: ' + err.message);
  }
}

// ==========================================================================
// 6. TAB 5: REPORTS & ANALYTICS
// ==========================================================================
async function renderReportsTab() {
  const tbody = document.getElementById('reportsTransactionTable');
  if (!tbody) return;

  if (loadedAdminOrders.length === 0) {
    try {
      const orders = await adminApiCall('getPesanan');
      loadedAdminOrders = Array.isArray(orders) ? orders : [];
    } catch (e) { }
  }

  // Update telemetry metrics
  const totalRev = loadedAdminOrders
    .filter(o => (o['Status Pembayaran'] || o.status) === 'Terverifikasi')
    .reduce((acc, o) => acc + Number(o.harga || o.Harga || o.Jumlah || 0), 0);
  const successCount = loadedAdminOrders.filter(o => (o['Status Pembayaran'] || o.status) === 'Terverifikasi').length;
  const aov = successCount > 0 ? Math.round(totalRev / successCount) : 0;

  const grossRevEl = document.getElementById('repGrossRev');
  const avgOrderEl = document.getElementById('repAvgOrder');
  const convRateEl = document.getElementById('repConvRate');
  const totalVisitsEl = document.getElementById('repTotalVisits');

  if (grossRevEl) grossRevEl.textContent = 'Rp ' + totalRev.toLocaleString('id-ID');
  if (avgOrderEl) avgOrderEl.textContent = 'Rp ' + aov.toLocaleString('id-ID');
  if (convRateEl) convRateEl.textContent = loadedAdminOrders.length > 0 ? `${((successCount / loadedAdminOrders.length) * 100).toFixed(1)}%` : '0%';
  if (totalVisitsEl) {
    const stats = await adminApiCall('getDashboardStats').catch(() => null);
    totalVisitsEl.textContent = stats?.totalVisits || stats?.todayVisits || 0;
  }

  if (loadedAdminOrders.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align: center; padding: 3rem 1rem; color: var(--text-tertiary);">
          <span class="material-symbols-outlined" style="font-size: 2.5rem; color: var(--text-muted); display: block; margin-bottom: 0.5rem;">bar_chart</span>
          <div style="font-weight: 600; color: var(--text-secondary);">Belum ada data transaksi penjualan untuk dianalisis</div>
        </td>
      </tr>`;
    return;
  }

  tbody.innerHTML = loadedAdminOrders.map(o => {
    const idOrder = o['ID Pesanan'] || o.id;
    const tgl = o['Tanggal Pesan'] ? new Date(o['Tanggal Pesan']).toLocaleString('id-ID') : '-';
    const status = o['Status Pembayaran'] || o.status || 'Menunggu';
    const isVerified = status === 'Terverifikasi';
    const isWaiting = status === 'Menunggu';
    const harga = Number(o.harga || o.Harga || o.Jumlah || 0);

    return `
      <tr>
        <td><span class="badge-code">${idOrder}</span></td>
        <td style="font-size: 0.8125rem;">${tgl}</td>
        <td>
          <div style="font-weight: 600;">${o['Nama Customer'] || o.customer || '-'}</div>
          <div style="font-size: 0.75rem; color: var(--text-tertiary);">${o['Kontak Customer'] || o.kontak || '-'}</div>
        </td>
        <td>${o.namaProduk || o['Nama Produk'] || o['ID Produk'] || '-'}</td>
        <td style="font-family: 'Sora', sans-serif; font-weight: 700;">Rp ${harga.toLocaleString('id-ID')}</td>
        <td><span class="badge badge-${isVerified ? 'success' : isWaiting ? 'pending' : 'danger'}">${status}</span></td>
        <td><span class="badge-code" style="font-size: 0.75rem;">${o['Kode Redeem'] || '—'}</span></td>
      </tr>
    `;
  }).join('');
}

// ==========================================================================
// 7. PRODUCT ADD / EDIT MODAL
// ==========================================================================
function setupProductModalEvents() {
  const modal = document.getElementById('productModal');
  const form = document.getElementById('productForm');

  document.getElementById('btnCloseProductModal')?.addEventListener('click', () => modal.style.display = 'none');
  document.getElementById('btnCancelProductModal')?.addEventListener('click', () => modal.style.display = 'none');

  // Live preview sync
  const prodNameInput = document.getElementById('prodName');
  const prodHargaInput = document.getElementById('prodHarga');
  const prodCatInput = document.getElementById('prodKategori');
  const prodThumbInput = document.getElementById('prodThumbnail');
  const previewImg = document.getElementById('livePreviewImg');
  const previewNoImg = document.getElementById('livePreviewNoImg');

  if (prodNameInput) {
    prodNameInput.addEventListener('input', () => {
      document.getElementById('livePreviewTitle').textContent = prodNameInput.value || 'Nama Produk Baru';
    });
  }
  if (prodHargaInput) {
    prodHargaInput.addEventListener('input', () => {
      const val = Number(prodHargaInput.value) || 0;
      document.getElementById('livePreviewPrice').textContent = 'Rp ' + val.toLocaleString('id-ID');
    });
  }
  if (prodCatInput) {
    prodCatInput.addEventListener('input', () => {
      document.getElementById('livePreviewCat').textContent = prodCatInput.value || 'Kategori';
    });
  }
  if (prodThumbInput) {
    prodThumbInput.addEventListener('input', () => {
      const val = prodThumbInput.value.trim();
      if (val) {
        if (previewImg) { previewImg.src = val; previewImg.style.display = 'block'; }
        if (previewNoImg) previewNoImg.style.display = 'none';
      } else {
        if (previewImg) previewImg.style.display = 'none';
        if (previewNoImg) previewNoImg.style.display = 'block';
      }
    });
  }

  // Submit product
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const editId = document.getElementById('editProductId').value;
      const btn = form.querySelector('button[type="submit"]');
      const originalText = btn.innerHTML;
      btn.disabled = true;
      btn.innerHTML = `<span class="material-symbols-outlined" style="animation: spin 1s infinite linear;">sync</span> Menyimpan...`;

      try {
        if (editId) {
          await adminApiCall('editProduk', {
            idProduk: editId,
            nama: prodNameInput.value.trim(),
            harga: Number(prodHargaInput.value),
            kategori: prodCatInput.value.trim(),
            thumbnail: prodThumbInput.value.trim(),
            linkProduk: document.getElementById('prodLink').value.trim(),
            deskripsi: document.getElementById('prodDesc').value.trim(),
            status: document.getElementById('prodStatus').value
          });
          alert('Produk berhasil diperbarui di Google Sheets!');
        } else {
          await adminApiCall('addProduk', {
            nama: prodNameInput.value.trim(),
            harga: Number(prodHargaInput.value),
            kategori: prodCatInput.value.trim(),
            thumbnail: prodThumbInput.value.trim(),
            linkProduk: document.getElementById('prodLink').value.trim(),
            deskripsi: document.getElementById('prodDesc').value.trim(),
            status: document.getElementById('prodStatus').value
          });
          alert('Produk baru berhasil ditambahkan ke katalog!');
        }

        modal.style.display = 'none';
        renderProductsTab();
        renderOverviewTab();
      } catch (err) {
        alert('Gagal menyimpan produk: ' + err.message);
      } finally {
        btn.disabled = false;
        btn.innerHTML = originalText;
      }
    });
  }
}

function openAddProductModal() {
  const modal = document.getElementById('productModal');
  document.getElementById('modalProductTitle').textContent = 'Buat Produk Digital Baru';
  document.getElementById('editProductId').value = '';
  document.getElementById('prodName').value = '';
  document.getElementById('prodHarga').value = '';
  document.getElementById('prodSKU').value = '';
  document.getElementById('prodDesc').value = '';
  document.getElementById('prodThumbnail').value = '';
  document.getElementById('prodLink').value = '';
  document.getElementById('prodKategori').value = '';

  document.getElementById('livePreviewTitle').textContent = 'Nama Produk Baru';
  document.getElementById('livePreviewPrice').textContent = 'Rp 0';
  document.getElementById('livePreviewCat').textContent = 'Kategori';
  const previewImg = document.getElementById('livePreviewImg');
  const previewNoImg = document.getElementById('livePreviewNoImg');
  if (previewImg) previewImg.style.display = 'none';
  if (previewNoImg) previewNoImg.style.display = 'block';

  modal.style.display = 'flex';
}

function editProductModal(id) {
  const p = loadedAdminProducts.find(item => (item['ID Produk'] || item.id) === id);
  if (!p) return;

  const modal = document.getElementById('productModal');
  const pName = p['Nama Produk'] || p.nama;
  const pHarga = Number(p.Harga || p.harga || 0);
  const pCat = p.Kategori || p.kategori || '';
  const pStatus = p.Status || p.status || 'Aktif';
  const pThumb = p.Thumbnail || p.thumbnail || '';
  const pLink = p['Link Produk'] || p.link || '';
  const pDesc = p.Deskripsi || p.deskripsi || p.desc || '';

  document.getElementById('modalProductTitle').textContent = 'Edit Produk: ' + pName;
  document.getElementById('editProductId').value = id;
  document.getElementById('prodName').value = pName;
  document.getElementById('prodHarga').value = pHarga;
  document.getElementById('prodSKU').value = id;
  document.getElementById('prodDesc').value = pDesc;
  document.getElementById('prodKategori').value = pCat;
  document.getElementById('prodStatus').value = pStatus;
  document.getElementById('prodThumbnail').value = pThumb;
  document.getElementById('prodLink').value = pLink;

  document.getElementById('livePreviewTitle').textContent = pName;
  document.getElementById('livePreviewPrice').textContent = 'Rp ' + pHarga.toLocaleString('id-ID');
  document.getElementById('livePreviewCat').textContent = pCat || 'Kategori';
  const previewImg = document.getElementById('livePreviewImg');
  const previewNoImg = document.getElementById('livePreviewNoImg');
  if (pThumb) {
    if (previewImg) { previewImg.src = pThumb; previewImg.style.display = 'block'; }
    if (previewNoImg) previewNoImg.style.display = 'none';
  } else {
    if (previewImg) previewImg.style.display = 'none';
    if (previewNoImg) previewNoImg.style.display = 'block';
  }

  modal.style.display = 'flex';
}
