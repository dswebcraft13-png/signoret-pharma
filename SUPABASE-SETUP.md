# Supabase Setup Guide & Security Hardening
**Signoret Pharmaceuticals Pvt. Ltd.**  
Verified Address: Plot No. 556, Industrial Area Phase-9, Mohali, Punjab 160062  
Contact: +91 81988 88864 | WhatsApp: wa.me/918198888864  

---

## 1. Apply Schema and Row Level Security (RLS)
1. Log in to your [Supabase Dashboard](https://supabase.com/dashboard).
2. Open your project (`zlzpnkkkwsyjarabucvc` or your active production project).
3. In the left navigation, click on **SQL Editor**.
4. Click **New Query**, copy the entire contents of `supabase-schema.sql`, and paste it into the query window.
5. Click **Run** to execute the script.
6. Verify under **Table Editor** that the tables `products`, `posts`, `enquiries`, and `settings` are present and each shows **RLS Enabled** (green shield icon).

---

## 2. Disable Public Sign-Up
To ensure nobody can create an unauthorized account on the admin panel:
1. In the Supabase dashboard left menu, go to **Authentication** > **Providers** (or **Auth Settings**).
2. Under **User Signups**, **uncheck / toggle OFF** `Enable email signups` (or "Allow new users to sign up").
3. Ensure only invited or pre-created administrators exist under **Authentication** > **Users**.
4. To add or reset an admin user, go to **Authentication** > **Users** and click **Add user** > **Create user** with the administrator's authorized email and strong password.

---

## 3. Enable Multi-Factor Authentication (MFA)
To protect the admin account against unauthorized access:
1. In the Supabase dashboard, go to **Authentication** > **MFA** (Multi-Factor Authentication).
2. Ensure **App Authenticator (TOTP)** is enabled.
3. Log in with the admin account, navigate to user security settings, and link an authenticator app (such as Google Authenticator, Microsoft Authenticator, or 1Password) by scanning the QR code.
4. Enforce MFA requirement for all authenticated admin sessions.

---

## 4. How to Test RLS Policies with a Signed-Out Browser

### Test A: Public Can Read Only Active Products
1. Open an Incognito/Private browser window (ensure you are NOT logged in to `/admin.html`).
2. Open developer tools (**F12** > **Console**).
3. Paste and run this test snippet:
```javascript
const client = window.SignoretSupabase.getClient();
const { data, error } = await client.from('products').select('*');
console.log('Public Products Fetch:', data, 'Error:', error);
```
- **Expected Result:** Only records with `active = true` are returned. Inactive draft products are never leaked.

### Test B: Public Cannot Read Enquiries
1. In the same Incognito browser console, run:
```javascript
const client = window.SignoretSupabase.getClient();
const { data, error } = await client.from('enquiries').select('*');
console.log('Public Enquiries Read Attempt:', data, 'Error:', error);
```
- **Expected Result:** `data` is empty `[]` or returns permission denied error. Public visitors cannot view customer submissions.

### Test C: Public Can Submit Valid Enquiry
1. Submit the enquiry form on `index.html` or run:
```javascript
const client = window.SignoretSupabase.getClient();
const { data, error } = await client.from('enquiries').insert([{
  name: 'Test Partner',
  phone: '9876543210',
  message: 'Testing RLS public insert',
  source_page: 'test'
}]);
console.log('Enquiry Insert Result:', data, 'Error:', error);
```
- **Expected Result:** `error` is `null` and row is inserted.

### Test D: Public Cannot Delete or Update Records
1. Run:
```javascript
const client = window.SignoretSupabase.getClient();
const { data, error } = await client.from('products').delete().neq('id', '00000000-0000-0000-0000-000000000000');
console.log('Public Delete Attempt:', data, 'Error:', error);
```
- **Expected Result:** Error or 0 rows deleted. RLS blocks unauthorized writes.

---

## 5. Storage Buckets Configuration
1. Go to **Storage** in the left sidebar.
2. Confirm the buckets `products` and `blog` exist and are marked **Public**.
3. Under Storage Policies, verify the policies defined in `supabase-schema.sql` are active (Public Read, Authenticated Write/Delete).
