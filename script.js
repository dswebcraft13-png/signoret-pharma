/**
 * Signoret Pharmaceuticals Pvt. Ltd.
 * Main Client & Frontend Application Logic
 * Phone & WhatsApp: +91 81988 88864
 * Plot No. 556, Industrial Area Phase-9, Mohali, Punjab 160062
 */

(function () {
  'use strict';

  // Google Analytics 4 — initialized only if measurement ID is provided in config
  var GA_MEASUREMENT_ID = (window.SIGNORET_CONFIG && window.SIGNORET_CONFIG.GA_MEASUREMENT_ID) || '';
  if (GA_MEASUREMENT_ID) {
    var gaScript = document.createElement('script');
    gaScript.async = true;
    gaScript.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(GA_MEASUREMENT_ID);
    document.head.appendChild(gaScript);
    window.dataLayer = window.dataLayer || [];
    function gtag(){ window.dataLayer.push(arguments); }
    gtag('js', new Date());
    gtag('config', GA_MEASUREMENT_ID);
  }

  var PHONE_NUMBER = '+91 81988 88864';
  var WA_NUMBER = '918198888864';
  var COMPANY_NAME = 'Signoret Pharmaceuticals Pvt. Ltd.';

  function getWaNumber() {
    return (window.SIGNORET_SETTINGS && window.SIGNORET_SETTINGS.whatsapp) || WA_NUMBER;
  }
  function getPhoneNumber() {
    return (window.SIGNORET_SETTINGS && window.SIGNORET_SETTINGS.phone) || PHONE_NUMBER;
  }

  // HTML escaping helper for safe DOM insertion
  function esc(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // Indian mobile validation: 10 digits starting with 6-9
  function isValidIndianMobile(phoneStr) {
    if (!phoneStr) return false;
    var cleaned = phoneStr.replace(/[\s\-\(\)\+]/g, '');
    if (cleaned.length === 12 && cleaned.startsWith('91')) {
      cleaned = cleaned.substring(2);
    } else if (cleaned.length === 11 && cleaned.startsWith('0')) {
      cleaned = cleaned.substring(1);
    }
    return /^[6-9]\d{9}$/.test(cleaned);
  }

  // Helper to show form error in red and move focus
  function showFormError(statusEl, inputEl, message) {
    if (statusEl) {
      statusEl.innerHTML = '<span style="color:#dc2626;font-weight:600;">⚠ ' + esc(message) + '</span>';
    }
    if (inputEl) {
      inputEl.focus();
    }
  }

  // --- Mobile Hamburger Navigation Drawer ---
  var navToggle = document.getElementById('navToggle');
  var navLinks = document.getElementById('navLinks');
  var navBackdrop = document.getElementById('navBackdrop');

  function openNav() {
    if (!navToggle || !navLinks) return;
    navToggle.classList.add('open');
    navToggle.setAttribute('aria-expanded', 'true');
    navLinks.classList.add('open');
    if (navBackdrop) navBackdrop.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function closeNav() {
    if (!navToggle || !navLinks) return;
    navToggle.classList.remove('open');
    navToggle.setAttribute('aria-expanded', 'false');
    navLinks.classList.remove('open');
    if (navBackdrop) navBackdrop.classList.remove('open');
    document.body.style.overflow = '';
  }

  if (navToggle) {
    navToggle.addEventListener('click', function () {
      if (navLinks && navLinks.classList.contains('open')) {
        closeNav();
      } else {
        openNav();
      }
    });
  }

  if (navBackdrop) {
    navBackdrop.addEventListener('click', closeNav);
  }

  if (navLinks) {
    navLinks.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        if (window.innerWidth <= 960) {
          closeNav();
        }
      });
    });
  }

  // Highlight active link based on current path
  try {
    var path = window.location.pathname.split('/').pop() || 'index.html';
    if (navLinks) {
      navLinks.querySelectorAll('a').forEach(function (link) {
        var href = link.getAttribute('href');
        if (href && (href === path || (path === '' && href === 'index.html') || (path === 'index.html' && href === 'index.html'))) {
          link.classList.add('active');
        }
      });
    }
  } catch (e) {}

  // --- Scroll-reveal animation ---
  var revealItems = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('on');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });
    revealItems.forEach(function (item) { observer.observe(item); });
  } else {
    revealItems.forEach(function (item) { item.classList.add('on'); });
  }

  // --- Accessibility focus management for modals ---
  var lastFocusedTrigger = null;

  function trapFocus(modalEl, e) {
    if (e.key !== 'Tab' || !modalEl || !modalEl.classList.contains('open')) return;
    var focusables = modalEl.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    if (!focusables.length) return;
    var first = focusables[0];
    var last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  // --- Lightbox Modal for HD Product Photos ---
  var imageModal = document.getElementById('imageModal');
  var modalImg = document.getElementById('modalImg');
  var modalTitle = document.getElementById('modalTitle');
  var modalSub = document.getElementById('modalSub');
  var modalClose = document.getElementById('modalClose');
  var modalWaBtn = document.getElementById('modalWaBtn');

  function openImageModal(imgSrc, title, subtitle, triggerEl) {
    if (!imageModal) return;
    lastFocusedTrigger = triggerEl || document.activeElement;
    if (modalImg) modalImg.src = imgSrc || 'images/products/placeholder.svg';
    if (modalTitle) modalTitle.textContent = title || 'Medicine Packaging';
    if (modalSub) modalSub.textContent = subtitle || 'Signoret Pharmaceuticals Pvt. Ltd.';
    if (modalWaBtn) {
      var msg = 'Hello ' + COMPANY_NAME + ', I want to enquire about ' + (title || 'your products') + '.';
      modalWaBtn.href = 'https://wa.me/' + getWaNumber() + '?text=' + encodeURIComponent(msg);
    }
    imageModal.classList.add('open');
    document.body.style.overflow = 'hidden';
    if (modalClose) modalClose.focus();
  }

  function closeImageModal() {
    if (!imageModal) return;
    imageModal.classList.remove('open');
    document.body.style.overflow = '';
    if (lastFocusedTrigger) {
      lastFocusedTrigger.focus();
      lastFocusedTrigger = null;
    }
  }

  if (modalClose) modalClose.addEventListener('click', closeImageModal);
  if (imageModal) {
    imageModal.addEventListener('click', function (e) {
      if (e.target === imageModal) closeImageModal();
    });
    imageModal.addEventListener('keydown', function (e) { trapFocus(imageModal, e); });
  }

  // --- Product Detail View Modal (for Shareable Links / Deep Links) ---
  var productDetailModal = document.getElementById('productDetailModal');
  var productDetailClose = document.getElementById('productDetailClose');
  var productDetailBody = document.getElementById('productDetailBody');

  function openProductDetail(product, triggerEl) {
    if (!productDetailModal || !productDetailBody) return;
    lastFocusedTrigger = triggerEl || document.activeElement;

    var waMsg = 'Hello ' + COMPANY_NAME + ', I want to enquire about ' + product.name + (product.composition ? ' (' + product.composition + ')' : '') + '.';
    var waUrl = 'https://wa.me/' + getWaNumber() + '?text=' + encodeURIComponent(waMsg);
    var imgSrc = product.hdImage || product.image || 'images/products/placeholder.svg';

    productDetailBody.innerHTML = '' +
      '<div style="text-align:center;margin-bottom:20px;">' +
        '<img src="' + esc(imgSrc) + '" alt="' + esc(product.name) + '" style="max-height:260px;object-fit:contain;margin:0 auto;border-radius:10px;" />' +
      '</div>' +
      '<div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">' +
        '<span style="background:rgba(0,122,114,0.1);color:var(--teal);padding:4px 12px;border-radius:999px;font-weight:700;font-size:0.8rem;">' + esc(product.category || 'Tablets') + '</span>' +
        (product.badge ? '<span style="background:var(--surface-2);color:var(--blue);padding:4px 12px;border-radius:999px;font-weight:600;font-size:0.8rem;">' + esc(product.badge) + '</span>' : '') +
      '</div>' +
      '<h2 id="modalDetailTitle" style="font-size:1.6rem;color:var(--blue);margin:0 0 8px;">' + esc(product.name) + '</h2>' +
      '<p style="font-size:1rem;color:var(--ink);font-weight:500;margin:0 0 14px;"><strong>Composition:</strong> ' + esc(product.composition || 'As per specification') + '</p>' +
      '<p style="font-size:0.92rem;color:var(--muted);margin:0 0 16px;"><strong>Packaging:</strong> ' + esc(product.packing || 'Standard Blister/Bottle/Vial Pack') + '</p>' +
      (product.description ? '<div style="background:var(--surface-2);padding:14px 18px;border-radius:10px;margin-bottom:20px;font-size:0.92rem;color:var(--ink);line-height:1.6;">' + esc(product.description) + '</div>' : '') +
      '<div style="display:flex;gap:12px;flex-wrap:wrap;margin-top:20px;">' +
        '<a class="btn btn-primary" href="' + esc(waUrl) + '" target="_blank" rel="noopener" style="flex:1;justify-content:center;">Enquire on WhatsApp &#8599;</a>' +
        '<a class="btn btn-secondary" href="tel:+918198888864" style="flex:1;justify-content:center;">Call Now</a>' +
      '</div>';

    productDetailModal.classList.add('open');
    document.body.style.overflow = 'hidden';
    if (productDetailClose) productDetailClose.focus();
  }

  function closeProductDetail() {
    if (!productDetailModal) return;
    productDetailModal.classList.remove('open');
    document.body.style.overflow = '';
    if (lastFocusedTrigger) {
      lastFocusedTrigger.focus();
      lastFocusedTrigger = null;
    }
  }

  if (productDetailClose) productDetailClose.addEventListener('click', closeProductDetail);
  if (productDetailModal) {
    productDetailModal.addEventListener('click', function (e) {
      if (e.target === productDetailModal) closeProductDetail();
    });
    productDetailModal.addEventListener('keydown', function (e) { trapFocus(productDetailModal, e); });
  }

  // --- Promote / Social Share Modal ---
  var shareModal = document.getElementById('shareModal');
  var shareClose = document.getElementById('shareClose');
  var sharePreviewImg = document.getElementById('sharePreviewImg');
  var sharePreviewTitle = document.getElementById('sharePreviewTitle');
  var sharePreviewSub = document.getElementById('sharePreviewSub');
  var shareWaBtn = document.getElementById('shareWaBtn');
  var shareCopyBtn = document.getElementById('shareCopyBtn');
  var shareToast = document.getElementById('shareToast');
  var currentShareItem = null;

  function openShareModal(item, triggerEl) {
    if (!shareModal) return;
    lastFocusedTrigger = triggerEl || document.activeElement;
    currentShareItem = item;
    var title = item.name || 'Pharmaceutical Formulation';
    var subtitle = item.composition || item.packing || '';
    var img = item.image || 'images/products/placeholder.svg';

    if (sharePreviewImg) sharePreviewImg.src = img;
    if (sharePreviewTitle) sharePreviewTitle.textContent = title;
    if (sharePreviewSub) sharePreviewSub.textContent = subtitle;

    var shareData = window.SignoretData ? window.SignoretData.generateShareData(item) : {
      whatsappUrl: 'https://wa.me/' + getWaNumber() + '?text=' + encodeURIComponent(title + ' - Signoret Pharmaceuticals: +91 81988 88864'),
      url: window.location.href
    };

    if (shareWaBtn) shareWaBtn.href = shareData.whatsappUrl;
    if (shareToast) shareToast.style.display = 'none';

    shareModal.classList.add('open');
    document.body.style.overflow = 'hidden';
    if (shareClose) shareClose.focus();
  }

  function closeShareModal() {
    if (!shareModal) return;
    shareModal.classList.remove('open');
    document.body.style.overflow = '';
    if (lastFocusedTrigger) {
      lastFocusedTrigger.focus();
      lastFocusedTrigger = null;
    }
  }

  if (shareClose) shareClose.addEventListener('click', closeShareModal);
  if (shareModal) {
    shareModal.addEventListener('click', function (e) {
      if (e.target === shareModal) closeShareModal();
    });
    shareModal.addEventListener('keydown', function (e) { trapFocus(shareModal, e); });
  }

  if (shareCopyBtn) {
    shareCopyBtn.addEventListener('click', function (e) {
      e.preventDefault();
      var slug = (currentShareItem && currentShareItem.slug) || (currentShareItem && currentShareItem.id) || '';
      var origin = window.SIGNORET_CONFIG ? window.SIGNORET_CONFIG.SITE_URL : window.location.origin;
      var url = origin + '/products.html?product=' + encodeURIComponent(slug);
      if (navigator.clipboard) {
        navigator.clipboard.writeText(url).then(function () {
          if (shareToast) {
            shareToast.textContent = 'Link copied to clipboard!';
            shareToast.style.display = 'block';
            setTimeout(function () { shareToast.style.display = 'none'; }, 3000);
          }
        });
      }
    });
  }

  // Global keydown escape
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      if (imageModal && imageModal.classList.contains('open')) closeImageModal();
      if (productDetailModal && productDetailModal.classList.contains('open')) closeProductDetail();
      if (shareModal && shareModal.classList.contains('open')) closeShareModal();
      if (navLinks && navLinks.classList.contains('open')) closeNav();
    }
  });

  // --- Dynamic Product Cards Rendering ---
  var dynamicProductsGrid = document.getElementById('dynamicProductsGrid');
  var homeProductsGrid = document.getElementById('homeFeaturedProductsGrid');
  var currentCategoryFilter = 'all';
  var currentSearchQuery = '';
  var allLoadedProducts = [];

  function renderEmptyState(container) {
    if (!container) return;
    container.innerHTML = '<div class="empty-products-state" style="grid-column:1/-1;text-align:center;padding:50px 20px;background:var(--surface);border-radius:16px;border:1px dashed var(--line);">' +
      '<p style="font-size:1.15rem;font-weight:700;color:var(--blue);margin-bottom:8px;">Our product catalogue is being updated.</p>' +
      '<p style="color:var(--muted);margin-bottom:20px;">Please enquire on WhatsApp for the full range.</p>' +
      '<a class="btn btn-primary" href="https://wa.me/' + getWaNumber() + '?text=' + encodeURIComponent('Hello ' + COMPANY_NAME + ', please share your full product catalogue.') + '" target="_blank" rel="noopener">Enquire on WhatsApp &rarr;</a>' +
    '</div>';
  }

  function renderProductCard(product) {
    var categoryClass = (product.category || 'General').toLowerCase().replace(/\s+/g, '-');
    var badgeText = product.badge || product.category || 'Pharma';
    var imageSrc = product.image || 'images/products/placeholder.svg';
    var hdSrc = product.hdImage || imageSrc;

    var article = document.createElement('article');
    article.className = 'product-card reveal on';
    article.setAttribute('data-category', categoryClass);
    article.setAttribute('data-id', product.id || '');
    article.setAttribute('data-name', (product.name || '').toLowerCase());
    article.setAttribute('data-comp', (product.composition || '').toLowerCase());

    var waEnquiryMsg = 'Hello ' + COMPANY_NAME + ', I want to enquire about ' + product.name + ' (' + (product.composition || '') + ').';
    var waUrl = 'https://wa.me/' + getWaNumber() + '?text=' + encodeURIComponent(waEnquiryMsg);

    article.innerHTML = '' +
      '<div class="product-img-wrap zoomable" data-full-img="' + esc(hdSrc) + '" data-title="' + esc(product.name) + '" data-sub="' + esc(product.composition || '') + '" role="button" tabindex="0" aria-label="View packaging for ' + esc(product.name) + '">' +
        '<span class="product-badge-cat">' + esc(badgeText) + '</span>' +
        '<img src="' + esc(imageSrc) + '" alt="' + esc(product.name) + ' by ' + esc(COMPANY_NAME) + '" loading="lazy" />' +
      '</div>' +
      '<div class="product-body">' +
        '<div class="product-info-top">' +
          '<div class="product-header-line">' +
            '<h3>' + esc(product.name) + '</h3>' +
            '<span class="product-form-type">' + esc(product.formType || product.category || 'Medicine') + '</span>' +
          '</div>' +
          '<p class="product-composition">' + esc(product.composition || '') + '</p>' +
          '<div class="product-packing">' +
            '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>' +
            '<span>' + esc(product.packing || 'Standard Blister/Bottle/Vial Pack') + '</span>' +
          '</div>' +
          (product.description ? '<p class="product-desc-snippet">' + esc(product.description) + '</p>' : '') +
        '</div>' +
        '<div class="product-actions">' +
          '<a class="product-wa-btn" href="' + esc(waUrl) + '" target="_blank" rel="noopener">' +
            '<span>Enquire WhatsApp</span>' +
            '<span aria-hidden="true">&#8599;</span>' +
          '</a>' +
          '<button class="product-zoom-btn zoom-trigger" type="button" aria-label="View photo of ' + esc(product.name) + '">' +
            '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/><path d="M11 8v6M8 11h6"/></svg>' +
          '</button>' +
        '</div>' +
      '</div>';

    // Hook zoom triggers
    var zoomables = article.querySelectorAll('.zoomable, .zoom-trigger');
    zoomables.forEach(function (el) {
      el.addEventListener('click', function (e) {
        e.preventDefault();
        openImageModal(hdSrc, product.name, product.composition, el);
      });
      el.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openImageModal(hdSrc, product.name, product.composition, el);
        }
      });
    });

    return article;
  }

  // --- Dynamic Category Filters with Live Counts ---
  function buildCategoryFilters(products) {
    var container = document.getElementById('categoryFilterContainer');
    if (!container) return;

    var counts = { all: products.length };
    var categories = [];
    products.forEach(function (p) {
      var cat = (p.category || 'Tablets').trim();
      if (!counts[cat]) {
        counts[cat] = 0;
        categories.push(cat);
      }
      counts[cat]++;
    });

    container.innerHTML = '';

    // "All Formulations"
    var allBtn = document.createElement('button');
    allBtn.className = 'filter-btn' + (currentCategoryFilter === 'all' ? ' active' : '');
    allBtn.type = 'button';
    allBtn.setAttribute('data-filter', 'all');
    allBtn.innerHTML = 'All Formulations <span class="filter-btn-count">' + counts.all + '</span>';
    allBtn.addEventListener('click', function () { applyFilterAndSearch('all'); });
    container.appendChild(allBtn);

    // Each dynamic category
    categories.forEach(function (cat) {
      var btn = document.createElement('button');
      btn.className = 'filter-btn' + (currentCategoryFilter.toLowerCase() === cat.toLowerCase() ? ' active' : '');
      btn.type = 'button';
      btn.setAttribute('data-filter', cat);
      btn.innerHTML = esc(cat) + ' <span class="filter-btn-count">' + counts[cat] + '</span>';
      btn.addEventListener('click', function () { applyFilterAndSearch(cat); });
      container.appendChild(btn);
    });
  }

  // --- Combined Filtering & Live Search ---
  function applyFilterAndSearch(category) {
    if (category !== undefined) currentCategoryFilter = category;

    // Update active class on filter buttons
    var buttons = document.querySelectorAll('.filter-btn');
    buttons.forEach(function (b) {
      var f = b.getAttribute('data-filter') || '';
      if (f.toLowerCase() === currentCategoryFilter.toLowerCase()) {
        b.classList.add('active');
      } else {
        b.classList.remove('active');
      }
    });

    var cards = document.querySelectorAll('#dynamicProductsGrid .product-card');
    var visibleCount = 0;
    var query = currentSearchQuery.toLowerCase().trim();

    cards.forEach(function (card) {
      var cardCat = (card.getAttribute('data-category') || '').toLowerCase();
      var cardName = (card.getAttribute('data-name') || '').toLowerCase();
      var cardComp = (card.getAttribute('data-comp') || '').toLowerCase();

      var matchesCat = (currentCategoryFilter === 'all') || (cardCat === currentCategoryFilter.toLowerCase().replace(/\s+/g, '-'));
      var matchesQuery = !query || (cardName.indexOf(query) !== -1) || (cardComp.indexOf(query) !== -1);

      if (matchesCat && matchesQuery) {
        card.classList.remove('hidden');
        visibleCount++;
      } else {
        card.classList.add('hidden');
      }
    });

    var emptyMsg = document.getElementById('productsFilterEmptyMsg');
    if (visibleCount === 0 && cards.length > 0) {
      if (!emptyMsg && dynamicProductsGrid) {
        emptyMsg = document.createElement('div');
        emptyMsg.id = 'productsFilterEmptyMsg';
        emptyMsg.style.cssText = 'grid-column:1/-1;text-align:center;padding:40px;color:var(--muted);';
        emptyMsg.innerHTML = 'No products match your search or filter. <a href="https://wa.me/' + getWaNumber() + '" target="_blank" style="color:var(--teal);font-weight:600;">Enquire on WhatsApp</a> for the full range.';
        dynamicProductsGrid.appendChild(emptyMsg);
      }
    } else if (emptyMsg) {
      emptyMsg.remove();
    }
  }

  var searchInput = document.getElementById('productSearchInput');
  if (searchInput) {
    searchInput.addEventListener('input', function (e) {
      currentSearchQuery = e.target.value;
      applyFilterAndSearch();
    });
  }

  // Check URL for shareable product link (?product=<slug_or_id>)
  function checkUrlForProduct(products) {
    if (!products || !products.length) return;
    try {
      var params = new URLSearchParams(window.location.search);
      var queryProduct = params.get('product');
      if (queryProduct) {
        queryProduct = queryProduct.toLowerCase();
        var match = products.find(function (p) {
          return (p.slug && p.slug.toLowerCase() === queryProduct) ||
                 (p.id && String(p.id).toLowerCase() === queryProduct) ||
                 (p.name && p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') === queryProduct);
        });
        if (match) {
          setTimeout(function () {
            openProductDetail(match);
          }, 300);
        }
      }
    } catch (e) {}
  }

  function renderProductsToGrids(products) {
    allLoadedProducts = products || [];

    if (dynamicProductsGrid) {
      dynamicProductsGrid.innerHTML = '';
      if (!allLoadedProducts.length) {
        renderEmptyState(dynamicProductsGrid);
      } else {
        allLoadedProducts.forEach(function (p) {
          dynamicProductsGrid.appendChild(renderProductCard(p));
        });
      }
      buildCategoryFilters(allLoadedProducts);
      applyFilterAndSearch();
    }

    if (homeProductsGrid) {
      homeProductsGrid.innerHTML = '';
      if (!allLoadedProducts.length) {
        renderEmptyState(homeProductsGrid);
      } else {
        // Show featured products first, fallback to first 3
        var featured = allLoadedProducts.filter(function (p) { return p.featured; });
        var toShow = featured.length ? featured.slice(0, 3) : allLoadedProducts.slice(0, 3);
        toShow.forEach(function (p) {
          homeProductsGrid.appendChild(renderProductCard(p));
        });
      }
    }

    checkUrlForProduct(allLoadedProducts);
  }

  // Load products: cached fallback then live Supabase
  if (dynamicProductsGrid || homeProductsGrid) {
    var cached = window.SignoretData ? window.SignoretData.getStoredProducts() : [];
    if (cached && cached.length) {
      renderProductsToGrids(cached);
    } else {
      if (dynamicProductsGrid) dynamicProductsGrid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--muted);">Loading catalogue…</div>';
      if (homeProductsGrid) homeProductsGrid.innerHTML = '<div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--muted);">Loading formulations…</div>';
    }

    if (window.SignoretData && typeof window.SignoretData.loadProductsFromSupabase === 'function') {
      window.SignoretData.loadProductsFromSupabase().then(function (products) {
        renderProductsToGrids(products || []);
      }).catch(function () {
        if (!cached || !cached.length) {
          renderProductsToGrids([]);
        }
      });
    }
  }

  // Site settings
  if (window.SignoretData && typeof window.SignoretData.loadAndApplySettings === 'function') {
    window.SignoretData.loadAndApplySettings().catch(function () {});
  }

  // Lazy Google Map Loader (Home & Contact)
  var showMapBtn = document.getElementById('showMapBtn');
  if (showMapBtn) {
    showMapBtn.addEventListener('click', function () {
      var wrap = document.getElementById('mapFrameWrap');
      if (wrap) {
        wrap.innerHTML = '<iframe title="Signoret Pharmaceuticals Mohali Location" src="https://maps.google.com/maps?q=Plot+No.+556,+Industrial+Area+Phase-9,+Mohali,+Punjab+160062&t=&z=15&ie=UTF8&iwloc=&output=embed" style="width:100%;height:320px;border:0;border-radius:12px;" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>';
      }
    });
  }

  // --- TRUTHFUL ENQUIRY SUBMISSION (Supabase + WhatsApp) ---
  async function saveAndWhatsApp(name, phone, product, message, sourcePage, waUrl, statusEl, submitBtn, hpValue) {
    if (hpValue) {
      console.warn('Rejected spam submission');
      return;
    }

    if (submitBtn) submitBtn.disabled = true;
    if (statusEl) {
      statusEl.innerHTML = '<span style="color:var(--teal);font-weight:600;">Sending enquiry…</span>';
    }

    var saveSuccessful = false;
    if (window.SignoretSupabase && typeof window.SignoretSupabase.saveEnquiry === 'function') {
      try {
        saveSuccessful = await window.SignoretSupabase.saveEnquiry({
          name: name,
          phone: phone,
          product: product || null,
          message: message,
          sourcePage: sourcePage,
          honeypot: hpValue
        });
      } catch (err) {
        saveSuccessful = false;
      }
    }

    if (submitBtn) submitBtn.disabled = false;

    if (saveSuccessful) {
      if (statusEl) {
        statusEl.innerHTML = '<span style="color:var(--success);font-weight:600;">✓ Thank you! Your enquiry has been saved. Opening WhatsApp…</span>';
      }
    } else {
      // Truthful message: never claim a save that did not happen
      if (statusEl) {
        statusEl.innerHTML = '<span style="color:#d97706;font-weight:600;">Opening WhatsApp — if nothing happens, please call us on +91 81988 88864.</span>';
      }
    }

    window.open(waUrl, '_blank', 'noopener');
  }

  // 1. Home Page Enquiry Form
  var waForm = document.getElementById('waForm');
  var formStatus = document.getElementById('formStatus');
  if (waForm) {
    waForm.addEventListener('submit', function (event) {
      event.preventDefault();
      var nameInput = document.getElementById('name');
      var phoneInput = document.getElementById('phone');
      var hpInput = document.getElementById('website_hp');
      var name = nameInput ? nameInput.value.trim() : '';
      var phone = phoneInput ? phoneInput.value.trim() : '';
      var hpValue = hpInput ? hpInput.value.trim() : '';
      var interest = document.getElementById('interest') ? document.getElementById('interest').value : 'General Enquiry';
      var message = document.getElementById('message') ? document.getElementById('message').value.trim() : '';
      var submitBtn = waForm.querySelector('button[type="submit"]');

      if (!name) {
        showFormError(formStatus, nameInput, 'Please enter your name.');
        return;
      }
      if (!isValidIndianMobile(phone)) {
        showFormError(formStatus, phoneInput, 'Please enter a valid 10-digit Indian mobile number (e.g. 9876543210).');
        return;
      }

      var text = 'Hello ' + COMPANY_NAME + ',\n\n' +
                 '*New Website Callback Enquiry*\n' +
                 '• Name: ' + name + '\n' +
                 '• Phone: ' + phone + '\n' +
                 '• Interested in: ' + interest + '\n' +
                 (message ? '• Requirements: ' + message + '\n' : '') +
                 '\nRequested via Signoret Pharmaceuticals Website.';

      var waUrl = 'https://wa.me/' + getWaNumber() + '?text=' + encodeURIComponent(text);
      saveAndWhatsApp(name, phone, null, interest + (message ? ' | ' + message : ''), 'index.html', waUrl, formStatus, submitBtn, hpValue);
    });
  }

  // 2. Third-Party Manufacturing Enquiry Form
  var mfgForm = document.getElementById('mfgEnquiryForm');
  var mfgStatus = document.getElementById('mfgFormStatus');
  if (mfgForm) {
    mfgForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var nameInput = document.getElementById('mfgName');
      var phoneInput = document.getElementById('mfgPhone');
      var hpInput = document.getElementById('mfg_website_hp');
      var name = nameInput ? nameInput.value.trim() : '';
      var phone = phoneInput ? phoneInput.value.trim() : '';
      var hpValue = hpInput ? hpInput.value.trim() : '';
      var dosage = document.getElementById('mfgDosage') ? document.getElementById('mfgDosage').value : 'Tablets / Capsules';
      var batchSize = document.getElementById('mfgBatch') ? document.getElementById('mfgBatch').value.trim() : '';
      var details = document.getElementById('mfgDetails') ? document.getElementById('mfgDetails').value.trim() : '';
      var submitBtn = mfgForm.querySelector('button[type="submit"]');

      if (!name) {
        showFormError(mfgStatus, nameInput, 'Please enter your contact person or brand name.');
        return;
      }
      if (!isValidIndianMobile(phone)) {
        showFormError(mfgStatus, phoneInput, 'Please enter a valid 10-digit Indian mobile number (e.g. 9876543210).');
        return;
      }

      var text = 'Hello ' + COMPANY_NAME + ',\n\n' +
                 '*Third-Party Manufacturing Enquiry*\n' +
                 '• Contact Person: ' + name + '\n' +
                 '• Phone: ' + phone + '\n' +
                 '• Formulation Needed: ' + dosage + '\n' +
                 (batchSize ? '• Estimated Batch Size: ' + batchSize + '\n' : '') +
                 (details ? '• Specifications: ' + details + '\n' : '') +
                 '\nPlease share quotation and manufacturing terms.';

      var waUrl = 'https://wa.me/' + getWaNumber() + '?text=' + encodeURIComponent(text);
      var msg = dosage + (batchSize ? ' | Batch: ' + batchSize : '') + (details ? ' | ' + details : '');
      saveAndWhatsApp(name, phone, 'Third-Party Manufacturing', msg, 'third-party-manufacturing.html', waUrl, mfgStatus, submitBtn, hpValue);
    });
  }

  // 3. PCD Franchise Enquiry Form (with Target District JS enforcement)
  var franchiseForm = document.getElementById('franchiseEnquiryForm');
  var franchiseStatus = document.getElementById('franchiseFormStatus');
  if (franchiseForm) {
    franchiseForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var nameInput = document.getElementById('frName');
      var phoneInput = document.getElementById('frPhone');
      var locationInput = document.getElementById('frLocation');
      var hpInput = document.getElementById('fr_website_hp');

      var name = nameInput ? nameInput.value.trim() : '';
      var phone = phoneInput ? phoneInput.value.trim() : '';
      var location = locationInput ? locationInput.value.trim() : '';
      var hpValue = hpInput ? hpInput.value.trim() : '';
      var experience = document.getElementById('frExperience') ? document.getElementById('frExperience').value : '';
      var query = document.getElementById('frQuery') ? document.getElementById('frQuery').value.trim() : '';
      var submitBtn = franchiseForm.querySelector('button[type="submit"]');

      if (!name) {
        showFormError(franchiseStatus, nameInput, 'Please provide your full name.');
        return;
      }
      if (!isValidIndianMobile(phone)) {
        showFormError(franchiseStatus, phoneInput, 'Please enter a valid 10-digit Indian mobile number (e.g. 9876543210).');
        return;
      }
      // Target District mandatory validation
      if (!location) {
        showFormError(franchiseStatus, locationInput, 'Please provide your target district or territory.');
        return;
      }

      var text = 'Hello ' + COMPANY_NAME + ',\n\n' +
                 '*PCD Pharma Franchise Opportunity Enquiry*\n' +
                 '• Name: ' + name + '\n' +
                 '• Contact Phone: ' + phone + '\n' +
                 '• Target Territory / District: ' + location + '\n' +
                 (experience ? '• Pharma Experience: ' + experience + '\n' : '') +
                 (query ? '• Product Interest: ' + query + '\n' : '') +
                 '\nPlease share territory availability and price list.';

      var waUrl = 'https://wa.me/' + getWaNumber() + '?text=' + encodeURIComponent(text);
      var msg = 'Territory: ' + location + (experience ? ' | ' + experience : '') + (query ? ' | ' + query : '');
      saveAndWhatsApp(name, phone, 'PCD Franchise', msg, 'pcd-franchise.html', waUrl, franchiseStatus, submitBtn, hpValue);
    });
  }

  // 4. Contact Page Form
  var contactForm = document.getElementById('contactPageForm');
  var contactStatus = document.getElementById('contactFormStatus');
  if (contactForm) {
    contactForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var nameInput = document.getElementById('contactName');
      var phoneInput = document.getElementById('contactPhone');
      var hpInput = document.getElementById('contact_website_hp');
      var name = nameInput ? nameInput.value.trim() : '';
      var phone = phoneInput ? phoneInput.value.trim() : '';
      var hpValue = hpInput ? hpInput.value.trim() : '';
      var subject = document.getElementById('contactSubject') ? document.getElementById('contactSubject').value.trim() : 'General Support';
      var msg = document.getElementById('contactMessage') ? document.getElementById('contactMessage').value.trim() : '';
      var submitBtn = contactForm.querySelector('button[type="submit"]');

      if (!name) {
        showFormError(contactStatus, nameInput, 'Please provide your name.');
        return;
      }
      if (!isValidIndianMobile(phone)) {
        showFormError(contactStatus, phoneInput, 'Please enter a valid 10-digit Indian mobile number (e.g. 9876543210).');
        return;
      }

      var text = 'Hello ' + COMPANY_NAME + ',\n\n' +
                 '*Direct Contact Request*\n' +
                 '• Name: ' + name + '\n' +
                 '• Phone: ' + phone + '\n' +
                 '• Subject: ' + subject + '\n' +
                 (msg ? '• Message: ' + msg + '\n' : '');

      var waUrl = 'https://wa.me/' + getWaNumber() + '?text=' + encodeURIComponent(text);
      saveAndWhatsApp(name, phone, null, subject + (msg ? ' | ' + msg : ''), 'contact.html', waUrl, contactStatus, submitBtn, hpValue);
    });
  }

}());
