function loadGithubConfig() {
  window.GITHUB_OWNER = localStorage.getItem('solv_gh_owner') || '';
  window.GITHUB_TOKEN = localStorage.getItem('solv_gh_token') || '';
  window.GITHUB_REPO = 'Solveyra-wiki';
  window.GITHUB_BRANCH = 'main';
}

function setGithubConfig(owner, token) {
  localStorage.setItem('solv_gh_owner', owner);
  localStorage.setItem('solv_gh_token', token);
  loadGithubConfig();
}

async function githubGetFile(path) {
  loadGithubConfig();
  const url = `https://api.github.com/repos/${window.GITHUB_OWNER}/${window.GITHUB_REPO}/contents/${path}?ref=${window.GITHUB_BRANCH}`;
  const res = await fetch(url, {
    headers: {
      'Authorization': `token ${window.GITHUB_TOKEN}`,
      'Accept': 'application/vnd.github.v3+json'
    }
  });
  if (!res.ok) { if (res.status === 404) return null; throw new Error(`GitHub GET failed: ${res.status}`); }
  const data = await res.json();
  return { content: JSON.parse(atob(data.content.replace(/\n/g, ''))), sha: data.sha };
}

async function githubGetSHA(path) {
  // Fetch only the SHA of a file without parsing content — used before writes
  loadGithubConfig();
  const url = `https://api.github.com/repos/${window.GITHUB_OWNER}/${window.GITHUB_REPO}/contents/${path}?ref=${window.GITHUB_BRANCH}`;
  const res = await fetch(url, {
    headers: {
      'Authorization': `token ${window.GITHUB_TOKEN}`,
      'Accept': 'application/vnd.github.v3+json'
    }
  });
  if (!res.ok) { if (res.status === 404) return null; throw new Error(`GitHub SHA fetch failed: ${res.status}`); }
  const data = await res.json();
  return data.sha;
}

async function githubSaveFile(path, content, commitMessage) {
  loadGithubConfig();

  // Always fetch the latest SHA immediately before writing
  const freshSHA = await githubGetSHA(path);

  const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(content, null, 2))));
  const body = {
    message: commitMessage || `Update ${path}`,
    content: encoded,
    branch: window.GITHUB_BRANCH
  };
  if (freshSHA) body.sha = freshSHA;

  const url = `https://api.github.com/repos/${window.GITHUB_OWNER}/${window.GITHUB_REPO}/contents/${path}`;
  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      'Authorization': `token ${window.GITHUB_TOKEN}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(`GitHub save failed: ${err.message}`);
  }
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

async function saveEntry(filename, entries) {
  // SHA is now fetched fresh inside githubSaveFile — no need to pass it in
  loadGithubConfig();
  if (!window.GITHUB_OWNER || !window.GITHUB_TOKEN) {
    throw new Error('GitHub not configured. Enter credentials on the home page.');
  }
  const content = { entries, lastUpdated: new Date().toISOString() };
  return await githubSaveFile(`data/${filename}`, content, `Update ${filename}`);
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

  if (ownerInput) ownerInput.value = window.GITHUB_OWNER || '';

  if (saveBtn) {
    saveBtn.addEventListener('click', () => {
      const owner = ownerInput?.value.trim();
      const token = tokenInput?.value.trim();
      if (!owner || !token) {
        if (status) { status.textContent = '// Error: both fields required'; status.className = 'form-status error'; }
        return;
      }
      setGithubConfig(owner, token);
      if (status) { status.textContent = '// Config saved'; status.className = 'form-status success'; }
      setTimeout(() => { panel.style.display = 'none'; }, 1500);
    });
  }
}