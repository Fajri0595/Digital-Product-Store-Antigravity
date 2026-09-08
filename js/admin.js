const API_URL = 'https://script.google.com/macros/s/AKfycbxpYgerNhagkCi3ya7ERck-RjQEOu07CQjKM89OwvgEZXfsBWzG-MJ2Uy7zlxOsKCSakw/exec';

let adminToken = null;
let isAdminLoggedIn = false;

async function apiCall(action, params = {}) {
  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, ...params })
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Terjadi kesalahan');
    return data.data;
  } catch (err) {
    console.error(`API Error [${action}]:`, err);
    throw err;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  // Check session
  adminToken = localStorage.getItem('adminToken');
  if (adminToken) {
    showDashboard();
    loadOverview();
  }

  // Login form
  document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      const data = await apiCall('adminLogin', {
        email: document.getElementById('adminEmail').value,
        password: document.getElementById('adminPassword').value
      });
      adminToken = data.token;
      localStorage.setItem('adminToken', adminToken);
      isAdminLoggedIn = true;
      showDashboard();
      loadOverview();
    } catch (err) {
      const errDiv = document.getElementById('loginError');
      errDiv.textContent = err.message;
      errDiv.style.display = 'block';
    }
  });

  // Logout
  document.getElementById('logoutBtn').addEventListener('click', () => {
    adminToken = null;
    isAdminLoggedIn = false;
    localStorage.removeItem('adminToken');
    document.getElementById('loginScreen').style.display = 'flex';
    document.getElementById('dashboardScreen').style.display = 'none';
  });

  // Navigation
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const section = link.dataset.section;
      document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
      link.classList.add('active');
      document.querySelectorAll('.section-page').forEach(s => s.classList.remove('active'));
      document.getElementById('section-' + section).classList.add('active');
      document.getElementById('sectionTitle').textContent = link.textContent.trim();
      if (section === 'overview') loadOverview();
      if (section === 'products') loadProducts();
      if (section === 'orders') loadOrders();
      if (section === 'testimonials') loadTestimoni();
      if (section === 'reports') loadReports();
    });
  });

  // Product modal
  document.getElementById('addProductBtn').addEventListener('click', () => {
    document.getElementById('modalTitle').textContent = 'Tambah Produk';
    document.getElementById('productForm').reset();
    document.getElementById('editProductId').value = '';
    document.getElementById('productModal').classList.add('active');
  });
  document.getElementById('closeModal').addEventListener('click', () => {
    document.getElementById('productModal').classList.remove('active');
  });

  document.getElementById('productForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('editProductId').value;
    try {
      if (id) {
        await apiCall('editProduk', {
          idProduk: id,
          nama: document.getElementById('prodName').value,
          deskripsi: document.getElementById('prodDesc').value,
          kategori: document.getElementById('prodKategori').value,
          harga: document.getElementById('prodHarga').value,
          linkProduk: document.getElementById('prodLink').value,
          status: document.getElementById('prodStatus').value,
          thumbnail: document.getElementById('prodThumbnail').value
        });
      } else {
        await apiCall('addProduk', {
          nama: document.getElementById('prodName').value,
          deskripsi: document.getElementById('prodDesc').value,
          kategori: document.getElementById('prodKategori').value,
          harga: document.getElementById('prodHarga').value,
          linkProduk: document.getElementById('prodLink').value,
          status: document.getElementById('prodStatus').value,
          thumbnail: document.getElementById('prodThumbnail').value
        });
      }
      document.getElementById('productModal').classList.remove('active');
      loadProducts();
    } catch (err) { alert('Gagal: ' + err.message); }
  });

  // Order filter
  document.getElementById('orderFilter').addEventListener('change', loadOrders);
  document.getElementById('orderSearch').addEventListener('input', loadOrders);

  // Testimoni filter
  document.getElementById('testimoniFilter').addEventListener('change', loadTestimoni);
});

function showDashboard() {
  document.getElementById('loginScreen').style.display = 'none';
  document.getElementById('dashboardScreen').style.display = 'flex';
}

