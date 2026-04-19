// =============================================
// AUTH MODULE
// =============================================
const openAuth  = () => document.getElementById('authOverlay').classList.add('open');
const closeAuth = () => document.getElementById('authOverlay').classList.remove('open');

const switchTab = (tab) => {
  const isLogin = tab === 'login';
  document.getElementById('loginForm').style.display    = isLogin ? 'flex' : 'none';
  document.getElementById('registerForm').style.display = isLogin ? 'none' : 'flex';
  document.getElementById('loginTab').classList.toggle('active', isLogin);
  document.getElementById('registerTab').classList.toggle('active', !isLogin);
};

const togglePwd = (id) => {
  const inp = document.getElementById(id);
  inp.type = inp.type === 'password' ? 'text' : 'password';
};

const updateNavUser = () => {
  const u = getUser();
  const btn  = document.getElementById('authBtn');
  const label = document.getElementById('authLabel');
  if (u) {
    label.textContent = u.firstName || 'Account';
    btn.title = 'Signed in as ' + (u.email || '');
    btn.onclick = () => {
      if (confirm('Sign out?')) { clearAuth(); updateNavUser(); showToast('Signed out'); }
    };
  } else {
    label.textContent = 'Sign In';
    btn.onclick = openAuth;
  }
};

const handleLogin = async (e) => {
  e.preventDefault();
  const errEl = document.getElementById('loginError');
  const btn   = document.getElementById('loginBtn');
  errEl.hidden = true;
  btn.disabled = true;
  btn.textContent = 'Signing in...';
  try {
    const data = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email:    document.getElementById('loginEmail').value.trim(),
        password: document.getElementById('loginPassword').value,
      })
    });
    setAuth(data.accessToken, { userId: data.userId, email: data.email, firstName: data.firstName, role: data.role });
    closeAuth();
    updateNavUser();
    showToast(`Welcome back, ${data.firstName}! 👋`);
    // Load cart from server
    loadCart();
  } catch (err) {
    errEl.textContent = err.message || 'Invalid credentials';
    errEl.hidden = false;
  } finally {
    btn.disabled = false;
    btn.textContent = 'Sign In';
  }
};

const handleRegister = async (e) => {
  e.preventDefault();
  const errEl = document.getElementById('registerError');
  const btn   = document.getElementById('registerBtn');
  errEl.hidden = true;
  btn.disabled = true;
  btn.textContent = 'Creating account...';
  try {
    const data = await apiFetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email:     document.getElementById('regEmail').value.trim(),
        password:  document.getElementById('regPassword').value,
        firstName: document.getElementById('regFirst').value.trim(),
        lastName:  document.getElementById('regLast').value.trim(),
        phone:     document.getElementById('regPhone').value.trim(),
      })
    });
    setAuth(data.accessToken, { userId: data.userId, email: data.email, firstName: data.firstName, role: data.role });
    closeAuth();
    updateNavUser();
    showToast(`Account created! Welcome, ${data.firstName} 🎉`);
  } catch (err) {
    errEl.textContent = err.message || 'Registration failed';
    errEl.hidden = false;
  } finally {
    btn.disabled = false;
    btn.textContent = 'Create Account';
  }
};

// Close on overlay click
document.getElementById('authOverlay').addEventListener('click', (e) => {
  if (e.target === e.currentTarget) closeAuth();
});