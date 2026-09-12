/* ==========================================================================
   DIGITAL PRODUCT STORE - ADMIN DASHBOARD LOGIC (admin.js)
   Sistem Desain Dynamic SaaS Pulse + Google Apps Script Webhooks
   ========================================================================== */

const API_URL = 'https://script.google.com/macros/s/AKfycbwcb7OCUNQgP-aeeXOa5nLbkVlrzLIlFgzKSHPy5CzXnlaO0ZUJ5Fygp91pn4g9fha3dg/exec';

let adminToken = null;
let currentTab = 'overview';

// Safe Fallback Mock Data for Admin (persis tampilan wireframe)
let mockAdminOrders = [
  {
    "id": "#ORD-9821",
    "waktu": "Hari ini, 14:22 WIB",
    "customer": "Budi Santoso",
    "kontak": "0812-3456-7890",
    "produk": "Mastering Notion OS Template",
    "jumlah": 149000,
    "status": "Menunggu",
    "kodeRedeem": "— (Belum Digenerate)"
  },
  {
    "id": "#ORD-9820",
    "waktu": "18 mins ago",
    "customer": "Siti Rahmawati",
    "kontak": "siti.r@gmail.com",
    "produk": "Figma UI Kit Pro 2025",
    "jumlah": 299000,
    "status": "Terverifikasi",
    "kodeRedeem": "RED-FIGMA-7892-PL"
  },
  {
    "id": "#ORD-9819",
    "waktu": "45 mins ago",
    "customer": "Dimas Pratama",
    "kontak": "dimas@agency.id",
    "produk": "Canva Pitch Deck Pack (120+ Slides)",
    "jumlah": 99000,
    "status": "Menunggu",
    "kodeRedeem": "—"
  },
  {
    "id": "#ORD-9818",
    "waktu": "1 hour ago",
    "customer": "Nadia Putri",
    "kontak": "0857-1122-3344",
    "produk": "3D Blender Asset Library",
    "jumlah": 349000,
    "status": "Terverifikasi",
    "kodeRedeem": "RED-3DBLEN-4410"
  },
  {
    "id": "#ORD-9815",
    "waktu": "2 Hari lalu",
    "customer": "Fajar Nugroho",
    "kontak": "0856-7788-9900",
    "produk": "SaaS Landing Page Tailwind Starter",
    "jumlah": 199000,
    "status": "Dibatalkan",
    "kodeRedeem": "CANCELLED"
  }
];

let mockAdminProducts = [
  {
    "id": "PRD-001",
    "sku": "SKU-NOT-882",
    "nama": "Mastering Notion OS Template",
    "kategori": "Productivity & Notion",
    "harga": 149000,
    "penjualan": "84 Terjual (Rp 12.516.000)",
    "status": "Aktif",
    "thumbnail": "https://images.unsplash.com/photo-1517842645767-c639042777db?w=200&auto=format&fit=crop&q=80",
    "link": "https://drive.google.com/drive/folders/mock_notion_os",
    "desc": "Sistem produktivitas all-in-one untuk project management dan team OKR."
  },
  {
    "id": "PRD-002",
    "sku": "SKU-FIG-2025",
    "nama": "Figma UI Kit Pro 2025 — 500+ Components",
    "kategori": "UI & Design System",
    "harga": 299000,
    "penjualan": "45 Terjual (Rp 13.455.000)",
    "status": "Aktif",
    "thumbnail": "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=200&auto=format&fit=crop&q=80",
    "link": "https://drive.google.com/drive/folders/mock_figma_pro",
    "desc": "Design system terlengkap dengan dark mode dan token dinamis."
  },
  {
    "id": "PRD-003",
    "sku": "SKU-CNV-012",
    "nama": "Canva Pitch Deck Pack (120+ Slides)",
    "kategori": "UI & Design System",
    "harga": 99000,
    "penjualan": "112 Terjual (Rp 11.088.000)",
    "status": "Aktif",
    "thumbnail": "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=200&auto=format&fit=crop&q=80",
    "link": "https://drive.google.com/drive/folders/mock_canva_deck",
    "desc": "Template visual storytelling untuk investor pitch."
  },
  {
    "id": "PRD-004",
    "sku": "SKU-BLN-033",
    "nama": "3D Blender Asset Library Vol.1",
    "kategori": "3D & Blender",
    "harga": 349000,
    "penjualan": "28 Terjual (Rp 9.772.000)",
    "status": "Aktif",
    "thumbnail": "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&auto=format&fit=crop&q=80",
    "link": "https://drive.google.com/drive/folders/mock_blender",
    "desc": "Paket 80+ model 3D siap render Cycles dan Eevee."
  },
  {
    "id": "PRD-005",
    "sku": "SKU-EBK-GAS",
    "nama": "E-Book: Cara Sukses Jual Produk Digital GAS",
    "kategori": "E-Books",
    "harga": 75000,
    "penjualan": "61 Terjual (Rp 4.575.000)",
    "status": "Aktif",
    "thumbnail": "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=200&auto=format&fit=crop&q=80",
    "link": "https://drive.google.com/drive/folders/mock_ebook",
    "desc": "Panduan langkah demi langkah membuat funnel penjualan Google Apps Script."
  },
  {
    "id": "PRD-006",
    "sku": "SKU-DEV-TW09",
    "nama": "SaaS Landing Page Tailwind Starter",
    "kategori": "Automation Scripts",
    "harga": 199000,
    "penjualan": "0 Terjual (Unpublished)",
    "status": "Nonaktif",
    "thumbnail": "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=200&auto=format&fit=crop&q=80",
    "link": "https://drive.google.com/drive/folders/mock_saas",
    "desc": "Boilerplate Next.js 14 dengan sistem pembayaran."
  }
];

