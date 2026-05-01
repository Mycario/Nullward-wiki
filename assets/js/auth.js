async function hashPassword(password, salt = '') {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + salt);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

let authConfig = null;

async function loadAuthConfig() {
  try {
    const res = await fetch('data/config.json');
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    console.warn('Auth config not found, using fallback:', e.message);
    return null;
  }
}

async function initCorrectHash() {
  if (!sessionStorage.getItem('solv_correct')) {
    authConfig = await loadAuthConfig();
    if (authConfig && authConfig.passwordHash) {
      sessionStorage.setItem('solv_correct', authConfig.passwordHash);
    } else {
      const h = await hashPassword('Solveyra');
      sessionStorage.setItem('solv_correct', h);
      authConfig = { passwordHash: h, passwordSalt: '' };
    }
  }
}

async function attemptLogin(password) {
  const salt = authConfig?.passwordSalt || '';
  const hash = await hashPassword(password, salt);
  const correct = sessionStorage.getItem('solv_correct');
  if (correct && hash === correct) {
    sessionStorage.setItem('solv_auth', 'true');
    return true;
  }
  return false;
}

function isLoggedIn() {
  return sessionStorage.getItem('solv_auth') === 'true';
}

function logout() {
  sessionStorage.removeItem('solv_auth');
  document.body.classList.remove('editor-active');
  document.querySelectorAll('.editor-bar').forEach(b => b.classList.remove('visible'));
  if (typeof SFX !== 'undefined') SFX.logout();
  updateLoginTrigger();
  document.dispatchEvent(new CustomEvent('editorStateChange', { detail: { loggedIn: false } }));
}

function updateLoginTrigger() {
  const trigger = document.getElementById('login-trigger');
  if (!trigger) return;
  if (isLoggedIn()) {
    trigger.classList.add('logged-in');
    trigger.querySelector('.arrow-label').textContent = 'AUTHENTICATED';
    document.body.classList.add('editor-active');
    document.querySelectorAll('.editor-bar').forEach(b => b.classList.add('visible'));
  } else {
    trigger.classList.remove('logged-in');
    trigger.querySelector('.arrow-label').textContent = 'ADMIN ACCESS';
    document.body.classList.remove('editor-active');
    document.querySelectorAll('.editor-bar').forEach(b => b.classList.remove('visible'));
  }
}

async function initAuth() {
  await initCorrectHash();

  const trigger = document.getElementById('login-trigger');
  const modal = document.getElementById('login-modal');
  const input = document.getElementById('login-password-input');
  const submitBtn = document.getElementById('login-submit');
  const errorMsg = document.getElementById('login-error');
  const closeBtn = document.getElementById('login-close');

  if (!trigger || !modal) return;

  updateLoginTrigger();

  trigger.addEventListener('click', () => {
    if (isLoggedIn()) { logout(); return; }
    modal.classList.add('open');
    setTimeout(() => input && input.focus(), 100);
  });

  if (closeBtn) closeBtn.addEventListener('click', () => modal.classList.remove('open'));
  modal.addEventListener('click', (e) => { if (e.target === modal) modal.classList.remove('open'); });

  async function doLogin() {
    const pw = input.value;
    if (!pw) return;
    const ok = await attemptLogin(pw);
    if (ok) {
      modal.classList.remove('open');
      input.value = '';
      if (errorMsg) errorMsg.classList.remove('visible');
      updateLoginTrigger();
      if (typeof SFX !== 'undefined') SFX.loginSuccess();
      document.dispatchEvent(new CustomEvent('editorStateChange', { detail: { loggedIn: true } }));
      if (typeof initConfigPanel === 'function') initConfigPanel();
    } else {
      if (typeof SFX !== 'undefined') SFX.error();
      if (errorMsg) { errorMsg.textContent = '// ACCESS DENIED — INVALID CREDENTIALS'; errorMsg.classList.add('visible'); }
      input.value = '';
      input.classList.add('shake');
      setTimeout(() => input.classList.remove('shake'), 400);
    }
  }

  if (submitBtn) submitBtn.addEventListener('click', doLogin);
  if (input) input.addEventListener('keydown', (e) => { if (e.key === 'Enter') doLogin(); });
}