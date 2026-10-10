import { createClient } from "@supabase/supabase-js";
import "./style.css";

/*
  Isi dengan Project URL dan anon/publishable key Supabase.
  Jangan pernah menaruh service_role key di browser.
*/
const SUPABASE_URL = "PASTE_SUPABASE_PROJECT_URL_HERE";
const SUPABASE_ANON_KEY = "PASTE_SUPABASE_ANON_OR_PUBLISHABLE_KEY_HERE";
const configured = SUPABASE_URL.startsWith("https://") &&
  !SUPABASE_URL.includes("PASTE_") && !SUPABASE_ANON_KEY.includes("PASTE_");
const supabase = configured ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

const state = { scripts: [], query: "", category: "Semua", admin: false, session: null, pending: [], busy: false };
const $ = (s) => document.querySelector(s);
const escapeHTML = (value = "") => String(value).replace(/[&<>"']/g, c => ({
  "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;"
}[c]));
const slug = (s) => String(s).toLowerCase().trim();
const notify = (message, error = false) => {
  const el = $("#toast");
  el.textContent = message;
  el.className = `toast show ${error ? "error" : ""}`;
  clearTimeout(notify.timer);
  notify.timer = setTimeout(() => el.className = "toast", 3200);
};

function renderShell() {
  $("#app").innerHTML = `
    <header class="topbar">
      <a class="brand" href="#" aria-label="Rhan Hub beranda">
        <span class="brand-mark">RH</span><span><b>RHAN HUB</b><small>GAME SCRIPT LIBRARY</small></span>
      </a>
      <nav><a href="#library">Library</a><a href="#submit">Kirim Script</a><button class="btn btn-quiet" id="admin-open">⌘ Admin</button></nav>
    </header>
    <main>
      <section class="hero">
        <div class="eyebrow"><span class="pulse"></span> COMMUNITY SCRIPT LIBRARY</div>
        <h1>Temukan script.<br><span>Jelajahi game.</span></h1>
        <p>Perpustakaan script komunitas yang dikurasi. Cari game favoritmu atau kirim script untuk ditinjau admin.</p>
        <a class="btn btn-primary" href="#library">Jelajahi Library <span>↗</span></a>
        <div class="hero-orb orb-one"></div><div class="hero-orb orb-two"></div>
      </section>
      <section class="stats" aria-label="Statistik">
        <div><strong id="stat-games">—</strong><span>Game</span></div>
        <div><strong id="stat-scripts">—</strong><span>Script publik</span></div>
        <div><strong>Community</strong><span>Kontribusi terbuka</span></div>
      </section>
      <section class="section" id="library">
        <div class="section-head"><div><div class="eyebrow">EXPLORE</div><h2>Script Library</h2><p>Temukan koleksi berdasarkan game atau nama script.</p></div></div>
        <label class="searchbox"><span>⌕</span><input id="search" type="search" placeholder="Cari game atau nama script..." autocomplete="off"><kbd>SEARCH</kbd></label>
        <div class="filters" id="filters"><button class="chip active" data-category="Semua">Semua</button></div>
        <div class="script-grid" id="script-grid"><div class="empty"><span class="loader"></span><p>Memuat library...</p></div></div>
      </section>
      <section class="submit-section" id="submit">
        <div class="submit-copy"><div class="eyebrow">CONTRIBUTE</div><h2>Punya script<br><span>untuk dibagikan?</span></h2><p>Kirim detail game dan script. Kiriman akan masuk antrean dan baru tampil setelah disetujui admin.</p><div class="secure-note">◈ &nbsp; Kiriman ditinjau sebelum dipublikasikan</div></div>
        <form id="submit-form" class="panel form-panel">
          <div class="form-title"><span class="icon-box">＋</span><div><h3>Kirim script baru</h3><p>Isi semua informasi yang diperlukan.</p></div></div>
          <label>Nama game <input name="game_name" required maxlength="80" placeholder="Contoh: Roblox"></label>
          <label>Nama script <input name="script_name" required maxlength="100" placeholder="Contoh: Inventory Helper"></label>
          <label>Kategori <select name="category" required><option value="">Pilih kategori</option><option>Utility</option><option>UI / Interface</option><option>Gameplay</option><option>Modding</option><option>Other</option></select></label>
          <label>Deskripsi <textarea name="description" required minlength="10" maxlength="500" rows="3" placeholder="Jelaskan fungsi script..."></textarea></label>
          <label>Isi script <textarea name="code" required minlength="3" maxlength="20000" rows="6" spellcheck="false" placeholder="Tempel kode script di sini..."></textarea><small class="hint">Maksimum 20.000 karakter. Jangan masukkan password, token, atau data pribadi.</small></label>
          <label class="checkline"><input type="checkbox" name="ownership" required> Saya berhak membagikan kode ini dan tidak menyertakan malware atau data rahasia.</label>
          <button class="btn btn-primary full" type="submit" id="submit-btn">Kirim untuk ditinjau <span>→</span></button>
          <p class="form-foot">Kiriman tidak langsung tampil. Admin akan memeriksanya terlebih dahulu.</p>
        </form>
      </section>
      <section id="admin-panel" class="section admin-section hidden">
        <div class="section-head"><div><div class="eyebrow">MODERATION</div><h2>Panel Admin</h2><p>Tinjau kiriman sebelum tampil di library.</p></div><button class="btn btn-quiet" id="logout">Keluar</button></div>
        <div id="pending-list" class="pending-list"></div>
      </section>
      <footer><a class="brand footer-brand" href="#"><span class="brand-mark">RH</span><span><b>RHAN HUB</b><small>BUILT FOR THE COMMUNITY</small></span></a><span>Bagikan dengan bijak. Hormati aturan tiap game.</span></footer>
    </main>
    <dialog id="admin-dialog" class="modal">
      <form id="login-form" class="panel modal-panel">
        <button type="button" class="modal-close" id="close-modal" aria-label="Tutup">×</button>
        <div class="icon-box large">⌘</div><h2>Login Admin</h2><p>Masuk untuk meninjau dan mengelola kiriman.</p>
        <label>Email admin <input name="email" type="email" autocomplete="username" required placeholder="admin@email.com"></label>
        <label>Password <input name="password" type="password" autocomplete="current-password" required placeholder="Password"></label>
        <button class="btn btn-primary full" type="submit">Masuk ke panel</button>
        <small class="hint">Buat akun admin melalui Supabase Authentication terlebih dahulu.</small>
      </form>
    </dialog>
    <div id="toast" class="toast" role="status" aria-live="polite"></div>`;
  $("#search").addEventListener("input", e => { state.query = e.target.value; renderScripts(); });
  $("#filters").addEventListener("click", e => {
    const btn = e.target.closest("[data-category]");
    if (!btn) return;
    state.category = btn.dataset.category;
    renderFilters(); renderScripts();
  });
  $("#submit-form").addEventListener("submit", submitScript);
  $("#admin-open").addEventListener("click", () => $("#admin-dialog").showModal());
  $("#close-modal").addEventListener("click", () => $("#admin-dialog").close());
  $("#admin-dialog").addEventListener("click", e => { if (e.target === $("#admin-dialog")) $("#admin-dialog").close(); });
  $("#login-form").addEventListener("submit", loginAdmin);
  $("#logout").addEventListener("click", logoutAdmin);
  $("#script-grid").addEventListener("click", e => {
    const btn = e.target.closest("[data-copy]");
    if (!btn) return;
    const item = state.scripts.find(s => s.id === btn.dataset.copy);
    if (item) copyCode(item.code);
  });
}

