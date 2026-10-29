/**
 * Signoret Pharmaceuticals Pvt. Ltd.
 * Supabase Configuration
 * 
 * SETUP: Replace these placeholders with your actual Supabase project credentials.
 * 1. Go to https://supabase.com and create a free project
 * 2. Go to Settings > API and copy your project URL and anon key
 * 3. Paste them below
 */

// Central Site & Domain Configuration
const SITE_URL = 'https://signoretpharma.com';
const GA_MEASUREMENT_ID = ''; // Left blank until client provides Google Analytics 4 Measurement ID

const SUPABASE_URL = 'https://zlzpnkkkwsyjarabucvc.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_dOFis5m7y6kRrIG0bjTarA_KDPBUAlC';

// Supabase client singleton
let _supabaseClient = null;

function getSupabaseClient() {
  if (_supabaseClient) return _supabaseClient;
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null;
  
  try {
    if (typeof window.supabase !== 'undefined' && window.supabase.createClient) {
      _supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      return _supabaseClient;
    }
  } catch (e) {
    console.warn('Supabase client could not be initialized:', e);
  }
  return null;
}

/**
 * Check if Supabase is configured and reachable
 */
async function isSupabaseAvailable() {
  const client = getSupabaseClient();
  if (!client) return false;
  try {
    const { data, error } = await client.from('products').select('id').limit(1);
    return !error;
  } catch (e) {
    return false;
  }
}

/**
 * Helper to generate slug from name
 */
