function escapeHtml(str) {
  return (str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function renderEntries(containerId, entries) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = '';
  if (!entries || entries.length === 0) {
    container.innerHTML = '<div class="entry"><span class="entry-body" style="color:var(--text-dim)">// NO ENTRIES FOUND — DATASHARD MAY BE CORRUPTED</span></div>';
    return;
  }
  entries.forEach((entry, idx) => {
    const div = document.createElement('div');
    div.className = 'entry';
    div.dataset.index = idx;
    div.innerHTML = `
      <button class="entry-delete-btn" data-index="${idx}">DELETE</button>
      ${entry.title ? `<div class="entry-title">${escapeHtml(entry.title)}</div>` : ''}
      ${entry.subtitle ? `<div class="entry-subtitle">${escapeHtml(entry.subtitle)}</div>` : ''}
      ${entry.body ? `<div class="entry-body">${escapeHtml(entry.body)}</div>` : ''}
    `;
    container.appendChild(div);
  });
}

function initAddEntry(config) {
  const { formId, btnId, cancelId, statusId, containerId, dataFile } = config;
  const form = document.getElementById(formId);
  const btn = document.getElementById(btnId);
  const cancelBtn = document.getElementById(cancelId);
  const status = document.getElementById(statusId);
  let currentData = { entries: [], sha: null };

  async function loadEntries() {
    const result = await loadData(dataFile);
    currentData = { entries: result.content.entries || [], sha: result.sha };
    renderEntries(containerId, currentData.entries);
    bindDeleteButtons();
  }

  function bindDeleteButtons() {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.querySelectorAll('.entry-delete-btn').forEach(b => {
      b.addEventListener('click', async () => {
        if (!isLoggedIn()) return;
        const idx = parseInt(b.dataset.index);
        const title = currentData.entries[idx]?.title || `Entry ${idx}`;
        if (!confirm(`Delete "${title}"?`)) return;
        currentData.entries.splice(idx, 1);
        try {
          await saveEntry(dataFile, currentData.entries, currentData.sha);
          await loadEntries();
        } catch (e) { alert('Delete failed: ' + e.message); }
      });
    });
  }

  if (btn) btn.addEventListener('click', () => form?.classList.toggle('visible'));
  if (cancelBtn) cancelBtn.addEventListener('click', () => { form?.classList.remove('visible'); clearForm(formId); });

  const saveBtn = form?.querySelector('.form-save-btn');
  if (saveBtn) {
    saveBtn.addEventListener('click', async () => {
      if (!isLoggedIn()) return;
      const title = form.querySelector('.entry-title-input')?.value.trim();
      const subtitle = form.querySelector('.entry-subtitle-input')?.value.trim();
      const body = form.querySelector('.entry-body-input')?.value.trim();
      if (!title && !body) { if (status) { status.textContent = '// Error: title or body required'; status.className = 'form-status visible error'; } return; }
      if (status) { status.textContent = '// Saving to datashard...'; status.className = 'form-status visible saving'; }
      try {
        const newEntry = { title, subtitle, body, timestamp: new Date().toISOString() };
        currentData.entries.push(newEntry);
        const result = await saveEntry(dataFile, currentData.entries, currentData.sha);
        currentData.sha = result?.content?.sha || currentData.sha;
        if (status) { status.textContent = '// Entry committed to datashard'; status.className = 'form-status visible success'; }
        setTimeout(() => { form.classList.remove('visible'); clearForm(formId); if (status) status.classList.remove('visible'); }, 1200);
        renderEntries(containerId, currentData.entries);
        bindDeleteButtons();
      } catch (e) {
        currentData.entries.pop();
        if (status) { status.textContent = `// Save failed: ${e.message}`; status.className = 'form-status visible error'; }
      }
    });
  }

  loadEntries();
}

function clearForm(formId) {
  const form = document.getElementById(formId);
  if (!form) return;
  form.querySelectorAll('input, textarea').forEach(el => el.value = '');
}

// Shared header/footer init
function initSharedUI() {
  initAuth().then(() => {
    loadGithubConfig();
    initConfigPanel();
  });
}