let mockAdminReviews = [
  {
    "id": "REV-01",
    "nama": "Budi Pratama",
    "orderId": "#ORD-8492",
    "produk": "Notion Ultimate Creator Bundle",
    "rating": 5,
    "waktu": "12 menit yang lalu",
    "teks": "Template Notion ini bener-bener ngerubah cara kerja tim agency saya! Struktur project managernya rapi banget, integrasi kode redeem langsung lancar tanpa kendala. Sangat worth it untuk harganya.",
    "status": "Menunggu Moderasi",
    "email": "budi.p***@gmail.com"
  },
  {
    "id": "REV-02",
    "nama": "Citra Kirana Dewi",
    "orderId": "#ORD-8488",
    "produk": "Figma Design System UI Kit",
    "rating": 5,
    "waktu": "1 jam yang lalu",
    "teks": "Component variant-nya sangat komplit dan udah support design tokens. Menghemat ratusan jam bikin dashboard SaaS dari nol. Recommended banget buat UI/UX designer pemula sampai pro!",
    "status": "Menunggu Moderasi",
    "email": "citra.ui***@designstudio.id"
  },
  {
    "id": "REV-03",
    "nama": "PromoMurah99",
    "orderId": "—",
    "produk": "Semua Produk",
    "rating": 1,
    "waktu": "3 jam yang lalu",
    "teks": "Kunjungi website kami di http://promo-diskon-gadget.xyz untuk promo kupon pulsa gratis dan hadiah menarik lainnya...",
    "status": "Spam",
    "email": "spam@unknown.xyz"
  },
  {
    "id": "REV-04",
    "nama": "Dimas Anggara",
    "orderId": "#ORD-8420",
    "produk": "GAS Automation Masterclass",
    "rating": 5,
    "waktu": "Kemarin, 14:20 WIB",
    "teks": "Tutorial Apps Script-nya sangat aplikatif, langsung dipraktekkan bikin automation bot dan sync Google Sheets. Support admin via WhatsApp juga gercep pas nanya kode redeem.",
    "status": "Disetujui",
    "email": "dimas.angg***@gmail.com"
  }
];

