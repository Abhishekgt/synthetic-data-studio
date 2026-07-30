// app.js - shared UI utilities: sidebar collapse, toasts, modals, spinner, animated counters

// Sidebar toggle (works on all pages)
function setupSidebar() {
  const toggles = document.querySelectorAll('#hamburger,#hamburger2,#hamburger3,#hamburger4');
  toggles.forEach(btn => btn && btn.addEventListener('click', (e) => {
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) sidebar.classList.toggle('collapsed');
  }));
}

// Toasts
const toastContainer = () => document.getElementById('toastContainer');
function toast(message, opts = {}) {
  const c = toastContainer();
  if (!c) return console.warn('No toast container');
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = message;
  c.appendChild(el);
  setTimeout(()=> el.style.opacity = '1', 20);
  setTimeout(()=> { el.style.opacity = '0'; setTimeout(()=>el.remove(),400); }, opts.duration || 4000);
}

// Simple spinner
function showSpinner() { const s = document.getElementById('spinner'); if(s) s.classList.remove('hidden'); }
function hideSpinner() { const s = document.getElementById('spinner'); if(s) s.classList.add('hidden'); }

// Animated counters (used on dashboard)
function animateCounters() {
  document.querySelectorAll('.stat-value').forEach(el=>{
    const targetRaw = el.getAttribute('data-target') || '0';
    const target = Number(String(targetRaw).replace(/,/g,'')) || 0;
    const formatted = (v)=> v.toLocaleString();
    let start = 0;
    const dur = 900;
    const step = (ts, startTs=performance.now())=>{
      const t = Math.min(1, (performance.now()-startTs)/dur);
      const val = Math.floor(t * target);
      el.textContent = formatted(val);
      if (t < 1) requestAnimationFrame(() => step(ts, startTs));
    };
    requestAnimationFrame(step);
  });
}

// small helper debounce
function debounce(fn, wait=250){
  let t;
  return (...a)=>{ clearTimeout(t); t=setTimeout(()=>fn(...a), wait); };
}

// initialize common behaviors
document.addEventListener('DOMContentLoaded', () => {
  setupSidebar();
  animateCounters();
});