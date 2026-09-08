const API_URL = 'Yhttps://script.google.com/macros/s/AKfycbxpYgerNhagkCi3ya7ERck-RjQEOu07CQjKM89OwvgEZXfsBWzG-MJ2Uy7zlxOsKCSakw/exec';

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

async function loadProducts(containerId = 'productGrid') {
  try {
    const products = await apiCall('getProduk');
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = '';
    products.forEach(p => {
      container.innerHTML += `
        <div class="product-card">
          <div class="product-img"><img src="${p.Thumbnail || 'https://via.placeholder.com/400x200'}" alt="${p['Nama Produk']}"></div>
          <div class="product-info">
            <span class="product-cat">${p.Kategori || 'General'}</span>
            <h3 class="product-name">${p['Nama Produk']}</h3>
            <p class="product-price">Rp ${Number(p.Harga).toLocaleString('id-ID')}</p>
            <a href="product.html?id=${p['ID Produk']}" class="btn btn-outline">Detail</a>
          </div>
        </div>`;
    });
  } catch (err) {
    console.error('Failed to load products:', err);
  }
}

async function loadProductDetail() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  if (!id) return;

  try {
    const product = await apiCall('getProdukById', { id });
    document.getElementById('detailNama').textContent = product['Nama Produk'];
    document.getElementById('detailHarga').textContent = 'Rp ' + Number(product.Harga).toLocaleString('id-ID');
    document.getElementById('detailDeskripsi').textContent = product.Deskripsi || 'Deskripsi tidak tersedia.';
    document.getElementById('detailThumbnail').src = product.Thumbnail || 'https://via.placeholder.com/600x400';
    document.getElementById('detailKategori').textContent = product.Kategori || 'General';
    document.getElementById('btnCheckout').href = `checkout.html?id=${product['ID Produk']}&name=${encodeURIComponent(product['Nama Produk'])}&price=${product.Harga}`;

    const testimoniContainer = document.createElement('div');
    testimoniContainer.style.marginTop = '3rem';
    testimoniContainer.innerHTML = '<h3 style="margin-bottom: 1rem;">Testimoni</h3><div id="testimoniList"></div>';
    document.getElementById('productDetailContainer').appendChild(testimoniContainer);

    const reviews = await apiCall('getTestimoni', { idProduk: id });
    const list = document.getElementById('testimoniList');
    if (reviews.length === 0) {
      list.innerHTML = '<p style="color: var(--gray);">Belum ada testimoni.</p>';
    } else {
      list.innerHTML = reviews.map(r => `
        <div style="background: white; padding: 1rem; border-radius: 0.5rem; margin-bottom: 1rem;">
          <strong>${r['Nama Customer']}</strong> <span style="color: gold;">${'★'.repeat(r.Rating)}${'☆'.repeat(5 - r.Rating)}</span>
          <p style="margin-top: 0.5rem; color: var(--gray);">${r['Isi Testimoni']}</p>
        </div>`).join('');
    }
  } catch (err) {
    console.error('Failed to load product detail:', err);
  }
}

function setupCheckout() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  const name = params.get('name');
  const price = params.get('price');

  if (id) {
    document.getElementById('idProduk').value = id;
    document.getElementById('namaProduk').value = decodeURIComponent(name || '');
    document.getElementById('totalBayar').value = 'Rp ' + Number(price || 0).toLocaleString('id-ID');
  }

  document.getElementById('checkoutForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      await apiCall('checkout', {
        idProduk: document.getElementById('idProduk').value,
        namaCustomer: document.getElementById('namaCustomer').value,
        kontakCustomer: document.getElementById('kontakCustomer').value
      });
      alert('Pesanan berhasil! Silakan transfer ke rekening yang tertera.');
      window.location.href = 'index.html';
    } catch (err) {
      alert('Gagal: ' + err.message);
    }
  });
}

function setupRedeem() {
  document.getElementById('redeemForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const kode = document.getElementById('kodeRedeem').value;
    const resultDiv = document.getElementById('redeemResult');
    resultDiv.style.display = 'block';

    try {
      const data = await apiCall('redeem', { kodeRedeem: kode });
      resultDiv.style.background = '#dcfce7';
      resultDiv.style.color = '#166534';
      resultDiv.innerHTML = `
        <h3 style="margin-bottom: 0.5rem;">✅ Kode Valid!</h3>
        <p>Akses produk: <a href="${data.linkProduk}" target="_blank">Klik di sini</a></p>
        <p>${data.message}</p>`;
    } catch (err) {
      resultDiv.style.background = '#fee2e2';
      resultDiv.style.color = '#991b1b';
      resultDiv.innerHTML = `
        <h3 style="margin-bottom: 0.5rem;">❌ Gagal!</h3>
        <p>${err.message}</p>`;
    }
  });
}

function setupRatingInput() {
  const stars = document.querySelectorAll('#ratingInput .star');
  const ratingInput = document.getElementById('rating');

  stars.forEach(star => {
    star.addEventListener('click', () => {
      const val = parseInt(star.dataset.rating);
      ratingInput.value = val;
      stars.forEach((s, i) => s.style.color = i < val ? 'gold' : '#ccc');
    });
    star.addEventListener('mouseover', () => {
      const val = parseInt(star.dataset.rating);
      stars.forEach((s, i) => s.style.color = i < val ? 'gold' : '#ccc');
    });
  });
  document.getElementById('ratingInput').addEventListener('mouseleave', () => {
    stars.forEach((s, i) => s.style.color = i < parseInt(ratingInput.value) ? 'gold' : '#ccc');
  });
}

async function loadProductsForTestimoni() {
  try {
    const products = await apiCall('getProduk');
    const select = document.getElementById('idProduk');
    products.forEach(p => {
      select.innerHTML += `<option value="${p['ID Produk']}">${p['Nama Produk']}</option>`;
    });
  } catch (err) {
    console.error('Failed to load products:', err);
  }
}

function setupTestimonial() {
  document.getElementById('testimonialForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      const rating = parseInt(document.getElementById('rating').value);
      if (!rating) { alert('Pilih rating terlebih dahulu'); return; }

      await apiCall('submitTestimoni', {
        idProduk: document.getElementById('idProduk').value,
        namaCustomer: document.getElementById('namaCustomer').value,
        emailCustomer: document.getElementById('emailCustomer').value,
        isiTestimoni: document.getElementById('isiTestimoni').value,
        rating: rating
      });
      alert('Terima kasih! Testimoni Anda akan ditampilkan setelah moderasi.');
      window.location.href = 'index.html';
    } catch (err) {
      alert('Gagal: ' + err.message);
    }
  });
}

async function trackVisit() {
  try { await apiCall('trackVisit'); } catch (err) { console.error('Track visit failed:', err); }
}

window.addEventListener('DOMContentLoaded', () => {
  trackVisit();
  if (document.getElementById('productGrid')) loadProducts();
  if (document.getElementById('productDetailContainer')) loadProductDetail();
  if (document.getElementById('checkoutForm')) setupCheckout();
  if (document.getElementById('redeemForm')) setupRedeem();
  if (document.getElementById('testimonialForm')) setupTestimonial();
  if (document.getElementById('ratingInput')) setupRatingInput();
});