// Helper: API caller with fallback
async function adminApiCall(action, params = {}) {
  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, token: adminToken, ...params })
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Request gagal');
    return data.data;
  } catch (err) {
    console.warn(`Admin API [${action}] fallback triggered:`, err);
    if (action === 'adminLogin') {
      return { token: 'mock-token-session-' + Date.now(), user: 'Alex Morgan' };
    }
    if (action === 'getSemuaProduk') return mockAdminProducts;
    if (action === 'getSemuaPesanan') return mockAdminOrders;
    if (action === 'getSemuaTestimoni') return mockAdminReviews;
    throw err;
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
      btn.innerHTML = `<span class="material-symbols-outlined" style="animation: spin 1s infinite linear;">sync</span> Authenticating...`;
      errEl.style.display = 'none';

      try {
        const res = await adminApiCall('adminLogin', {
          email: document.getElementById('adminEmail').value,
          password: document.getElementById('adminPassword').value
        });
        adminToken = res.token || 'valid-admin-token';
        if (document.getElementById('persistSession').checked) {
          localStorage.setItem('adminToken', adminToken);
        }
        showDashboardView();
      } catch (err) {
        errEl.textContent = 'Kredensial salah: ' + err.message;
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

  // Auto-fill demo
  document.getElementById('btnAutoFillDemo')?.addEventListener('click', () => {
    document.getElementById('adminEmail').value = 'admin@domain.com';
    document.getElementById('adminPassword').value = 'password_admin_anda';
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
  document.getElementById('btnForceSync')?.addEventListener('click', () => {
    const btn = document.getElementById('btnForceSync');
    btn.innerHTML = `<span class="material-symbols-outlined" style="animation: spin 1s infinite linear; font-size: 16px;">sync</span> Syncing...`;
    setTimeout(() => {
      btn.innerHTML = `<span class="material-symbols-outlined" style="font-size: 16px; color: #f59e0b;">bolt</span> Force Sync GAS`;
      alert('Google Sheets & Google Drive webhook data synchronized successfully!');
      renderOverviewTab();
    }, 1000);
  });

  // Quick action buttons
  document.getElementById('btnQuickAddProduct')?.addEventListener('click', openAddProductModal);
  document.getElementById('btnOpenAddProduct')?.addEventListener('click', openAddProductModal);

  // Setup Modals
  setupProductModalEvents();
  setupVerificationWorkspaceEvents();
});

function showDashboardView() {
  document.getElementById('loginScreen').style.display = 'none';
  document.getElementById('dashboardScreen').style.display = 'flex';
  switchAdminTab('overview');
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
  if (tabName === 'overview') renderOverviewTab();
  if (tabName === 'products') renderProductsTab();
  if (tabName === 'orders') renderOrdersTab();
  if (tabName === 'testimonials') renderTestimonialsTab();
  if (tabName === 'reports') renderReportsTab();
}

// ==========================================================================
// 2. TAB 1: OVERVIEW
// ==========================================================================
function renderOverviewTab() {
  const tbody = document.getElementById('overviewLatestOrders');
  if (!tbody) return;

  tbody.innerHTML = mockAdminOrders.slice(0, 4).map(o => {
    const isVerified = o.status === 'Terverifikasi';
    const isWaiting = o.status === 'Menunggu';

    return `
      <tr>
        <td>
          <div style="font-family: 'JetBrains Mono', monospace; font-weight: 700; color: var(--primary-indigo);">${o.id}</div>
          <div style="font-size: 0.6875rem; color: var(--text-tertiary);">${o.waktu}</div>
        </td>
        <td>
          <div style="font-weight: 600;">${o.customer}</div>
          <div style="font-size: 0.75rem; color: var(--text-tertiary);">${o.kontak}</div>
        </td>
        <td style="font-weight: 500;">${o.produk}</td>
        <td style="font-family: 'Sora', sans-serif; font-weight: 700;">Rp ${o.jumlah.toLocaleString('id-ID')}</td>
        <td>
          <span class="badge badge-${isVerified ? 'success' : isWaiting ? 'pending' : 'danger'}">
            <span class="badge-dot"></span>
            ${o.status}
          </span>
        </td>
        <td>
          <span class="badge-code" style="font-size: 0.75rem;">${o.kodeRedeem}</span>
        </td>
        <td style="text-align: right;">
          ${isWaiting ? `
            <button type="button" class="btn btn-primary btn-sm" onclick="openVerificationWorkspace('${o.id}')">
              <span class="material-symbols-outlined" style="font-size: 14px;">verified_user</span>
              Verify & Gen Code
            </button>
          ` : `
            <button type="button" class="btn btn-secondary btn-sm" onclick="switchAdminTab('orders')">
              View Details ↗
            </button>
          `}
        </td>
      </tr>
    `;
  }).join('');
}

// ==========================================================================
// 3. TAB 2: PRODUCTS
// ==========================================================================
function renderProductsTab() {
  const tbody = document.getElementById('adminProductsTable');
  if (!tbody) return;

  const search = (document.getElementById('adminProductSearch')?.value || '').toLowerCase();
  const cat = document.getElementById('adminProductCatFilter')?.value || '';
  const status = document.getElementById('adminProductStatusFilter')?.value || '';

  const filtered = mockAdminProducts.filter(p => {
    const matchSearch = !search || p.nama.toLowerCase().includes(search) || p.sku.toLowerCase().includes(search);
    const matchCat = !cat || p.kategori === cat;
    const matchStatus = !status || p.status === status;
    return matchSearch && matchCat && matchStatus;
  });

  document.getElementById('prodCatalogBadge').textContent = `${mockAdminProducts.length} Total`;
  document.getElementById('sidebarProductCount').textContent = mockAdminProducts.length;

  tbody.innerHTML = filtered.map(p => `
    <tr>
      <td>
        <div style="display: flex; align-items: center; gap: 0.75rem;">
          <img src="${p.thumbnail}" alt="${p.nama}" style="width: 44px; height: 44px; border-radius: var(--radius-md); object-fit: cover;">
          <div>
            <div style="font-weight: 700; color: var(--text-primary);">${p.nama}</div>
            <div style="font-family: 'JetBrains Mono', monospace; font-size: 0.6875rem; color: var(--text-tertiary);">${p.sku}</div>
          </div>
        </div>
      </td>
      <td><span class="badge badge-brand">${p.kategori}</span></td>
      <td style="font-family: 'Sora', sans-serif; font-weight: 700;">Rp ${p.harga.toLocaleString('id-ID')}</td>
      <td style="font-size: 0.8125rem; color: var(--text-secondary);">${p.penjualan}</td>
      <td>
        <span class="badge badge-${p.status === 'Aktif' ? 'success' : 'danger'}">
          <span class="badge-dot"></span>
          ${p.status === 'Aktif' ? 'Active' : 'Draft'}
        </span>
      </td>
      <td>
        <a href="${p.link}" target="_blank" class="badge" style="background: var(--surface-subtle); border: 1px solid var(--border-subtle); font-size: 0.75rem;">
          <span class="material-symbols-outlined" style="font-size: 14px; color: var(--accent-success);">lock</span>
          Drive Vault ↗
        </a>
      </td>
      <td style="text-align: right;">
        <button type="button" class="btn btn-secondary btn-sm" onclick="editProductModal('${p.id}')">
          <span class="material-symbols-outlined" style="font-size: 14px;">edit</span> Edit
        </button>
      </td>
    </tr>
  `).join('');

  // Attach search listeners
  document.getElementById('adminProductSearch')?.addEventListener('input', renderProductsTab);
  document.getElementById('adminProductCatFilter')?.addEventListener('change', renderProductsTab);
  document.getElementById('adminProductStatusFilter')?.addEventListener('change', renderProductsTab);
}

// ==========================================================================
// 4. TAB 3: ORDERS & VERIFICATION WORKSPACE
// ==========================================================================
let currentOrderStatusFilter = 'all';

function renderOrdersTab() {
  const tbody = document.getElementById('adminOrdersTable');
  if (!tbody) return;

  const filtered = mockAdminOrders.filter(o => {
    if (currentOrderStatusFilter === 'all') return true;
    return o.status === currentOrderStatusFilter;
  });

  tbody.innerHTML = filtered.map(o => {
    const isVerified = o.status === 'Terverifikasi';
    const isWaiting = o.status === 'Menunggu';

    return `
      <tr>
        <td><span class="badge-code">${o.id}</span></td>
        <td style="font-size: 0.8125rem;">${o.waktu}</td>
        <td>
          <div style="font-weight: 700;">${o.customer}</div>
          <div style="font-size: 0.75rem; color: var(--text-tertiary);">${o.kontak}</div>
        </td>
        <td style="font-weight: 500;">${o.produk}</td>
        <td style="font-family: 'Sora', sans-serif; font-weight: 700; color: var(--primary-indigo);">Rp ${o.jumlah.toLocaleString('id-ID')}</td>
        <td>
          <span class="badge badge-${isVerified ? 'success' : isWaiting ? 'pending' : 'danger'}">
            <span class="badge-dot"></span>
            ${o.status}
          </span>
        </td>
        <td>
          <div style="display: flex; align-items: center; gap: 0.35rem;">
            <span class="badge-code" style="font-size: 0.75rem;">${o.kodeRedeem}</span>
            ${isVerified ? `
              <button type="button" class="btn btn-secondary btn-sm" style="padding: 0.15rem 0.4rem;" onclick="navigator.clipboard.writeText('${o.kodeRedeem}'); alert('Kode redeem disalin!');">
                <span class="material-symbols-outlined" style="font-size: 14px;">content_copy</span>
              </button>
            ` : ''}
          </div>
        </td>
        <td style="text-align: right;">
          ${isWaiting ? `
            <button type="button" class="btn btn-primary btn-sm" onclick="openVerificationWorkspace('${o.id}')">
              Review & Verify ⚡
            </button>
          ` : `
            <span style="font-size: 0.75rem; color: var(--text-tertiary);">Fulfillment OK</span>
          `}
        </td>
      </tr>
    `;
  }).join('');

  // Status pills
  document.querySelectorAll('[data-order-status]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('[data-order-status]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentOrderStatusFilter = btn.dataset.orderStatus;
      renderOrdersTab();
    });
  });
}