async function loadOverview() {
  try {
    const stats = await apiCall('getDashboardStats');
    document.getElementById('statRevenue').textContent = 'Rp ' + Number(stats.totalRevenue).toLocaleString('id-ID');
    document.getElementById('statPending').textContent = stats.pendingOrders;
    document.getElementById('statRedeemed').textContent = stats.redeemedCodes;
    document.getElementById('statTodayVisits').textContent = stats.todayVisits;

    // Sales chart
    const salesChart = document.getElementById('salesChart');
    salesChart.innerHTML = '';
    const salesData = await apiCall('getLaporan');
    salesData.salesByDate.slice(-7).forEach(d => {
      const maxRevenue = Math.max(...salesData.salesByDate.map(s => s.revenue), 1);
      const height = (d.revenue / maxRevenue) * 180;
      salesChart.innerHTML += `
        <div class="chart-bar-item">
          <span class="bar-value">Rp ${d.revenue.toLocaleString('id-ID')}</span>
          <div class="bar" style="height: ${height}px;"></div>
          <span class="bar-label">${d.date}</span>
        </div>`;
    });

    // Visits chart
    const visitsChart = document.getElementById('visitsChart');
    visitsChart.innerHTML = '';
    const visitsData = salesData.visitsByDate.slice(-7);
    const maxVisits = Math.max(...visitsData.map(v => v.count), 1);
    visitsData.forEach(d => {
      const height = (d.count / maxVisits) * 180;
      visitsChart.innerHTML += `
        <div class="chart-bar-item">
          <span class="bar-value">${d.count}</span>
          <div class="bar" style="height: ${height}px; background: var(--secondary);"></div>
          <span class="bar-label">${d.date}</span>
        </div>`;
    });

    // Latest orders table
    const ordersTable = document.getElementById('latestOrdersTable');
    ordersTable.innerHTML = stats.latestOrders.map(o => `
      <tr>
        <td>${o['ID Pesanan']}</td>
        <td>${o.namaProduk}</td>
        <td>${o['Nama Customer']}</td>
        <td><span class="badge badge-${o['Status Pembayaran'] === 'Terverifikasi' ? 'success' : 'pending'}">${o['Status Pembayaran']}</span></td>
        <td>${o['Kode Redeem'] || '-'}</td>
      </tr>`).join('');
  } catch (err) {
    console.error('Failed to load overview:', err);
  }
}

async function loadProducts() {
  try {
    const products = await apiCall('getSemuaProduk');
    const table = document.getElementById('productsTable');
    table.innerHTML = products.map(p => `
      <tr>
        <td><img src="${p.Thumbnail || 'https://via.placeholder.com/60'}" style="width: 40px; height: 40px; object-fit: cover; border-radius: 4px;"></td>
        <td>${p.Kategori || '-'}</td>
        <td>${p['Nama Produk']}</td>
        <td>Rp ${Number(p.Harga).toLocaleString('id-ID')}</td>
        <td><span class="badge badge-${p.Status === 'Aktif' ? 'success' : 'danger'}">${p.Status}</span></td>
        <td>
          <button class="btn btn-outline btn-sm" onclick="editProduct('${p['ID Produk']}')">Edit</button>
          <button class="btn btn-danger btn-sm" onclick="deleteProduct('${p['ID Produk']}')">Hapus</button>
        </td>
      </tr>`).join('');
  } catch (err) {
    console.error('Failed to load products:', err);
  }
}

async function editProduct(id) {
  const products = await apiCall('getSemuaProduk');
  const p = products.find(pr => pr['ID Produk'] === id);
  if (!p) return;

  document.getElementById('modalTitle').textContent = 'Edit Produk';
  document.getElementById('editProductId').value = p['ID Produk'];
  document.getElementById('prodName').value = p['Nama Produk'];
  document.getElementById('prodDesc').value = p.Deskripsi || '';
  document.getElementById('prodKategori').value = p.Kategori || '';
  document.getElementById('prodHarga').value = p.Harga;
  document.getElementById('prodLink').value = p['Link Produk'] || '';
  document.getElementById('prodStatus').value = p.Status;
  document.getElementById('prodThumbnail').value = p.Thumbnail || '';
  document.getElementById('productModal').classList.add('active');
}

async function deleteProduct(id) {
  if (!confirm('Yakin hapus produk ini?')) return;
  try {
    await apiCall('deleteProduk', { idProduk: id });
    loadProducts();
  } catch (err) { alert('Gagal: ' + err.message); }
}

