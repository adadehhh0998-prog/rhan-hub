# Rhan Hub — panduan instalasi

Website library script dengan tema gelap ungu, pencarian, formulir kontribusi, tombol salin, dan panel moderasi admin.

## A. Coba tampilan demo
1. Buka folder ini di editor yang mendukung Vite (misalnya Replit).
2. Jalankan `npm install`.
3. Jalankan `npm run dev`.
4. Saat konfigurasi Supabase belum diisi, halaman menggunakan 2 data demo. Data formulir **tidak** tersimpan sampai Supabase dihubungkan.

## B. Buat database Supabase
1. Buat project di https://supabase.com/.
2. Buka **SQL Editor**, buat query baru, lalu salin isi `supabase.sql` dan jalankan.
3. Buka **Project Settings → API** (atau bagian Connect) dan salin Project URL serta anon/publishable key.
4. Buka `src.js` dan ganti:
   - `PASTE_SUPABASE_PROJECT_URL_HERE`
   - `PASTE_SUPABASE_ANON_OR_PUBLISHABLE_KEY_HERE`
5. Gunakan anon/publishable key di browser saja. **Jangan gunakan `service_role` key** di frontend.

## C. Buat akun admin
1. Di Supabase, buka **Authentication → Users** dan buat/invite akun admin dengan email yang kamu miliki.
2. Salin UUID akun tersebut.
3. Di **SQL Editor**, jalankan query ini dengan UUID asli:
   ```sql
   insert into public.admin_users (user_id)
   values ('UUID-AKUN-ADMIN');
   ```
4. Buka website, tekan **Admin**, lalu login dengan email/password yang telah dibuat.
5. Kiriman dari publik akan masuk dengan status `pending`. Admin bisa melihat kode, lalu menekan **Setujui** atau **Tolak**. Hanya yang disetujui muncul di library publik.

## D. Online-kan website
- Replit: impor/upload folder project, jalankan `npm install` dan `npm run dev`.
- Untuk deployment permanen, push project ke GitHub lalu impor ke https://vercel.com/.
- Di pengaturan deployment, pastikan build command `npm run build` dan output directory `dist`.

## Keamanan dan catatan
- Row Level Security (RLS) di `supabase.sql` membatasi baca publik pada script yang disetujui, memaksa kiriman baru berstatus `pending`, dan membatasi moderasi kepada UUID admin yang terdaftar.
- Jangan menaruh password admin atau `service_role` key di file frontend.
- Moderasi konten tetap penting. Periksa kode sebelum menyetujui; jangan publikasikan script yang mencuri akun, mencuri data, menghindari keamanan, atau melanggar aturan game.
- Form ini melakukan validasi sisi browser dan database. Untuk situs publik besar, tambahkan CAPTCHA/rate limit melalui backend/Edge Function untuk mengurangi spam.