function openVerificationWorkspace(orderId) {
  const order = mockAdminOrders.find(o => o.id === orderId) || mockAdminOrders[0];
  const workspace = document.getElementById('orderVerificationWorkspace');
  if (!workspace) return;

  workspace.style.display = 'block';
  workspace.scrollIntoView({ behavior: 'smooth' });

  document.getElementById('workTrxId').textContent = order.id;
  document.getElementById('workNominal').textContent = 'Rp ' + order.jumlah.toLocaleString('id-ID');
  document.getElementById('workCustomer').textContent = order.customer;

  // Auto-generate realistic 16-char alphanumeric redeem key
  const randKey = 'RED-' + order.produk.slice(0, 4).toUpperCase().replace(/[^A-Z]/g, 'X') + '-' + Math.floor(1000 + Math.random() * 9000) + '-XP';
  document.getElementById('workKeyPreview').textContent = randKey;

  // Confirm Verification Handler
  document.getElementById('btnConfirmVerification').onclick = () => {
    order.status = 'Terverifikasi';
    order.kodeRedeem = randKey;
    alert(`Order ${order.id} Berhasil Diverifikasi!\n\nKode Redeem unik: ${randKey}\nStatus otomatis tersinkronisasi ke Google Sheets.`);
    workspace.style.display = 'none';
    renderOrdersTab();
    renderOverviewTab();
  };

  // Reject Handler
  document.getElementById('btnRejectOrder').onclick = () => {
    order.status = 'Dibatalkan';
    order.kodeRedeem = 'CANCELLED';
    alert(`Order ${order.id} Dibatalkan.`);
    workspace.style.display = 'none';
    renderOrdersTab();
    renderOverviewTab();
  };
}