function renderFilters() {
  const categories = ["Semua", ...new Set(state.scripts.map(s => s.category).filter(Boolean))];
  $("#filters").innerHTML = categories.map(c => `<button class="chip ${state.category === c ? "active" : ""}" data-category="${escapeHTML(c)}">${escapeHTML(c)}</button>`).join("");
}

function renderScripts() {
  const q = slug(state.query);
  const items = state.scripts.filter(s => {
    const matches = [s.game_name, s.script_name, s.description, s.category].some(v => slug(v || "").includes(q));
    return matches && (state.category === "Semua" || s.category === state.category);
  });
  $("#stat-scripts").textContent = state.scripts.length;
  $("#stat-games").textContent = new Set(state.scripts.map(s => s.game_name.toLowerCase())).size;
  if (!items.length) {
    $("#script-grid").innerHTML = `<div class="empty"><div class="empty-icon">⌕</div><h3>${q ? "Belum ada hasil" : "Library masih kosong"}</h3><p>${q ? "Coba kata kunci lain." : "Jadilah kontributor pertama dengan mengirim script di bawah."}</p></div>`;
    return;
  }
  $("#script-grid").innerHTML = items.map(s => `
    <article class="script-card">
      <div class="card-top"><span class="game-icon">${escapeHTML((s.game_name || "?").slice(0,2).toUpperCase())}</span><span class="tag">${escapeHTML(s.category || "Other")}</span></div>
      <p class="game-label">${escapeHTML(s.game_name)}</p><h3>${escapeHTML(s.script_name)}</h3>
      <p class="description">${escapeHTML(s.description)}</p>
      <div class="code-preview"><div class="code-head"><span><i></i><i></i><i></i></span><span>script code</span></div><pre>${escapeHTML((s.code || "").split("\n").slice(0,5).join("\n"))}${(s.code || "").split("\n").length > 5 ? "\n…" : ""}</pre></div>
      <button class="btn btn-outline full" data-copy="${escapeHTML(s.id)}">▣ Salin script</button>
    </article>`).join("");
}

async function loadScripts() {
  if (!supabase) {
    state.scripts = demoScripts;
    renderFilters(); renderScripts();
    notify("Mode demo aktif. Hubungkan Supabase untuk menyimpan data sungguhan.");
    return;
  }
  const { data, error } = await supabase.from("scripts").select("id,game_name,script_name,category,description,code,created_at").eq("status", "approved").order("created_at", { ascending: false });
  if (error) { state.scripts = []; renderFilters(); renderScripts(); notify("Gagal memuat library: " + error.message, true); return; }
  state.scripts = data || [];
  renderFilters(); renderScripts();
}