async function loadOrders() {
  try {
    const status = document.getElementById('orderFilter').value;
    const search = document.getElementById('orderSearch').value;
    const orders = await apiCall('getPesanan', { status, search });
    const table = document.getElementById('ordersTable');
    table.innerHTML = orders.map(o => `
      <tr>
        <td>${o['ID Pesanan']}</td>
        <td>${o.namaProduk}</td>
        <td>${o['Nama Customer']}</td>
        <td>${o['Kontak Customer']}</td>
        <td><span class="badge badge-${o['Status Pembayaran'] === 'Terverifikasi' ? 'success' : 'pending'}">${o['Status Pembayaran']}</span></td>
        <td>${o['Kode Redeem'] || '-'}</td>
        <td>
          <button class="btn btn-secondary btn-sm" onclick="verifyOrder('${o['ID Pesanan']}', 'Terverifikasi')">Verifikasi</button>
          <button class="btn btn-outline btn-sm" onclick="verifyOrder('${o['ID Pesanan']}', 'Dibatalkan')">Batal</button>
        </td>
      </tr>`).join('');
  } catch (err) {
    console.error('Failed to load orders:', err);
  }
}

async function verifyOrder(id, status) {
  try {
    const data = await apiCall('verifyPesanan', { idPesanan: id, status });
    alert(data.message);
    loadOrders();
  } catch (err) { alert('Gagal: ' + err.message); }
}

async function loadTestimoni() {
  try {
    const status = document.getElementById('testimoniFilter').value;
    const testimoni = await apiCall('getSemuaTestimoni', { status });
    const table = document.getElementById('testimoniTable');
    table.innerHTML = testimoni.map(t => `
      <tr>
        <td>${t['Nama Customer']}</td>
        <td>${t.namaProduk || '-'}</td>
        <td>${'★'.repeat(t.Rating)}${'☆'.repeat(5 - t.Rating)}</td>
        <td>${t['Isi Testimoni']}</td>
        <td><span class="badge badge-${t.Status === 'Disetujui' ? 'success' : t.Status === 'Ditolak' ? 'danger' : 'pending'}">${t.Status}</span></td>
        <td>
          <button class="btn btn-secondary btn-sm" onclick="moderateTestimoni('${t['ID Testimoni']}', 'Disetujui')">Setujui</button>
          <button class="btn btn-outline btn-sm" onclick="moderateTestimoni('${t['ID Testimoni']}', 'Ditolak')">Tolak</button>
        </td>
      </tr>`).join('');
  } catch (err) {
    console.error('Failed to load testimoni:', err);
  }
}

async function moderateTestimoni(id, status) {
  try {
    await apiCall('moderateTestimoni', { idTestimoni: id, status });
    loadTestimoni();
  } catch (err) { alert('Gagal: ' + err.message); }
}

async function loadReports() {
  try {
    const report = await apiCall('getLaporan');
    document.getElementById('reportRevenue').textContent = 'Rp ' + Number(report.summary.totalRevenue).toLocaleString('id-ID');
    document.getElementById('reportConversion').textContent = report.summary.conversionRate + '%';
    document.getElementById('reportAOV').textContent = 'Rp ' + Number(report.summary.avgOrderValue).toLocaleString('id-ID');
    document.getElementById('reportPendingRev').textContent = report.summary.pendingReviews;

    const chart = document.getElementById('reportChart');
    chart.innerHTML = '';
    const allDates = [...new Set([...report.salesByDate.map(s => s.date), ...report.visitsByDate.map(v => v.date)])];
    allDates.forEach(d => {
      const sale = report.salesByDate.find(s => s.date === d);
      const visit = report.visitsByDate.find(v => v.date === d);
      const rev = sale ? sale.revenue : 0;
      const vis = visit ? visit.count : 0;
      chart.innerHTML += `
        <div class="chart-bar-item">
          <span class="bar-value">Rp ${rev.toLocaleString('id-ID')}</span>
          <div class="bar" style="height: ${Math.min(rev / 1000, 180)}px;"></div>
          <span class="bar-label">${d}</span>
        </div>`;
    });

    const log = document.getElementById('transactionLog');
    log.innerHTML = report.transactionLog.map(t => `
      <tr>
        <td>${t['ID Pesanan']}</td>
        <td>${t.namaProduk}</td>
        <td>${t['Nama Customer']}</td>
        <td>${t['Tanggal Pesan']}</td>
        <td>Rp ${Number(t.harga || 0).toLocaleString('id-ID')}</td>
      </tr>`).join('');
  } catch (err) {
    console.error('Failed to load reports:', err);
  }
}