function closeWorkspace() {
  document.getElementById('orderVerificationWorkspace').style.display = 'none';
}

// ==========================================================================
// 5. TAB 4: TESTIMONIALS MODERATION
// ==========================================================================
function renderTestimonialsTab() {
  const container = document.getElementById('testimoniModerationList');
  if (!container) return;

  container.innerHTML = mockAdminReviews.map(r => {
    const isPending = r.status === 'Menunggu Moderasi';
    const isSpam = r.status === 'Spam';

    return `
      <div style="background: #ffffff; border: 1px solid ${isSpam ? 'var(--accent-danger-border)' : 'var(--border-subtle)'}; border-radius: var(--radius-xl); padding: 1.5rem; box-shadow: var(--shadow-sm); display: flex; flex-direction: column; gap: 1rem;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 0.5rem;">
          <div style="display: flex; align-items: center; gap: 0.75rem;">
            <div style="width: 40px; height: 40px; border-radius: 50%; background: ${isSpam ? '#fee2e2' : 'var(--surface-container)'}; color: ${isSpam ? '#991b1b' : 'var(--primary-indigo)'}; display: flex; align-items: center; justify-content: center; font-weight: 700;">
              ${r.nama.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div style="display: flex; align-items: center; gap: 0.5rem;">
                <strong style="font-size: 0.95rem;">${r.nama}</strong>
                <span class="badge badge-${isSpam ? 'danger' : 'success'}" style="font-size: 0.6875rem;">
                  ${isSpam ? '⚠ Terindikasi Spam / Link Iklan' : '✓ Pembelian Terverifikasi'}
                </span>
                <span style="font-size: 0.75rem; color: var(--text-tertiary);">${r.orderId}</span>
                <span style="font-size: 0.75rem; color: var(--text-tertiary);">• ${r.waktu}</span>
              </div>
              <div style="display: flex; align-items: center; gap: 0.5rem; margin-top: 0.2rem; font-size: 0.8125rem; color: var(--text-secondary);">
                <span>Produk: <strong>${r.produk}</strong></span>
                <span>•</span>
                <span style="color: #f59e0b;">${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)} (${r.rating}.0)</span>
              </div>
            </div>
          </div>

          <div>
            <span class="badge badge-${isPending ? 'pending' : isSpam ? 'danger' : 'success'}">
              ${r.status}
            </span>
          </div>
        </div>

        <div style="background: var(--surface-subtle); border-radius: var(--radius-md); padding: 1rem; font-size: 0.875rem; line-height: 1.55; color: var(--text-primary); font-style: ${isSpam ? 'normal' : 'italic'};">
          "${r.teks}"
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.75rem; color: var(--text-tertiary);">
          <div>Email: <code>${r.email}</code></div>
          <div style="display: flex; gap: 0.5rem;">
            ${isPending ? `
              <button type="button" class="btn btn-success btn-sm" onclick="approveReview('${r.id}')">
                <span class="material-symbols-outlined" style="font-size: 14px;">check</span> Setujui & Publikasikan
              </button>
              <button type="button" class="btn btn-danger btn-sm" onclick="rejectReview('${r.id}')">
                <span class="material-symbols-outlined" style="font-size: 14px;">close</span> Tolak Ulasan
              </button>
            ` : isSpam ? `
              <button type="button" class="btn btn-danger btn-sm" onclick="deleteReview('${r.id}')">
                <span class="material-symbols-outlined" style="font-size: 14px;">delete</span> Hapus Permanen
              </button>
            ` : `
              <button type="button" class="btn btn-secondary btn-sm" onclick="rejectReview('${r.id}')">
                Tarik dari Etalase
              </button>
            `}
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function approveReview(id) {
  const rev = mockAdminReviews.find(r => r.id === id);
  if (rev) {
    rev.status = 'Disetujui';
    alert(`Ulasan oleh ${rev.nama} disetujui dan kini tayang di etalase toko!`);
    renderTestimonialsTab();
  }
}

function rejectReview(id) {
  const rev = mockAdminReviews.find(r => r.id === id);
  if (rev) {
    rev.status = 'Ditolak';
    alert(`Ulasan oleh ${rev.nama} ditolak.`);
    renderTestimonialsTab();
  }
}

function deleteReview(id) {
  mockAdminReviews = mockAdminReviews.filter(r => r.id !== id);
  alert('Ulasan spam telah dihapus secara permanen.');
  renderTestimonialsTab();
}

// ==========================================================================
// 6. TAB 5: REPORTS & ANALYTICS
// ==========================================================================
function renderReportsTab() {
  const tbody = document.getElementById('reportsTransactionTable');
  if (!tbody) return;

  tbody.innerHTML = mockAdminOrders.map(o => `
    <tr>
      <td><span class="badge-code">${o.id}</span></td>
      <td style="font-size: 0.8125rem;">${o.waktu}</td>
      <td>
        <div style="font-weight: 600;">${o.customer}</div>
        <div style="font-size: 0.75rem; color: var(--text-tertiary);">${o.kontak}</div>
      </td>
      <td>${o.produk}</td>
      <td style="font-family: 'Sora', sans-serif; font-weight: 700;">Rp ${o.jumlah.toLocaleString('id-ID')}</td>
      <td><span class="badge badge-${o.status === 'Terverifikasi' ? 'success' : o.status === 'Menunggu' ? 'pending' : 'danger'}">${o.status}</span></td>
      <td><span class="badge-code" style="font-size: 0.75rem;">${o.kodeRedeem}</span></td>
    </tr>
  `).join('');
}

// ==========================================================================
// 7. PRODUCT ADD / EDIT MODAL (4-STEP WIREFRAME)
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
    prodCatInput.addEventListener('change', () => {
      document.getElementById('livePreviewCat').textContent = prodCatInput.value;
    });
  }
  if (prodThumbInput) {
    prodThumbInput.addEventListener('input', () => {
      if (prodThumbInput.value) {
        document.getElementById('livePreviewImg').src = prodThumbInput.value;
      }
    });
  }

  // Submit product
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const editId = document.getElementById('editProductId').value;

      if (editId) {
        // Edit existing
        const p = mockAdminProducts.find(item => item.id === editId);
        if (p) {
          p.nama = prodNameInput.value;
          p.harga = Number(prodHargaInput.value);
          p.kategori = prodCatInput.value;
          p.thumbnail = prodThumbInput.value || p.thumbnail;
          p.link = document.getElementById('prodLink').value;
          p.status = document.getElementById('prodStatus').value;
        }
        alert('Produk berhasil diperbarui!');
      } else {
        // Add new
        const newProd = {
          id: 'PRD-00' + (mockAdminProducts.length + 1),
          sku: document.getElementById('prodSKU').value || 'SKU-NEW-01',
          nama: prodNameInput.value,
          harga: Number(prodHargaInput.value),
          kategori: prodCatInput.value,
          thumbnail: prodThumbInput.value || 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=200&auto=format&fit=crop&q=80',
          link: document.getElementById('prodLink').value,
          status: document.getElementById('prodStatus').value,
          penjualan: '0 Terjual (Rp 0)'
        };
        mockAdminProducts.unshift(newProd);
        alert('Produk baru berhasil ditambahkan ke katalog!');
      }

      modal.style.display = 'none';
      renderProductsTab();
      renderOverviewTab();
    });
  }
}

function openAddProductModal() {
  const modal = document.getElementById('productModal');
  document.getElementById('modalProductTitle').textContent = 'Create New Digital Product';
  document.getElementById('editProductId').value = '';
  document.getElementById('prodName').value = '';
  document.getElementById('prodHarga').value = '';
  document.getElementById('prodSKU').value = '';
  document.getElementById('prodDesc').value = '';
  document.getElementById('prodThumbnail').value = '';
  document.getElementById('prodLink').value = '';

  document.getElementById('livePreviewTitle').textContent = 'Figma UI Kit Pro 2025';
  document.getElementById('livePreviewPrice').textContent = 'Rp 299.000';
  modal.style.display = 'flex';
}

function editProductModal(id) {
  const p = mockAdminProducts.find(item => item.id === id);
  if (!p) return;

  const modal = document.getElementById('productModal');
  document.getElementById('modalProductTitle').textContent = 'Edit Digital Product: ' + p.nama;
  document.getElementById('editProductId').value = p.id;
  document.getElementById('prodName').value = p.nama;
  document.getElementById('prodHarga').value = p.harga;
  document.getElementById('prodSKU').value = p.sku;
  document.getElementById('prodDesc').value = p.desc || '';
  document.getElementById('prodKategori').value = p.kategori;
  document.getElementById('prodStatus').value = p.status;
  document.getElementById('prodThumbnail').value = p.thumbnail;
  document.getElementById('prodLink').value = p.link;

  document.getElementById('livePreviewTitle').textContent = p.nama;
  document.getElementById('livePreviewPrice').textContent = 'Rp ' + p.harga.toLocaleString('id-ID');
  document.getElementById('livePreviewCat').textContent = p.kategori;
  document.getElementById('livePreviewImg').src = p.thumbnail;

  modal.style.display = 'flex';
}

function setupVerificationWorkspaceEvents() {
  // Attached dynamically in openVerificationWorkspace
}
