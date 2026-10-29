/**
 * Signoret Pharmaceuticals Pvt. Ltd.
 * Admin Dashboard Logic — Supabase-backed
 * Verified Headquarters: Plot No. 556, Industrial Area Phase-9, Mohali, Punjab 160062
 * Verified Phone / WhatsApp: +91 81988 88864
 * NO hardcoded passwords. Authentication handled via Supabase Auth.
 */

(function () {
  'use strict';

  var sb = window.SignoretSupabase ? window.SignoretSupabase.getClient() : null;

  // ===== DOM refs =====
  var loginScreen = document.getElementById('loginScreen');
  var dashboardScreen = document.getElementById('dashboardScreen');
  var loginForm = document.getElementById('loginForm');
  var loginEmail = document.getElementById('loginEmail');
  var loginPassword = document.getElementById('loginPassword');
  var loginError = document.getElementById('loginError');
  var forgotPassBtn = document.getElementById('forgotPassBtn');
  var forgotStatus = document.getElementById('forgotStatus');
  var logoutBtn = document.getElementById('logoutBtn');
  var sidebar = document.getElementById('adminSidebar');
  var sidebarToggle = document.getElementById('sidebarToggle');
  var sidebarBackdrop = document.getElementById('sidebarBackdrop');

  // Nav items & sections
  var navItems = document.querySelectorAll('.admin-nav-item');
  var sections = {
    overview: document.getElementById('sectionOverview'),
    products: document.getElementById('sectionProducts'),
    enquiries: document.getElementById('sectionEnquiries'),
    posts: document.getElementById('sectionPosts'),
    settings: document.getElementById('sectionSettings')
  };

  // Stats
  var statProducts = document.getElementById('statProducts');
  var statEnquiries = document.getElementById('statEnquiries');
  var statNewEnquiries = document.getElementById('statNewEnquiries');

  // Products
  var addProductBtn = document.getElementById('addProductBtn');
  var productsBody = document.getElementById('productsBody');
  var productsMobileList = document.getElementById('productsMobileList');
  var productModal = document.getElementById('productModal');
  var productModalTitle = document.getElementById('productModalTitle');
  var productModalClose = document.getElementById('productModalClose');
  var productForm = document.getElementById('productForm');
  var productCancelBtn = document.getElementById('productCancelBtn');
  var productFormStatus = document.getElementById('productFormStatus');
  var productImageFile = document.getElementById('productImageFile');

  // Enquiries
  var enquiriesBody = document.getElementById('enquiriesBody');
  var enquiriesMobileList = document.getElementById('enquiriesMobileList');
  var recentEnquiriesBody = document.getElementById('recentEnquiriesBody');
  var recentEnquiriesMobileList = document.getElementById('recentEnquiriesMobileList');
  var enquirySearchInput = document.getElementById('enquirySearchInput');
  var enquiryStatusFilter = document.getElementById('enquiryStatusFilter');
  var exportEnquiriesCsvBtn = document.getElementById('exportEnquiriesCsvBtn');
  var enquiryPageInfo = document.getElementById('enquiryPageInfo');
  var enquiryPrevPage = document.getElementById('enquiryPrevPage');
  var enquiryNextPage = document.getElementById('enquiryNextPage');

  // Blog Posts
  var addPostBtn = document.getElementById('addPostBtn');
  var postsBody = document.getElementById('postsBody');
  var postsMobileList = document.getElementById('postsMobileList');
  var postModal = document.getElementById('postModal');
  var postModalTitle = document.getElementById('postModalTitle');
  var postModalClose = document.getElementById('postModalClose');
  var postForm = document.getElementById('postForm');
  var postCancelBtn = document.getElementById('postCancelBtn');
  var postFormStatus = document.getElementById('postFormStatus');
  var postImageFile = document.getElementById('postImageFile');

  // Settings
  var settingsForm = document.getElementById('settingsForm');
  var settingsStatus = document.getElementById('settingsStatus');

  // Escaping helper
  function esc(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // Toast notification
  function showToast(message, isError) {
    var toast = document.createElement('div');
    toast.className = 'admin-toast' + (isError ? ' error' : '');
    toast.style.cssText = 'position:fixed;bottom:24px;right:24px;padding:12px 20px;background:' + (isError ? '#dc2626' : '#0b8d69') + ';color:#fff;border-radius:10px;box-shadow:0 8px 24px rgba(0,0,0,0.2);z-index:9999;font-weight:600;font-size:0.9rem;transition:all 0.3s ease;';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(function () {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      setTimeout(function () { toast.remove(); }, 300);
    }, 4000);
  }

  // Client-side image compression & validation (<2MB, max dimension 1200px)
  async function validateAndCompressImage(file) {
    if (!file) return null;
    var validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (validTypes.indexOf(file.type) === -1) {
      throw new Error('Unsupported file format. Please upload JPEG, PNG, or WebP.');
    }
    if (file.size > 2 * 1024 * 1024) {
      // Auto compress via canvas
      return new Promise(function (resolve, reject) {
        var img = new Image();
        img.onload = function () {
          var maxDim = 1200;
          var w = img.width;
          var h = img.height;
          if (w > maxDim || h > maxDim) {
            if (w > h) {
              h = Math.round((h * maxDim) / w);
              w = maxDim;
            } else {
              w = Math.round((w * maxDim) / h);
              h = maxDim;
            }
          }
          var canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          var ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, w, h);
          canvas.toBlob(function (blob) {
            if (blob) {
              var compressedFile = new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' });
              resolve(compressedFile);
            } else {
              resolve(file);
            }
          }, 'image/jpeg', 0.85);
        };
        img.onerror = function () { reject(new Error('Failed to process image.')); };
        img.src = URL.createObjectURL(file);
      });
    }
    return file;
  }

  // Delete image from Supabase storage
  async function deleteStorageFile(bucket, fullUrl) {
    if (!sb || !fullUrl) return;
    try {
      var parts = fullUrl.split('/');
      var fileName = parts.pop();
      if (fileName && fullUrl.indexOf(bucket) !== -1) {
        await sb.storage.from(bucket).remove([fileName]);
      }
    } catch (e) {
      console.warn('Could not delete old storage file:', e);
    }
  }

  // ===== AUTH & SESSION =====
  async function checkSession() {
    if (!sb) {
      loginError.textContent = 'Supabase client not initialized. Check supabase-config.js credentials.';
      return;
    }
    try {
      var { data: { session } } = await sb.auth.getSession();
      if (session) {
        showDashboard();
      }
    } catch (e) {
      console.warn('Session check error:', e);
    }
  }

  if (loginForm) {
    loginForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      loginError.textContent = '';
      if (!sb) {
        loginError.textContent = 'Supabase not configured.';
        return;
      }
      var email = loginEmail.value.trim();
      var pass = loginPassword.value;
      if (!email || !pass) {
        loginError.textContent = 'Please enter your administrator email and password.';
        return;
      }
      try {
        var { error } = await sb.auth.signInWithPassword({ email: email, password: pass });
        if (error) {
          loginError.textContent = error.message || 'Invalid login credentials.';
          return;
        }
        showDashboard();
      } catch (err) {
        loginError.textContent = 'Login failed. Please check your credentials.';
      }
    });
  }

  // Forgot password flow via Supabase Auth
  if (forgotPassBtn) {
    forgotPassBtn.addEventListener('click', async function () {
      var email = loginEmail.value.trim();
      if (!email) {
        loginError.textContent = 'Please enter your admin email address first, then click "Forgot password?".';
        return;
      }
      loginError.textContent = '';
      if (forgotStatus) forgotStatus.textContent = 'Sending password reset email…';
      try {
        var { error } = await sb.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin + '/admin.html'
        });
        if (error) throw error;
        if (forgotStatus) {
          forgotStatus.innerHTML = '<span style="color:var(--admin-success);font-weight:600;">✓ Reset instructions sent to ' + esc(email) + '. Check your inbox.</span>';
        }
      } catch (err) {
        if (forgotStatus) {
          forgotStatus.innerHTML = '<span style="color:var(--admin-danger);font-weight:600;">Error: ' + esc(err.message || 'Could not send reset email.') + '</span>';
        }
      }
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener('click', async function () {
      if (sb) await sb.auth.signOut();
      loginScreen.style.display = '';
      dashboardScreen.style.display = 'none';
    });
  }

  function showDashboard() {
    loginScreen.style.display = 'none';
    dashboardScreen.style.display = 'flex';
    loadOverviewData();
    loadProducts();
    loadEnquiries();
    loadPosts();
    loadSettings();
  }

  // ===== SIDEBAR NAV =====
  navItems.forEach(function (item) {
    item.addEventListener('click', function (e) {
      e.preventDefault();
      var sec = item.getAttribute('data-section');
      navItems.forEach(function (n) { n.classList.remove('active'); });
      item.classList.add('active');
      Object.keys(sections).forEach(function (key) {
        if (sections[key]) {
          sections[key].classList.toggle('active', key === sec);
        }
      });
      closeMobileSidebar();
    });
  });

  if (sidebarToggle) {
    sidebarToggle.addEventListener('click', function () {
      if (sidebar && sidebar.classList.contains('open')) {
        closeMobileSidebar();
      } else {
        openMobileSidebar();
      }
    });
  }

  function openMobileSidebar() {
    if (sidebar) sidebar.classList.add('open');
    if (sidebarToggle) {
      sidebarToggle.classList.add('open');
      sidebarToggle.setAttribute('aria-expanded', 'true');
    }
    if (sidebarBackdrop) sidebarBackdrop.classList.add('open');
  }

  function closeMobileSidebar() {
    if (sidebar) sidebar.classList.remove('open');
    if (sidebarToggle) {
      sidebarToggle.classList.remove('open');
      sidebarToggle.setAttribute('aria-expanded', 'false');
    }
    if (sidebarBackdrop) sidebarBackdrop.classList.remove('open');
  }

  if (sidebarBackdrop) sidebarBackdrop.addEventListener('click', closeMobileSidebar);

  // ===== OVERVIEW SECTION =====
  async function loadOverviewData() {
    if (!sb) return;
    if (statProducts) statProducts.textContent = '…';
    if (statEnquiries) statEnquiries.textContent = '…';
    if (statNewEnquiries) statNewEnquiries.textContent = '…';

    try {
      var { count: pCount, error: pErr } = await sb.from('products').select('*', { count: 'exact', head: true });
      if (pErr) throw pErr;
      if (statProducts) statProducts.textContent = pCount || 0;

      var { count: eCount, error: eErr } = await sb.from('enquiries').select('*', { count: 'exact', head: true });
      if (eErr) throw eErr;
      if (statEnquiries) statEnquiries.textContent = eCount || 0;

      var { count: nCount, error: nErr } = await sb.from('enquiries').select('*', { count: 'exact', head: true }).eq('status', 'New');
      if (nErr) throw nErr;
      if (statNewEnquiries) statNewEnquiries.textContent = nCount || 0;

      var { data: recent, error: rErr } = await sb.from('enquiries').select('*').order('created_at', { ascending: false }).limit(5);
      if (rErr) throw rErr;
      renderRecentEnquiries(recent || []);
    } catch (e) {
      console.warn('Overview data load error:', e);
      if (statProducts) statProducts.textContent = 'Error';
      if (statEnquiries) statEnquiries.textContent = 'Error';
      if (statNewEnquiries) statNewEnquiries.textContent = 'Error';
      if (recentEnquiriesBody) recentEnquiriesBody.innerHTML = '<tr><td colspan="5" class="admin-empty">Could not load recent enquiries.</td></tr>';
    }
  }

  function renderRecentEnquiries(list) {
    if (recentEnquiriesBody) {
      if (!list.length) {
        recentEnquiriesBody.innerHTML = '<tr><td colspan="5" class="admin-empty">No enquiries received yet.</td></tr>';
      } else {
        recentEnquiriesBody.innerHTML = list.map(function (eq) {
          var d = eq.created_at ? new Date(eq.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
          var statusClass = eq.status === 'New' ? 'admin-badge-new' : eq.status === 'Contacted' ? 'admin-badge-contacted' : 'admin-badge-closed';
          return '<tr>' +
            '<td>' + d + '</td>' +
            '<td>' + esc(eq.name || '—') + '</td>' +
            '<td>' + esc(eq.phone || '—') + '</td>' +
            '<td>' + esc(eq.product || '—') + '</td>' +
            '<td><span class="admin-badge ' + statusClass + '">' + esc(eq.status || 'New') + '</span></td>' +
            '</tr>';
        }).join('');
      }
    }

    if (recentEnquiriesMobileList) {
      if (!list.length) {
        recentEnquiriesMobileList.innerHTML = '<p style="text-align:center;color:#5a7389;padding:20px;font-style:italic;">No enquiries received yet.</p>';
      } else {
        recentEnquiriesMobileList.innerHTML = list.map(function (eq) {
          var d = eq.created_at ? new Date(eq.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
          var statusClass = eq.status === 'New' ? 'admin-badge-new' : eq.status === 'Contacted' ? 'admin-badge-contacted' : 'admin-badge-closed';
          return '<div class="admin-recent-eq-card">' +
            '<div class="admin-recent-eq-info">' +
              '<div class="admin-recent-eq-name">' + esc(eq.name || 'Anonymous') + '</div>' +
              '<div class="admin-recent-eq-sub">' + esc(eq.phone || '') + (eq.product ? ' · ' + esc(eq.product) : '') + '</div>' +
            '</div>' +
            '<div class="admin-recent-eq-right">' +
              '<span class="admin-badge ' + statusClass + '">' + esc(eq.status || 'New') + '</span>' +
              '<span class="admin-recent-eq-date">' + d + '</span>' +
            '</div>' +
          '</div>';
        }).join('');
      }
    }
  }

  // ===== PRODUCTS CRUD =====
  var allProducts = [];

  async function loadProducts() {
    if (!sb) return;
    try {
      var { data, error } = await sb.from('products').select('*').order('sort_order', { ascending: true });
      if (error) throw error;
      allProducts = data || [];
      renderProductsTable();
    } catch (e) {
      console.warn('Products load error:', e);
      if (productsBody) productsBody.innerHTML = '<tr><td colspan="8" class="admin-empty error">Failed to load products from database.</td></tr>';
    }
  }

  function renderProductsTable() {
    if (!productsBody) return;
    if (!allProducts.length) {
      productsBody.innerHTML = '<tr><td colspan="8" class="admin-empty">No products in catalogue. Click "+ Add Product" to add one.</td></tr>';
      if (productsMobileList) productsMobileList.innerHTML = '<p style="text-align:center;color:#5a7389;padding:30px;font-style:italic;">No products yet.</p>';
      return;
    }

    productsBody.innerHTML = allProducts.map(function (p, idx) {
      var img = p.image_url ? '<img class="admin-product-thumb" src="' + esc(p.image_url) + '" alt="" />' : '<span style="color:var(--admin-muted);font-size:.8rem">No img</span>';
      var statusBadge = p.active
        ? '<span class="admin-badge admin-badge-active">Active</span>'
        : '<span class="admin-badge admin-badge-inactive">Inactive</span>';
      var featuredBadge = p.featured
        ? '<span class="admin-badge-featured">Featured</span>'
        : '';

      return '<tr draggable="true" data-id="' + esc(p.id) + '" data-index="' + idx + '">' +
        '<td><span class="admin-drag-handle" title="Drag to reorder">⋮⋮</span></td>' +
        '<td>' + img + '</td>' +
        '<td><strong>' + esc(p.name) + '</strong>' + featuredBadge + '</td>' +
        '<td>' + esc(p.category) + '</td>' +
        '<td style="max-width:180px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + esc(p.composition || '') + '</td>' +
        '<td>' + esc(p.pack_size || p.packing || '') + '</td>' +
        '<td>' + statusBadge + '</td>' +
        '<td style="white-space:nowrap;">' +
          '<button class="admin-action-btn edit-btn" data-id="' + esc(p.id) + '">Edit</button>' +
          '<button class="admin-action-btn promote promote-btn" data-id="' + esc(p.id) + '">Promote</button>' +
          '<button class="admin-action-btn danger delete-btn" data-id="' + esc(p.id) + '">Delete</button>' +
        '</td>' +
      '</tr>';
    }).join('');

    // Setup action button handlers safely
    productsBody.querySelectorAll('.edit-btn').forEach(function (btn) {
      btn.addEventListener('click', function () { editProduct(btn.getAttribute('data-id')); });
    });
    productsBody.querySelectorAll('.promote-btn').forEach(function (btn) {
      btn.addEventListener('click', function () { promoteProduct(btn.getAttribute('data-id')); });
    });
    productsBody.querySelectorAll('.delete-btn').forEach(function (btn) {
      btn.addEventListener('click', function () { deleteProduct(btn.getAttribute('data-id')); });
    });

    setupDragReorder();
    renderMobileProductCards();
  }

  function renderMobileProductCards() {
    if (!productsMobileList) return;
    if (!allProducts.length) {
      productsMobileList.innerHTML = '<p style="text-align:center;color:#5a7389;padding:30px;font-style:italic;">No products yet.</p>';
      return;
    }
    productsMobileList.innerHTML = '';
    allProducts.forEach(function (p) {
      var card = document.createElement('div');
      card.className = 'admin-product-mobile-card';
      card.setAttribute('data-id', p.id);

      var imgCol = document.createElement('div');
      imgCol.className = 'admin-product-mobile-img';
      if (p.image_url) {
        var img = document.createElement('img');
        img.src = p.image_url;
        img.alt = '';
        imgCol.appendChild(img);
      } else {
        imgCol.textContent = 'No img';
      }

      var body = document.createElement('div');
      body.className = 'admin-product-mobile-body';

      var statusBadgeHtml = p.active
        ? '<span class="admin-badge admin-badge-active" style="font-size:.7rem;padding:2px 8px;">Active</span>'
        : '<span class="admin-badge admin-badge-inactive" style="font-size:.7rem;padding:2px 8px;">Inactive</span>';
      var featuredBadgeHtml = p.featured
        ? '<span class="admin-badge-featured" style="font-size:.7rem;padding:2px 6px;">Featured</span>'
        : '';

      body.innerHTML =
        '<div class="admin-product-mobile-top">' +
          '<span class="admin-product-mobile-name">' + esc(p.name) + '</span>' +
          '<span class="admin-product-mobile-cat">' + esc(p.category) + '</span>' +
        '</div>' +
        '<div class="admin-product-mobile-comp">' + esc(p.composition || '—') + '</div>' +
        (p.pack_size || p.packing ? '<div class="admin-product-mobile-pack">📦 ' + esc(p.pack_size || p.packing) + '</div>' : '') +
        '<div class="admin-product-mobile-actions">' +
          statusBadgeHtml +
          featuredBadgeHtml +
          '<button class="admin-action-btn edit-mob-btn">Edit</button>' +
          '<button class="admin-action-btn promote promote-mob-btn">Promote</button>' +
          '<button class="admin-action-btn danger delete-mob-btn">Delete</button>' +
        '</div>';

      body.querySelector('.edit-mob-btn').addEventListener('click', function () { editProduct(p.id); });
      body.querySelector('.promote-mob-btn').addEventListener('click', function () { promoteProduct(p.id); });
      body.querySelector('.delete-mob-btn').addEventListener('click', function () { deleteProduct(p.id); });

      card.appendChild(imgCol);
      card.appendChild(body);
      productsMobileList.appendChild(card);
    });
  }

  // Drag and drop reorder with error rollback
  function setupDragReorder() {
    var rows = productsBody.querySelectorAll('tr[draggable]');
    var dragSrcIdx = null;

    rows.forEach(function (row) {
      row.addEventListener('dragstart', function (e) {
        dragSrcIdx = parseInt(row.getAttribute('data-index'));
        row.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
      });
      row.addEventListener('dragend', function () {
        row.classList.remove('dragging');
        rows.forEach(function (r) { r.classList.remove('drag-over'); });
      });
      row.addEventListener('dragover', function (e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        row.classList.add('drag-over');
      });
      row.addEventListener('dragleave', function () {
        row.classList.remove('drag-over');
      });
      row.addEventListener('drop', async function (e) {
        e.preventDefault();
        row.classList.remove('drag-over');
        var dropIdx = parseInt(row.getAttribute('data-index'));
        if (dragSrcIdx === null || dragSrcIdx === dropIdx) return;

        var previousProducts = allProducts.slice();
        var moved = allProducts.splice(dragSrcIdx, 1)[0];
        allProducts.splice(dropIdx, 0, moved);
        renderProductsTable();

        try {
          var updates = allProducts.map(function (p, i) {
            return sb.from('products').update({ sort_order: i }).eq('id', p.id);
          });
          var results = await Promise.all(updates);
          var failed = results.some(function (r) { return r && r.error; });
          if (failed) throw new Error('Failed to update sort order on server.');
          showToast('Product order saved!');
        } catch (err) {
          console.error('Reorder save error:', err);
          showToast('Failed to save product order: ' + err.message, true);
          allProducts = previousProducts;
          renderProductsTable();
        }
      });
    });
  }

  function openProductModal(prod) {
    if (!productModal) return;
    productModalTitle.textContent = prod ? 'Edit Product' : 'Add Product';
    document.getElementById('productId').value = prod ? prod.id : '';
    document.getElementById('productName').value = prod ? prod.name || '' : '';
    document.getElementById('productCategory').value = prod ? prod.category || 'Tablets' : 'Tablets';
    document.getElementById('productComposition').value = prod ? prod.composition || '' : '';
    document.getElementById('productPackSize').value = prod ? prod.pack_size || prod.packing || '' : '';
    document.getElementById('productDescription').value = prod ? prod.description || '' : '';
    document.getElementById('productImageUrl').value = prod ? prod.image_url || '' : '';
    document.getElementById('productActive').checked = prod ? Boolean(prod.active) : true;
    document.getElementById('productFeatured').checked = prod ? Boolean(prod.featured) : false;

    var preview = document.getElementById('imagePreview');
    if (prod && prod.image_url) {
      preview.src = prod.image_url;
      preview.style.display = 'block';
    } else {
      preview.src = '';
      preview.style.display = 'none';
    }

    if (productImageFile) productImageFile.value = '';
    if (productFormStatus) productFormStatus.textContent = '';
    productModal.classList.add('open');
  }

  function closeProductModal() {
    if (productModal) productModal.classList.remove('open');
  }

  if (addProductBtn) addProductBtn.addEventListener('click', function () { openProductModal(null); });
  if (productModalClose) productModalClose.addEventListener('click', closeProductModal);
  if (productCancelBtn) productCancelBtn.addEventListener('click', closeProductModal);
  if (productModal) {
    productModal.addEventListener('click', function (e) {
      if (e.target === productModal) closeProductModal();
    });
  }

  if (productImageFile) {
    productImageFile.addEventListener('change', async function () {
      var file = this.files && this.files[0];
      var preview = document.getElementById('imagePreview');
      if (file && preview) {
        try {
          var compressed = await validateAndCompressImage(file);
          preview.src = URL.createObjectURL(compressed);
          preview.style.display = 'block';
        } catch (err) {
          alert(err.message);
          this.value = '';
          preview.style.display = 'none';
        }
      }
    });
  }

  if (productForm) {
    productForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      var id = document.getElementById('productId').value;
      var name = document.getElementById('productName').value.trim();
      var category = document.getElementById('productCategory').value;
      var composition = document.getElementById('productComposition').value.trim();
      var packSize = document.getElementById('productPackSize').value.trim();
      var description = document.getElementById('productDescription').value.trim();
      var active = document.getElementById('productActive').checked;
      var featured = document.getElementById('productFeatured').checked;
      var imageUrl = document.getElementById('productImageUrl').value;

      if (!name || !composition) {
        if (productFormStatus) {
          productFormStatus.textContent = 'Please provide product name and composition.';
          productFormStatus.className = 'admin-form-status error';
        }
        return;
      }

      if (productFormStatus) {
        productFormStatus.textContent = 'Saving product…';
        productFormStatus.className = 'admin-form-status';
      }

      try {
        var oldImageUrl = id ? (allProducts.find(function (p) { return p.id === id; }) || {}).image_url : null;

        // Image upload handling
        if (sb && productImageFile && productImageFile.files && productImageFile.files[0]) {
          var file = await validateAndCompressImage(productImageFile.files[0]);
          var ext = file.name.split('.').pop() || 'jpg';
          var fileName = 'prod_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7) + '.' + ext;
          var { error: uploadError } = await sb.storage.from('products').upload(fileName, file, { upsert: true });
          if (uploadError) throw new Error('Image upload failed: ' + uploadError.message);
          var { data: urlData } = sb.storage.from('products').getPublicUrl(fileName);
          if (urlData) {
            imageUrl = urlData.publicUrl;
            // Delete old image if replaced
            if (oldImageUrl && oldImageUrl !== imageUrl) {
              await deleteStorageFile('products', oldImageUrl);
            }
          }
        }

        var slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        var record = {
          name: name,
          category: category,
          composition: composition,
          pack_size: packSize,
          packing: packSize,
          description: description,
          active: active,
          featured: featured,
          image_url: imageUrl,
          hd_image_url: imageUrl,
          slug: slug
        };

        if (sb) {
          if (id) {
            var { error: updateErr } = await sb.from('products').update(record).eq('id', id);
            if (updateErr) throw updateErr;
          } else {
            record.sort_order = allProducts.length;
            var { error: insertErr } = await sb.from('products').insert([record]);
            if (insertErr) throw insertErr;
          }
        }

        closeProductModal();
        showToast('Product saved successfully!');
        await loadProducts();
        await loadOverviewData();
      } catch (err) {
        console.error('Product save error:', err);
        if (productFormStatus) {
          productFormStatus.textContent = 'Error: ' + (err.message || 'Could not save product.');
          productFormStatus.className = 'admin-form-status error';
        }
      }
    });
  }

  function editProduct(id) {
    var prod = allProducts.find(function (p) { return p.id === id; });
    if (prod) openProductModal(prod);
  }

  async function deleteProduct(id) {
    var prod = allProducts.find(function (p) { return p.id === id; });
    if (!prod) return;
    if (!confirm('Are you sure you want to delete "' + prod.name + '"?')) return;

    if (sb) {
      try {
        var { error } = await sb.from('products').delete().eq('id', id);
        if (error) throw error;
        if (prod.image_url) {
          await deleteStorageFile('products', prod.image_url);
        }
        showToast('Product deleted.');
      } catch (e) {
        alert('Delete failed: ' + (e.message || 'Unknown error'));
        return;
      }
    }
    await loadProducts();
    await loadOverviewData();
  }

  // ===== ENQUIRIES SECTION WITH SEARCH, STATUS FILTER, CSV EXPORT & PAGINATION =====
  var allEnquiries = [];
  var filteredEnquiries = [];
  var currentEnquiryPage = 1;
  var pageSize = 10;

  async function loadEnquiries() {
    if (!sb) return;
    try {
      var { data, error } = await sb.from('enquiries').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      allEnquiries = data || [];
      applyEnquiryFilters();
    } catch (e) {
      console.warn('Enquiries load error:', e);
      if (enquiriesBody) enquiriesBody.innerHTML = '<tr><td colspan="7" class="admin-empty error">Could not load enquiries from database.</td></tr>';
    }
  }

  function applyEnquiryFilters() {
    var query = (enquirySearchInput ? enquirySearchInput.value : '').toLowerCase().trim();
    var status = (enquiryStatusFilter ? enquiryStatusFilter.value : 'all');

    filteredEnquiries = allEnquiries.filter(function (eq) {
      var matchesStatus = (status === 'all') || (eq.status === status);
      var text = ((eq.name || '') + ' ' + (eq.phone || '') + ' ' + (eq.product || '') + ' ' + (eq.message || '')).toLowerCase();
      var matchesQuery = !query || (text.indexOf(query) !== -1);
      return matchesStatus && matchesQuery;
    });

    currentEnquiryPage = 1;
    renderEnquiriesTable();
  }

  if (enquirySearchInput) {
    enquirySearchInput.addEventListener('input', applyEnquiryFilters);
  }
  if (enquiryStatusFilter) {
    enquiryStatusFilter.addEventListener('change', applyEnquiryFilters);
  }

  function renderEnquiriesTable() {
    var total = filteredEnquiries.length;
    var totalPages = Math.ceil(total / pageSize) || 1;
    if (currentEnquiryPage > totalPages) currentEnquiryPage = totalPages;

    var startIdx = (currentEnquiryPage - 1) * pageSize;
    var endIdx = Math.min(startIdx + pageSize, total);
    var pageItems = filteredEnquiries.slice(startIdx, endIdx);

    if (enquiryPageInfo) {
      enquiryPageInfo.textContent = total === 0 ? 'Showing 0 of 0' : 'Showing ' + (startIdx + 1) + '–' + endIdx + ' of ' + total + ' enquiries';
    }
    if (enquiryPrevPage) enquiryPrevPage.disabled = currentEnquiryPage <= 1;
    if (enquiryNextPage) enquiryNextPage.disabled = currentEnquiryPage >= totalPages;

    // Desktop table
    if (enquiriesBody) {
      if (!pageItems.length) {
        enquiriesBody.innerHTML = '<tr><td colspan="7" class="admin-empty">No matching enquiries found.</td></tr>';
      } else {
        enquiriesBody.innerHTML = pageItems.map(function (eq) {
          var d = eq.created_at ? new Date(eq.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
          return '<tr data-eq-id="' + esc(eq.id) + '">' +
            '<td>' + d + '</td>' +
            '<td><strong>' + esc(eq.name || '—') + '</strong></td>' +
            '<td><a href="tel:' + esc(eq.phone || '') + '" style="color:var(--admin-teal);">' + esc(eq.phone || '—') + '</a></td>' +
            '<td>' + esc(eq.product || 'General') + '</td>' +
            '<td style="max-width:220px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;" title="' + esc(eq.message || '') + '">' + esc(eq.message || '—') + '</td>' +
            '<td><select class="admin-status-select" data-id="' + esc(eq.id) + '">' +
              '<option value="New"' + (eq.status === 'New' ? ' selected' : '') + '>New</option>' +
              '<option value="Contacted"' + (eq.status === 'Contacted' ? ' selected' : '') + '>Contacted</option>' +
              '<option value="Closed"' + (eq.status === 'Closed' ? ' selected' : '') + '>Closed</option>' +
            '</select></td>' +
            '<td><button class="admin-action-btn danger delete-eq-btn" data-id="' + esc(eq.id) + '">Delete</button></td>' +
          '</tr>';
        }).join('');

        enquiriesBody.querySelectorAll('.admin-status-select').forEach(function (sel) {
          var originalVal = sel.value;
          sel.addEventListener('change', function () {
            updateEnquiryStatus(sel.getAttribute('data-id'), sel.value, sel, originalVal);
          });
        });
        enquiriesBody.querySelectorAll('.delete-eq-btn').forEach(function (btn) {
          btn.addEventListener('click', function () {
            deleteEnquiry(btn.getAttribute('data-id'));
          });
        });
      }
    }

    // Mobile list
    if (enquiriesMobileList) {
      if (!pageItems.length) {
        enquiriesMobileList.innerHTML = '<p style="text-align:center;color:#5a7389;padding:30px;font-style:italic;">No enquiries found.</p>';
      } else {
        enquiriesMobileList.innerHTML = pageItems.map(function (eq) {
          var d = eq.created_at ? new Date(eq.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
          return '<div class="admin-eq-card" data-eq-id="' + esc(eq.id) + '">' +
            '<div class="admin-eq-card-top">' +
              '<span class="admin-eq-card-name">' + esc(eq.name || 'Anonymous') + '</span>' +
              '<span class="admin-eq-card-date">' + d + '</span>' +
            '</div>' +
            (eq.phone ? '<div class="admin-eq-card-phone"><a href="tel:' + esc(eq.phone) + '" style="color:inherit;text-decoration:none;">📞 ' + esc(eq.phone) + '</a></div>' : '') +
            (eq.product ? '<div class="admin-eq-card-product"><span>Product: </span>' + esc(eq.product) + '</div>' : '') +
            (eq.message ? '<div class="admin-eq-card-msg">' + esc(eq.message) + '</div>' : '') +
            '<div class="admin-eq-card-footer">' +
              '<select class="admin-status-select mobile-sel" data-id="' + esc(eq.id) + '">' +
                '<option value="New"' + (eq.status === 'New' ? ' selected' : '') + '>New</option>' +
                '<option value="Contacted"' + (eq.status === 'Contacted' ? ' selected' : '') + '>Contacted</option>' +
                '<option value="Closed"' + (eq.status === 'Closed' ? ' selected' : '') + '>Closed</option>' +
              '</select>' +
              '<button class="admin-action-btn danger mobile-del-btn" data-id="' + esc(eq.id) + '">Delete</button>' +
            '</div>' +
          '</div>';
        }).join('');

        enquiriesMobileList.querySelectorAll('.mobile-sel').forEach(function (sel) {
          var orig = sel.value;
          sel.addEventListener('change', function () {
            updateEnquiryStatus(sel.getAttribute('data-id'), sel.value, sel, orig);
          });
        });
        enquiriesMobileList.querySelectorAll('.mobile-del-btn').forEach(function (btn) {
          btn.addEventListener('click', function () {
            deleteEnquiry(btn.getAttribute('data-id'));
          });
        });
      }
    }
  }

  if (enquiryPrevPage) {
    enquiryPrevPage.addEventListener('click', function () {
      if (currentEnquiryPage > 1) {
        currentEnquiryPage--;
        renderEnquiriesTable();
      }
    });
  }
  if (enquiryNextPage) {
    enquiryNextPage.addEventListener('click', function () {
      var totalPages = Math.ceil(filteredEnquiries.length / pageSize) || 1;
      if (currentEnquiryPage < totalPages) {
        currentEnquiryPage++;
        renderEnquiriesTable();
      }
    });
  }

  // Update enquiry status with rollback on failure
  async function updateEnquiryStatus(id, newStatus, selectEl, previousVal) {
    if (!sb) return;
    try {
      var { error } = await sb.from('enquiries').update({ status: newStatus }).eq('id', id);
      if (error) throw error;
      var eq = allEnquiries.find(function (e) { return e.id === id; });
      if (eq) eq.status = newStatus;
      showToast('Status updated to ' + newStatus);
      await loadOverviewData();
    } catch (e) {
      console.error('Status update error:', e);
      showToast('Failed to update status: ' + (e.message || 'Network error'), true);
      // Rollback select value
      if (selectEl && previousVal) selectEl.value = previousVal;
    }
  }

  async function deleteEnquiry(id) {
    if (!confirm('Are you sure you want to delete this enquiry record?')) return;
    if (!sb) return;
    try {
      var { error } = await sb.from('enquiries').delete().eq('id', id);
      if (error) throw error;
      showToast('Enquiry record deleted.');
      await loadEnquiries();
      await loadOverviewData();
    } catch (e) {
      alert('Delete failed: ' + (e.message || 'Unknown error'));
    }
  }

  // Export Enquiries as CSV
  if (exportEnquiriesCsvBtn) {
    exportEnquiriesCsvBtn.addEventListener('click', function () {
      if (!allEnquiries.length) {
        alert('No enquiries to export.');
        return;
      }
      var headers = ['Date', 'Name', 'Phone', 'Product', 'Message', 'Source Page', 'Status'];
      var rows = allEnquiries.map(function (eq) {
        var d = eq.created_at ? new Date(eq.created_at).toISOString().split('T')[0] : '';
        return [
          d,
          '"' + (eq.name || '').replace(/"/g, '""') + '"',
          '"' + (eq.phone || '').replace(/"/g, '""') + '"',
          '"' + (eq.product || '').replace(/"/g, '""') + '"',
          '"' + (eq.message || '').replace(/"/g, '""') + '"',
          '"' + (eq.source_page || '').replace(/"/g, '""') + '"',
          '"' + (eq.status || 'New') + '"'
        ].join(',');
      });
      var csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), rows.join('\n')].join('\n');
      var encodedUri = encodeURI(csvContent);
      var link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', 'signoret_enquiries_' + new Date().toISOString().split('T')[0] + '.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
    });
  }

  // ===== SITE SETTINGS SECTION WITH VALIDATION =====
  async function loadSettings() {
    if (!sb) return;
    try {
      var { data, error } = await sb.from('settings').select('*').limit(1).single();
      if (error) {
        // Fallback to site_settings table
        var res = await sb.from('site_settings').select('*').limit(1).single();
        if (!res.error) data = res.data;
      }
      if (data) {
        document.getElementById('settingPhone').value = data.phone || '+91 81988 88864';
        document.getElementById('settingWhatsapp').value = data.whatsapp || '918198888864';
        document.getElementById('settingEmail').value = data.email || '';
        document.getElementById('settingAddress').value = data.address || 'Plot No. 556, Industrial Area Phase-9, Mohali, Punjab 160062';
      }
    } catch (e) {
      console.warn('Settings load error:', e);
    }
  }

  if (settingsForm) {
    settingsForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      if (!sb) return;

      var phone = document.getElementById('settingPhone').value.trim();
      var whatsapp = document.getElementById('settingWhatsapp').value.trim();
      var email = document.getElementById('settingEmail').value.trim();
      var address = document.getElementById('settingAddress').value.trim();

      // Validate WhatsApp digits only (e.g. 918198888864)
      if (!/^\d{10,13}$/.test(whatsapp)) {
        settingsStatus.textContent = 'WhatsApp number must contain only digits including country code (10–13 digits, e.g. 918198888864).';
        settingsStatus.className = 'admin-form-status error';
        return;
      }
      if (!phone || !address) {
        settingsStatus.textContent = 'Phone number and address cannot be blank.';
        settingsStatus.className = 'admin-form-status error';
        return;
      }

      settingsStatus.textContent = 'Saving settings to database…';
      settingsStatus.className = 'admin-form-status';

      try {
        var payload = {
          phone: phone,
          whatsapp: whatsapp,
          email: email,
          address: address,
          updated_at: new Date().toISOString()
        };

        var { error: setErr } = await sb.from('settings').upsert({ id: 'main', ...payload });
        if (setErr) {
          // Fallback to site_settings
          var { error: fallbackErr } = await sb.from('site_settings').upsert({ id: 'main', ...payload });
          if (fallbackErr) throw fallbackErr;
        }

        settingsStatus.textContent = '✓ Settings saved successfully and applied sitewide!';
        settingsStatus.className = 'admin-form-status success';
        showToast('Site settings updated.');
      } catch (err) {
        console.error('Settings save error:', err);
        settingsStatus.textContent = 'Error: ' + (err.message || 'Could not save settings.');
        settingsStatus.className = 'admin-form-status error';
        showToast('Settings save failed.', true);
      }
    });
  }

  // ===== BLOG POSTS CRUD WITH DRAFT / PUBLISHED TOGGLE =====
  var allPosts = [];

  async function loadPosts() {
    if (!sb) return;
    try {
      var { data, error } = await sb.from('posts').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      allPosts = data || [];
      renderPostsTable();
    } catch (e) {
      console.warn('Posts load error:', e);
      if (postsBody) postsBody.innerHTML = '<tr><td colspan="6" class="admin-empty error">Could not load posts.</td></tr>';
    }
  }

  function renderPostsTable() {
    if (postsBody) {
      if (!allPosts.length) {
        postsBody.innerHTML = '<tr><td colspan="6" class="admin-empty">No blog posts yet. Click "+ Add Post" to create one.</td></tr>';
      } else {
        postsBody.innerHTML = allPosts.map(function (post) {
          var img = (post.image_url || post.photo) ? '<img class="admin-product-thumb" src="' + esc(post.image_url || post.photo) + '" alt="" />' : '<span style="color:var(--admin-muted);font-size:.8rem">No img</span>';
          var d = post.date || (post.created_at ? new Date(post.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—');
          var statusBadge = post.published
            ? '<span class="admin-badge admin-badge-published">Published</span>'
            : '<span class="admin-badge admin-badge-draft">Draft</span>';

          return '<tr>' +
            '<td>' + d + '</td>' +
            '<td>' + img + '</td>' +
            '<td><strong>' + esc(post.title || 'Untitled') + '</strong></td>' +
            '<td>' + esc(post.category || 'Industry') + '</td>' +
            '<td>' + statusBadge + '</td>' +
            '<td style="white-space:nowrap;">' +
              '<button class="admin-action-btn edit-post-btn" data-id="' + esc(post.id) + '">Edit</button>' +
              '<button class="admin-action-btn danger delete-post-btn" data-id="' + esc(post.id) + '">Delete</button>' +
            '</td>' +
          '</tr>';
        }).join('');

        postsBody.querySelectorAll('.edit-post-btn').forEach(function (btn) {
          btn.addEventListener('click', function () { editPost(btn.getAttribute('data-id')); });
        });
        postsBody.querySelectorAll('.delete-post-btn').forEach(function (btn) {
          btn.addEventListener('click', function () { deletePost(btn.getAttribute('data-id')); });
        });
      }
    }

    if (postsMobileList) {
      if (!allPosts.length) {
        postsMobileList.innerHTML = '<p style="text-align:center;color:#5a7389;padding:30px;font-style:italic;">No blog posts yet.</p>';
      } else {
        postsMobileList.innerHTML = allPosts.map(function (post) {
          var d = post.date || (post.created_at ? new Date(post.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—');
          var imgHtml = (post.image_url || post.photo)
            ? '<img src="' + esc(post.image_url || post.photo) + '" alt="" />'
            : '<span>No img</span>';
          var statusBadge = post.published
            ? '<span class="admin-badge admin-badge-published" style="font-size:0.7rem;padding:2px 7px;">Published</span>'
            : '<span class="admin-badge admin-badge-draft" style="font-size:0.7rem;padding:2px 7px;">Draft</span>';

          return '<div class="admin-post-card" data-post-id="' + esc(post.id) + '">' +
            '<div class="admin-post-card-img">' + imgHtml + '</div>' +
            '<div class="admin-post-card-body">' +
              '<div class="admin-post-card-title">' + esc(post.title || 'Untitled') + '</div>' +
              '<div class="admin-post-card-meta">' +
                '<span class="admin-post-card-cat">' + esc(post.category || 'Industry') + '</span>' +
                statusBadge +
                '<span class="admin-post-card-date">' + d + '</span>' +
              '</div>' +
              '<div class="admin-post-card-actions">' +
                '<button class="admin-action-btn edit-post-mob-btn" data-id="' + esc(post.id) + '">Edit</button>' +
                '<button class="admin-action-btn danger delete-post-mob-btn" data-id="' + esc(post.id) + '">Delete</button>' +
              '</div>' +
            '</div>' +
          '</div>';
        }).join('');

        postsMobileList.querySelectorAll('.edit-post-mob-btn').forEach(function (btn) {
          btn.addEventListener('click', function () { editPost(btn.getAttribute('data-id')); });
        });
        postsMobileList.querySelectorAll('.delete-post-mob-btn').forEach(function (btn) {
          btn.addEventListener('click', function () { deletePost(btn.getAttribute('data-id')); });
        });
      }
    }
  }

  function openPostModal(post) {
    if (!postModal) return;
    postModalTitle.textContent = post ? 'Edit Blog Post' : 'Add Blog Post';
    document.getElementById('postId').value = post ? post.id : '';
    document.getElementById('postTitle').value = post ? post.title || '' : '';
    document.getElementById('postCategory').value = post ? post.category || 'Industry Updates' : 'Industry Updates';
    document.getElementById('postDate').value = post ? post.date || '' : new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
    document.getElementById('postBody').value = post ? post.body || post.description || '' : '';
    document.getElementById('postImageUrl').value = post ? post.image_url || post.photo || '' : '';
    document.getElementById('postPublished').checked = post ? Boolean(post.published) : true;

    var preview = document.getElementById('postImagePreview');
    var existingImg = post ? post.image_url || post.photo : '';
    if (existingImg) {
      preview.src = existingImg;
      preview.style.display = 'block';
    } else {
      preview.src = '';
      preview.style.display = 'none';
    }

    if (postImageFile) postImageFile.value = '';
    if (postFormStatus) postFormStatus.textContent = '';
    postModal.classList.add('open');
  }

  function closePostModal() {
    if (postModal) postModal.classList.remove('open');
  }

  if (addPostBtn) addPostBtn.addEventListener('click', function () { openPostModal(null); });
  if (postModalClose) postModalClose.addEventListener('click', closePostModal);
  if (postCancelBtn) postCancelBtn.addEventListener('click', closePostModal);
  if (postModal) {
    postModal.addEventListener('click', function (e) {
      if (e.target === postModal) closePostModal();
    });
  }

  if (postImageFile) {
    postImageFile.addEventListener('change', async function () {
      var file = this.files && this.files[0];
      var preview = document.getElementById('postImagePreview');
      if (file && preview) {
        try {
          var compressed = await validateAndCompressImage(file);
          preview.src = URL.createObjectURL(compressed);
          preview.style.display = 'block';
        } catch (err) {
          alert(err.message);
          this.value = '';
          preview.style.display = 'none';
        }
      }
    });
  }

  if (postForm) {
    postForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      var id = document.getElementById('postId').value;
      var title = document.getElementById('postTitle').value.trim();
      var category = document.getElementById('postCategory').value.trim() || 'Industry Updates';
      var date = document.getElementById('postDate').value.trim();
      var body = document.getElementById('postBody').value.trim();
      var published = document.getElementById('postPublished').checked;
      var imageUrl = document.getElementById('postImageUrl').value;

      if (!title || !body) {
        if (postFormStatus) {
          postFormStatus.textContent = 'Please provide title and body content.';
          postFormStatus.className = 'admin-form-status error';
        }
        return;
      }

      if (postFormStatus) {
        postFormStatus.textContent = 'Saving post…';
        postFormStatus.className = 'admin-form-status';
      }

      try {
        var oldImageUrl = id ? (allPosts.find(function (p) { return p.id === id; }) || {}).image_url : null;

        if (sb && postImageFile && postImageFile.files && postImageFile.files[0]) {
          var file = await validateAndCompressImage(postImageFile.files[0]);
          var ext = file.name.split('.').pop() || 'jpg';
          var fileName = 'post_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7) + '.' + ext;
          var { error: uploadError } = await sb.storage.from('blog').upload(fileName, file, { upsert: true });
          if (uploadError) throw new Error('Blog image upload failed: ' + uploadError.message);
          var { data: urlData } = sb.storage.from('blog').getPublicUrl(fileName);
          if (urlData) {
            imageUrl = urlData.publicUrl;
            if (oldImageUrl && oldImageUrl !== imageUrl) {
              await deleteStorageFile('blog', oldImageUrl);
            }
          }
        }

        var slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        var record = {
          title: title,
          category: category,
          date: date,
          body: body,
          description: body,
          published: published,
          image_url: imageUrl,
          slug: slug
        };

        if (sb) {
          if (id) {
            var { error: updErr } = await sb.from('posts').update(record).eq('id', id);
            if (updErr) throw updErr;
          } else {
            var { error: insErr } = await sb.from('posts').insert([record]);
            if (insErr) throw insErr;
          }
        }

        closePostModal();
        showToast('Blog post saved successfully!');
        await loadPosts();
      } catch (err) {
        console.error('Post save error:', err);
        if (postFormStatus) {
          postFormStatus.textContent = 'Error: ' + (err.message || 'Could not save post.');
          postFormStatus.className = 'admin-form-status error';
        }
      }
    });
  }

  function editPost(id) {
    var post = allPosts.find(function (p) { return p.id === id; });
    if (post) openPostModal(post);
  }

  async function deletePost(id) {
    var post = allPosts.find(function (p) { return p.id === id; });
    if (!post) return;
    if (!confirm('Are you sure you want to delete this blog post?')) return;

    if (sb) {
      try {
        var { error } = await sb.from('posts').delete().eq('id', id);
        if (error) throw error;
        if (post.image_url) {
          await deleteStorageFile('blog', post.image_url);
        }
        showToast('Post deleted.');
      } catch (e) {
        alert('Delete failed: ' + (e.message || 'Unknown error'));
        return;
      }
    }
    await loadPosts();
  }

  // ===== PROMOTE PRODUCT (Admin Dashboard) =====
  var adminPromoteModal = document.getElementById('adminPromoteModal');
  var adminPromoteClose = document.getElementById('adminPromoteClose');
  var adminPromoteImg = document.getElementById('adminPromoteImg');
  var adminPromoteTitle = document.getElementById('adminPromoteTitle');
  var adminPromoteSub = document.getElementById('adminPromoteSub');
  var adminShareWa = document.getElementById('adminShareWa');
  var adminShareCopy = document.getElementById('adminShareCopy');
  var adminPromoteToast = document.getElementById('adminPromoteToast');
  var activePromoteProduct = null;

  function promoteProduct(id) {
    var product = allProducts.find(function (p) { return p.id === id; });
    if (!product || !adminPromoteModal) return;
    activePromoteProduct = product;

    if (adminPromoteImg) {
      adminPromoteImg.src = product.image_url || 'images/products/placeholder.svg';
      adminPromoteImg.alt = product.name || '';
    }
    if (adminPromoteTitle) adminPromoteTitle.textContent = product.name || 'Product';
    if (adminPromoteSub) adminPromoteSub.textContent = product.composition || product.pack_size || '';

    // Product-specific shareable link
    var slug = product.slug || (product.name ? product.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') : product.id);
    var origin = (window.SIGNORET_CONFIG && window.SIGNORET_CONFIG.SITE_URL) || window.location.origin;
    var productUrl = origin + '/products.html?product=' + encodeURIComponent(slug);

    var shareText = (product.name || '') +
      (product.composition ? ' | ' + product.composition : '') +
      (product.pack_size ? ' | Pack: ' + product.pack_size : '') +
      ' — Signoret Pharmaceuticals Pvt. Ltd. (Plot No. 556, Industrial Area Phase-9, Mohali, Punjab 160062). Call/WhatsApp: +91 81988 88864. View product details: ' + productUrl;

    if (adminShareWa) {
      adminShareWa.href = 'https://api.whatsapp.com/send?text=' + encodeURIComponent(shareText);
    }

    if (adminShareCopy) {
      adminShareCopy.onclick = function () {
        if (navigator.clipboard) {
          navigator.clipboard.writeText(productUrl).then(function () {
            showPromoteToast('Product-specific link copied to clipboard!');
          });
        } else {
          showPromoteToast('Link: ' + productUrl);
        }
      };
    }

    if (adminPromoteToast) adminPromoteToast.style.display = 'none';
    adminPromoteModal.classList.add('open');
  }

  function closePromoteModal() {
    if (adminPromoteModal) adminPromoteModal.classList.remove('open');
  }

  function showPromoteToast(msg) {
    if (!adminPromoteToast) return;
    adminPromoteToast.textContent = msg;
    adminPromoteToast.style.display = 'block';
    setTimeout(function () { adminPromoteToast.style.display = 'none'; }, 3500);
  }

  if (adminPromoteClose) adminPromoteClose.addEventListener('click', closePromoteModal);
  if (adminPromoteModal) {
    adminPromoteModal.addEventListener('click', function (e) {
      if (e.target === adminPromoteModal) closePromoteModal();
    });
  }

  // Keyboard navigation & escape
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      closePromoteModal();
      closeProductModal();
      closePostModal();
      closeMobileSidebar();
    }
  });

  // Global interface expose
  window.AdminDashboard = {
    editProduct: editProduct,
    deleteProduct: deleteProduct,
    promoteProduct: promoteProduct,
    updateEnquiryStatus: updateEnquiryStatus,
    deleteEnquiry: deleteEnquiry,
    editPost: editPost,
    deletePost: deletePost
  };

  // Initialize session
  checkSession();

}());