function slugify(text) {
  if (!text) return '';
  return text.toString().toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

/**
 * Fetch products from Supabase, returns null if unavailable
 */
async function fetchSupabaseProducts() {
  const client = getSupabaseClient();
  if (!client) return null;
  try {
    const { data, error } = await client
      .from('products')
      .select('*')
      .eq('active', true)
      .order('sort_order', { ascending: true });
    if (error) throw error;
    // Map DB columns to the format expected by the frontend
    return data.map(function(p) {
      return {
        id: p.id,
        name: p.name,
        category: p.category || 'Tablets',
        composition: p.composition || '',
        packing: p.pack_size || p.packing || 'Standard Pack',
        formType: p.category || 'Medicine',
        badge: p.category || 'Pharma',
        mrp: p.mrp || '',
        image: p.image_url || 'images/products/placeholder.svg',
        hdImage: p.hd_image_url || p.image_url || 'images/products/placeholder.svg',
        description: p.description || '',
        featured: Boolean(p.featured),
        slug: p.slug || slugify(p.name) || String(p.id)
      };
    });
  } catch (e) {
    console.warn('Could not fetch products from Supabase:', e);
    return null;
  }
}

/**
 * Fetch site settings from Supabase
 */
async function fetchSupabaseSettings() {
  const client = getSupabaseClient();
  if (!client) return null;
  try {
    let { data, error } = await client
      .from('settings')
      .select('*')
      .limit(1)
      .single();
    if (error) {
      // Fallback check for site_settings table
      const res = await client.from('site_settings').select('*').limit(1).single();
      if (!res.error) data = res.data;
      else throw error;
    }
    return data;
  } catch (e) {
    console.warn('Could not fetch settings from Supabase:', e);
    return null;
  }
}

/**
 * Save an enquiry to Supabase with honeypot and length validation
 */
async function saveEnquiryToSupabase(enquiryData) {
  // Reject honeypot spam
  if (enquiryData.honeypot) {
    console.warn('Rejected spam submission');
    return false;
  }
  if (!enquiryData.name || !enquiryData.phone) {
    return false;
  }
  // Length limits
  if (enquiryData.name.length > 100 || enquiryData.phone.length > 25) {
    return false;
  }
  const client = getSupabaseClient();
  if (!client) return false;
  try {
    const { error } = await client.from('enquiries').insert([{
      name: enquiryData.name.trim(),
      phone: enquiryData.phone.trim(),
      product: enquiryData.product ? enquiryData.product.trim() : null,
      message: (enquiryData.message || '').trim(),
      source_page: enquiryData.sourcePage || 'website',
      status: 'New'
    }]);
    if (error) throw error;
    return true;
  } catch (e) {
    console.warn('Could not save enquiry to Supabase:', e);
    return false;
  }
}

/**
 * Apply settings from Supabase to the current page (phone, WhatsApp, email, address)
 */
function applySettingsToPage(settings) {
  if (!settings) return;
  
  var phone = settings.phone || '+91 81988 88864';
  var rawPhone = phone.replace(/[^0-9+]/g, '');
  var waNumber = (settings.whatsapp || '918198888864').replace(/[^0-9]/g, '');
  var email = settings.email || '';
  var address = settings.address || 'Plot No. 556, Industrial Area Phase-9, Mohali, Punjab 160062';

  // Save to window for script.js to access
  window.SIGNORET_SETTINGS = {
    phone: phone,
    rawPhone: rawPhone,
    whatsapp: waNumber,
    email: email,
    address: address
  };
  
  // 1. Update header / topbar phone
  document.querySelectorAll('.topbar .top-info a[href^="tel:"]').forEach(function(el) {
    el.href = 'tel:' + rawPhone;
    el.textContent = phone;
  });
  
  // 2. Update all tel: links
  document.querySelectorAll('a[href^="tel:"]').forEach(function(el) {
    el.href = 'tel:' + rawPhone;
    if (el.textContent.includes('81988') || el.textContent.includes('+91')) {
      el.textContent = phone;
    }
  });
  
  // 3. Update WhatsApp links across the page (floating, mini, buttons)
  document.querySelectorAll('a[href*="wa.me"], a[href*="api.whatsapp.com"]').forEach(function(el) {
    try {
      var currentHref = el.getAttribute('href') || '';
      var textParam = '';
      if (currentHref.indexOf('text=') !== -1) {
        textParam = currentHref.split('text=')[1].split('&')[0];
      }
      var newUrl = 'https://wa.me/' + waNumber + (textParam ? '?text=' + textParam : '');
      el.setAttribute('href', newUrl);
    } catch (e) {}
  });

  // 4. Update footer phone and address
  document.querySelectorAll('.footer-col, .footer-col p').forEach(function(col) {
    if (col.innerHTML.indexOf('Phone &amp; WhatsApp:') !== -1 || col.innerHTML.indexOf('Phone & WhatsApp:') !== -1) {
      col.innerHTML = col.innerHTML
        .replace(/(\+91\s*81988\s*88864|\+91\s*[0-9\s]{10,})/g, phone)
        .replace(/Plot No\. 556, Industrial Area Phase-9, Mohali, Punjab 160062/g, address);
      if (email && !col.innerHTML.includes('Email:')) {
        col.innerHTML += '<br><strong>Email:</strong> ' + email;
      }
    }
  });

  // 5. Update contact page elements
  document.querySelectorAll('.contact-chips a[href^="tel:"] span:last-child').forEach(function(el) {
    el.textContent = phone;
  });
  document.querySelectorAll('.contact-chips span.contact-chip:nth-child(3) span:last-child').forEach(function(el) {
    el.textContent = address;
  });
  document.querySelectorAll('.address-card p').forEach(function(p) {
    p.innerHTML = p.innerHTML
      .replace(/(\+91\s*81988\s*88864|\+91\s*[0-9\s]{10,})/g, phone)
      .replace(/Plot No\. 556, Industrial Area Phase-9, Mohali, Punjab 160062/g, address);
    if (email && !p.innerHTML.includes('Email:')) {
      p.innerHTML += '<br><strong>Email:</strong> ' + email;
    }
  });

  // 6. Update form submit buttons mentioning phone number
  document.querySelectorAll('button[type="submit"]').forEach(function(btn) {
    if (btn.innerHTML.indexOf('81988') !== -1) {
      btn.innerHTML = btn.innerHTML.replace(/\(\+91\s*81988\s*88864\)/g, '(' + phone + ')');
    }
  });
}

/**
 * Fetch blog posts from Supabase (only published posts for public view)
 */
async function fetchSupabasePosts() {
  const client = getSupabaseClient();
  if (!client) return null;
  try {
    const { data, error } = await client
      .from('posts')
      .select('*')
      .eq('published', true)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data.map(function(p) {
      return {
        id: p.id,
        title: p.title,
        date: p.date || (p.created_at ? new Date(p.created_at).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : ''),
        body: p.body || p.description || '',
        description: p.description || p.body || '',
        photo: p.image_url || 'images/quality-lab.jpg',
        category: p.category || 'Industry Updates',
        slug: p.slug || p.id
      };
    });
  } catch (e) {
    console.warn('Could not fetch posts from Supabase:', e);
    return null;
  }
}

// Global expose
window.SIGNORET_CONFIG = {
  SITE_URL: SITE_URL,
  GA_MEASUREMENT_ID: GA_MEASUREMENT_ID
};

window.SignoretSupabase = {
  getClient: getSupabaseClient,
  isAvailable: isSupabaseAvailable,
  fetchProducts: fetchSupabaseProducts,
  fetchSettings: fetchSupabaseSettings,
  saveEnquiry: saveEnquiryToSupabase,
  applySettings: applySettingsToPage,
  fetchPosts: fetchSupabasePosts
};