async function submitScript(e) {
  e.preventDefault();
  const form = e.currentTarget;
  if (!form.reportValidity()) return;
  const data = Object.fromEntries(new FormData(form).entries());
  if (data.game_name.trim().length < 2 || data.script_name.trim().length < 2 || data.code.trim().length < 3) {
    notify("Nama game, nama script, atau kode terlalu pendek.", true); return;
  }
  if (!supabase) { notify("Mode demo: kiriman tidak tersimpan. Hubungkan Supabase dahulu.", true); return; }
  const btn = $("#submit-btn"); btn.disabled = true; btn.textContent = "Mengirim...";
  const { error } = await supabase.from("scripts").insert({
    game_name: data.game_name.trim(), script_name: data.script_name.trim(),
    category: data.category, description: data.description.trim(), code: data.code,
    status: "pending"
  });
  btn.disabled = false; btn.innerHTML = 'Kirim untuk ditinjau <span>→</span>';
  if (error) { notify("Kiriman gagal: " + error.message, true); return; }
  form.reset(); notify("Berhasil dikirim! Tunggu persetujuan admin.");
}

async function loginAdmin(e) {
  e.preventDefault();
  if (!supabase) { notify("Hubungkan Supabase dahulu untuk login admin.", true); return; }
  const form = Object.fromEntries(new FormData(e.currentTarget).entries());
  const { data, error } = await supabase.auth.signInWithPassword({ email: form.email, password: form.password });
  if (error) { notify("Login gagal. Periksa email dan password.", true); return; }
  state.session = data.session; state.admin = true;
  $("#admin-dialog").close(); $("#admin-panel").classList.remove("hidden");
  await loadPending(); $("#admin-panel").scrollIntoView({ behavior: "smooth" });
}

async function loadPending() {
  if (!state.admin || !supabase) return;
  const { data, error } = await supabase.from("scripts").select("*").eq("status", "pending").order("created_at", { ascending: true });
  if (error) { notify("Tidak bisa memuat antrean. Pastikan akun memiliki izin admin.", true); return; }
  state.pending = data || [];
  $("#pending-list").innerHTML = state.pending.length ? state.pending.map(s => `
    <article class="pending-card"><div><span class="tag pending-tag">MENUNGGU</span><h3>${escapeHTML(s.script_name)}</h3><p>${escapeHTML(s.game_name)} · ${escapeHTML(s.category)}</p><p class="description">${escapeHTML(s.description)}</p><details><summary>Lihat kode</summary><pre>${escapeHTML(s.code)}</pre></details></div>
    <div class="moderation-actions"><button class="btn btn-primary" data-review="approved" data-id="${escapeHTML(s.id)}">Setujui</button><button class="btn btn-danger" data-review="rejected" data-id="${escapeHTML(s.id)}">Tolak</button></div></article>`).join("") : `<div class="empty"><h3>Tidak ada kiriman menunggu</h3><p>Kiriman baru akan muncul di sini.</p></div>`;
  $("#pending-list").onclick = async e => {
    const btn = e.target.closest("[data-review]");
    if (!btn) return;
    btn.disabled = true;
    const { error } = await supabase.from("scripts").update({ status: btn.dataset.review }).eq("id", btn.dataset.id);
    if (error) { notify("Gagal memperbarui status. Periksa kebijakan database.", true); btn.disabled = false; return; }
    notify(btn.dataset.review === "approved" ? "Script disetujui dan dipublikasikan." : "Kiriman ditolak.");
    await loadPending(); await loadScripts();
  };
}

async function logoutAdmin() {
  if (supabase) await supabase.auth.signOut();
  state.admin = false; state.session = null;
  $("#admin-panel").classList.add("hidden"); notify("Kamu sudah keluar dari panel admin.");
}

async function copyCode(code) {
  try {
    await navigator.clipboard.writeText(code);
    notify("Script berhasil disalin.");
  } catch {
    const ta = document.createElement("textarea"); ta.value = code; document.body.appendChild(ta); ta.select();
    const ok = document.execCommand("copy"); ta.remove();
    notify(ok ? "Script berhasil disalin." : "Gagal menyalin script.", !ok);
  }
}

const demoScripts = [
  {id:"demo-1", game_name:"Roblox", script_name:"UI Helper Example", category:"UI / Interface", description:"Contoh kartu demo untuk menampilkan cara kerja library. Ganti dengan script yang aman dan memang boleh dibagikan.", code:"-- Rhan Hub demo example\nprint('Hello, Rhan Hub!')"},
  {id:"demo-2", game_name:"Minecraft", script_name:"World Info Example", category:"Utility", description:"Contoh data agar desain tetap terlihat sebelum database dihubungkan.", code:"// Example only\nconst world = 'My World';\nconsole.log(world);"}
];

renderShell();
loadScripts();
