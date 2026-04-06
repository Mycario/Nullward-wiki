function loadGithubConfig() {
  window.GITHUB_OWNER = sessionStorage.getItem('null_gh_owner') || '';
  window.GITHUB_TOKEN = sessionStorage.getItem('null_gh_token') || '';
  window.GITHUB_REPO = 'Nullward-wiki';
  window.GITHUB_BRANCH = 'main';
}

function setGithubConfig(owner, token) {
  sessionStorage.setItem('null_gh_owner', owner);
  sessionStorage.setItem('null_gh_token', token);
  loadGithubConfig();
}

async function githubGetFile(path) {
  loadGithubConfig();
  const url = `https://api.github.com/repos/${window.GITHUB_OWNER}/${window.GITHUB_REPO}/contents/${path}?ref=${window.GITHUB_BRANCH}`;
  const res = await fetch(url, {
    headers: { 'Authorization': `token ${window.GITHUB_TOKEN}`, 'Accept': 'application/vnd.github.v3+json' }
  });
  if (!res.ok) { if (res.status === 404) return null; throw new Error(`GitHub GET failed: ${res.status}`); }
  const data = await res.json();
  return { content: JSON.parse(atob(data.content.replace(/\n/g, ''))), sha: data.sha };
}

async function githubSaveFile(path, content, sha, commitMessage) {
  loadGithubConfig();
  const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(content, null, 2))));
  const body = { message: commitMessage || `Update ${path}`, content: encoded, branch: window.GITHUB_BRANCH };
  if (sha) body.sha = sha;
  const url = `https://api.github.com/repos/${window.GITHUB_OWNER}/${window.GITHUB_REPO}/contents/${path}`;
  const res = await fetch(url, {
    method: 'PUT',
    headers: { 'Authorization': `token ${window.GITHUB_TOKEN}`, 'Accept': 'application/vnd.github.v3+json', 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!res.ok) { const err = await res.json(); throw new Error(`GitHub save failed: ${err.message}`); }
  return await res.json();
}

async function loadData(filename) {
  loadGithubConfig();
  if (window.GITHUB_OWNER && window.GITHUB_TOKEN) {
    try {
      const result = await githubGetFile(`data/${filename}`);
      if (result) return result;
    } catch (e) { console.warn('GitHub fetch failed, falling back to local:', e); }
  }
  try {
    const res = await fetch(`data/${filename}`);
    if (!res.ok) return { content: { entries: [] }, sha: null };
    return { content: await res.json(), sha: null };
  } catch (e) { return { content: { entries: [] }, sha: null }; }
}

async function saveEntry(filename, entries, sha) {
  loadGithubConfig();
  if (!window.GITHUB_OWNER || !window.GITHUB_TOKEN) throw new Error('GitHub not configured. Enter credentials on the home page.');
  const content = { entries, lastUpdated: new Date().toISOString() };
  return await githubSaveFile(`data/${filename}`, content, sha, `Update ${filename}`);
}

function initConfigPanel() {
  loadGithubConfig();
  const panel = document.getElementById('github-config-panel');
  if (!panel) return;
  if (!isLoggedIn()) { panel.style.display = 'none'; return; }
  if (window.GITHUB_OWNER && window.GITHUB_TOKEN) { panel.style.display = 'none'; return; }
  panel.style.display = 'block';

  const ownerInput = document.getElementById('config-owner');
  const tokenInput = document.getElementById('config-token');
  const saveBtn = document.getElementById('config-save');
  const status = document.getElementById('config-status');

  if (ownerInput) ownerInput.value = window.GITHUB_OWNER;

  if (saveBtn) {
    saveBtn.addEventListener('click', () => {
      const owner = ownerInput?.value.trim();
      const token = tokenInput?.value.trim();
      if (!owner || !token) { if (status) { status.textContent = '// Error: both fields required'; status.className = 'form-status visible error'; } return; }
      setGithubConfig(owner, token);
      if (status) { status.textContent = '// Config saved for this session'; status.className = 'form-status visible success'; }
      setTimeout(() => { panel.style.display = 'none'; }, 1500);
    });
  }
}