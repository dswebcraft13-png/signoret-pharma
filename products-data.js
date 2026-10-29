/**
 * Signoret Pharmaceuticals Pvt. Ltd.
 * Shared Product and Post Data Layer with Versioned LocalStorage Caching
 * Phone & WhatsApp: +91 81988 88864
 * Plot No. 556, Industrial Area Phase-9, Mohali, Punjab 160062
 */

(function () {
  'use strict';

  var CACHE_VERSION = 5;
  var CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes TTL

  var STORAGE_KEYS = {
    PRODUCTS: 'signoret_products_v' + CACHE_VERSION,
    POSTS: 'signoret_posts_v' + CACHE_VERSION
  };

  // Helper to clear old cache keys from prior versions
  try {
    ['signoret_products_v1', 'signoret_products_v2', 'signoret_products_v3', 'signoret_products_v4', 'signoret_posts_v1', 'signoret_admin_auth_v1'].forEach(function (k) {
      localStorage.removeItem(k);
    });
  } catch (e) {}

  // Products accessors
  function getStoredProducts() {
    try {
      var raw = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          // Check TTL
          if (parsed.timestamp && (Date.now() - parsed.timestamp < CACHE_TTL_MS) && Array.isArray(parsed.data)) {
            return parsed.data;
          }
        }
      }
    } catch (e) {
      console.warn('Could not load stored products:', e);
    }
    return [];
  }

  function saveStoredProducts(products) {
    try {
      var payload = {
        version: CACHE_VERSION,
        timestamp: Date.now(),
        data: Array.isArray(products) ? products : []
      };
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(payload));
      window.dispatchEvent(new Event('signoret_products_updated'));
      return true;
    } catch (e) {
      console.error('Could not save products to localStorage:', e);
      return false;
    }
  }

  function resetStoredProducts() {
    try {
      localStorage.removeItem(STORAGE_KEYS.PRODUCTS);
      window.dispatchEvent(new Event('signoret_products_updated'));
    } catch (e) {}
    return [];
  }

  // Posts accessors
  function getStoredPosts() {
    try {
      var raw = localStorage.getItem(STORAGE_KEYS.POSTS);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          if (parsed.timestamp && (Date.now() - parsed.timestamp < CACHE_TTL_MS) && Array.isArray(parsed.data)) {
            return parsed.data;
          }
        }
      }
    } catch (e) {
      console.warn('Could not load stored posts:', e);
    }
    return [];
  }

  function saveStoredPosts(posts) {
    try {
      var payload = {
        version: CACHE_VERSION,
        timestamp: Date.now(),
        data: Array.isArray(posts) ? posts : []
      };
      localStorage.setItem(STORAGE_KEYS.POSTS, JSON.stringify(payload));
      window.dispatchEvent(new Event('signoret_posts_updated'));
      return true;
    } catch (e) {
      console.error('Could not save posts to localStorage:', e);
      return false;
    }
  }

  function resetStoredPosts() {
    try {
      localStorage.removeItem(STORAGE_KEYS.POSTS);
      window.dispatchEvent(new Event('signoret_posts_updated'));
    } catch (e) {}
    return [];
  }

  // Helper for product slug
  function productSlug(item) {
    if (!item) return '';
    if (item.slug) return item.slug;
    if (item.name) {
      return item.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    }
    return item.id || '';
  }

  // Social Sharing Generators (points to product-specific link)
  function generateShareData(item) {
    var name = (item && item.name) || 'Pharmaceutical Formulation';
    var comp = (item && item.composition) ? ' | ' + item.composition : '';
    var pack = (item && item.packing) ? ' | Pack: ' + item.packing : '';
    var slugOrId = productSlug(item);
    var productUrl = window.location.origin + '/products.html' + (slugOrId ? '?product=' + encodeURIComponent(slugOrId) : '');
    var fullText = name + comp + pack + ' — Signoret Pharmaceuticals Pvt. Ltd. (Plot No. 556, Industrial Area Phase-9, Mohali, Punjab 160062). Call/WhatsApp: +91 81988 88864. View product details: ' + productUrl;

    return {
      title: name,
      text: fullText,
      url: productUrl,
      whatsappUrl: 'https://api.whatsapp.com/send?text=' + encodeURIComponent(fullText),
      facebookUrl: 'https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(productUrl),
      linkedinUrl: 'https://www.linkedin.com/sharing/share-offsite/?url=' + encodeURIComponent(productUrl),
      instagramCaption: name + '\n' + (item && item.composition ? item.composition + '\n' : '') + (item && item.packing ? 'Pack: ' + item.packing + '\n' : '') + '\nSignoret Pharmaceuticals Pvt. Ltd.\nThird-Party Manufacturing & PCD Franchise — Tablets, Capsules, Syrups & Injections\nPlot No. 556, Industrial Area Phase-9, Mohali, Punjab 160062\nPhone & WhatsApp: +91 81988 88864\n' + productUrl
    };
  }

  /**
   * Async product loader: tries Supabase first, falls back to versioned cache.
   */
  async function loadProductsFromSupabase() {
    if (window.SignoretSupabase && typeof window.SignoretSupabase.fetchProducts === 'function') {
      try {
        var products = await window.SignoretSupabase.fetchProducts();
        if (Array.isArray(products)) {
          saveStoredProducts(products);
          return products;
        }
      } catch (e) {
        console.warn('Supabase products fetch failed, using cache:', e);
      }
    }
    return getStoredProducts();
  }

  /**
   * Async settings loader
   */
  async function loadAndApplySettings() {
    if (window.SignoretSupabase && typeof window.SignoretSupabase.fetchSettings === 'function') {
      try {
        var settings = await window.SignoretSupabase.fetchSettings();
        if (settings && window.SignoretSupabase.applySettings) {
          window.SignoretSupabase.applySettings(settings);
        }
      } catch (e) {
        console.warn('Settings load failed:', e);
      }
    }
  }

  /**
   * Async posts loader: tries Supabase first, falls back to versioned cache.
   */
  async function loadPostsFromSupabase() {
    if (window.SignoretSupabase && typeof window.SignoretSupabase.fetchPosts === 'function') {
      try {
        var posts = await window.SignoretSupabase.fetchPosts();
        if (Array.isArray(posts)) {
          saveStoredPosts(posts);
          return posts;
        }
      } catch (e) {
        console.warn('Supabase posts fetch failed, using cache:', e);
      }
    }
    return getStoredPosts();
  }

  // Global expose
  window.SignoretData = {
    getStoredProducts: getStoredProducts,
    saveStoredProducts: saveStoredProducts,
    resetStoredProducts: resetStoredProducts,
    getStoredPosts: getStoredPosts,
    saveStoredPosts: saveStoredPosts,
    resetStoredPosts: resetStoredPosts,
    generateShareData: generateShareData,
    productSlug: productSlug,
    loadProductsFromSupabase: loadProductsFromSupabase,
    loadAndApplySettings: loadAndApplySettings,
    loadPostsFromSupabase: loadPostsFromSupabase
  };
}());
