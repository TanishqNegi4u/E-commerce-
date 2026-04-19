/* ═══════════════════════════════════════════════════════
   ShopWave — auth.js
   Login, Register, Logout, Nav user state
   ═══════════════════════════════════════════════════════ */

const openAuth  = () => { document.getElementById('authOverlay').classList.add('open'); document.body.style.overflow = 'hidden'; };
const closeAuth = () => { document.getElementById('authOverlay').classList.remove('open'); document.body.style.overflow = ''; };

const switchTab = tab => {
  const isLogin = tab === 'login';
  document.getElementById('loginForm').style.display    = isLogin ? '' : 'none';
  document.getElementById('registerForm').style.display = isLogin ? 'none' : '';
  document.getElementById('loginTab').classList.toggle('active', isLogin);
  document.getElementById('registerTab').classList.toggle('active', !isLogin);
  document.getElementById('loginError').hidden = true;
  document.getElementById('registerError').hidden = true;
};

const togglePwd = id => {
  const inp = document.getElementById(id);
  inp.type = inp.type === 'password' ? 'text' : 'password';
};

// ── Update nav user state ─────────────────────────────────
const updateNavUser = () => {
  const u = getUser();
  const label   = document.getElementById('authLabel');
  const header  = document.getElementById('dropdownUser');
  const logoutBtn = document.getElementById('logoutBtn');

  if (u) {
    label.textContent = u.firstName || 'Account';
    header.innerHTML  = `Hello, <strong>${u.firstName || 'User'}</strong>`;
    if (logoutBtn) logoutBtn.style.display = '';
  } else {
    label.textContent = 'Login';
    header.innerHTML  = 'New Customer? <a onclick="openAuth();return false;" href="#">Sign Up</a>';
    if (logoutBtn) logoutBtn.style.display = 'none';
  }
};

const doLogout = () => {
  clearAuth();
  updateNavUser();
  showToast('Logged out successfully', 'info');
};

// ── Login handler ─────────────────────────────────────────
const handleLogin = async e => {
  e.preventDefault();
  const errEl = document.getElementById('loginError');
  const btn   = document.getElementById('loginBtn');
  errEl.hidden = true;
  btn.disabled = true; btn.textContent = 'Signing in…';
  try {
    const data = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email:    document.getElementById('loginEmail').value.trim(),
        password: document.getElementById('loginPassword').value,
      })
    });
    setAuth(data.accessToken, {
      userId: data.userId, email: data.email,
      firstName: data.firstName, role: data.role
    });
    closeAuth();
    updateNavUser();
    showToast(`Welcome back, ${data.firstName}! 👋`, 'success');
    await loadCart();
  } catch (err) {
    errEl.textContent = err.message || 'Invalid email or password'; errEl.hidden = false;
  } finally {
    btn.disabled = false; btn.textContent = 'Sign In';
  }
};

// ── Register handler ─────────────────────────────────────
const handleRegister = async e => {
  e.preventDefault();
  const errEl = document.getElementById('registerError');
  const btn   = document.getElementById('registerBtn');
  errEl.hidden = true;
  btn.disabled = true; btn.textContent = 'Creating account…';
  try {
    const data = await apiFetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email:     document.getElementById('regEmail').value.trim(),
        password:  document.getElementById('regPassword').value,
        firstName: document.getElementById('regFirst').value.trim(),
        lastName:  document.getElementById('regLast').value.trim(),
        phone:     document.getElementById('regPhone').value.trim() || undefined,
      })
    });
    setAuth(data.accessToken, {
      userId: data.userId, email: data.email,
      firstName: data.firstName, role: data.role
    });
    closeAuth();
    updateNavUser();
    showToast(`Welcome to ShopWave, ${data.firstName}! 🎉`, 'success');
  } catch (err) {
    errEl.textContent = err.message || 'Registration failed'; errEl.hidden = false;
  } finally {
    btn.disabled = false; btn.textContent = 'Create Account';
  }
};
