// ─── UTILITIES ───────────────────────────────────────────────────────────────

function escapeHtml(str) {
  return (str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function nl2br(str) {
  return (str || '').replace(/\n/g, '<br>');
}

// ─── DOCUMENT RENDERER ───────────────────────────────────────────────────────
// Turns a stored entry object into rich HTML for the doc viewer

function renderDocContent(entry) {
  let html = '';

  // Infobox (if any rows exist)
  const hasInfobox = entry.infoboxRows && entry.infoboxRows.length > 0;
  if (hasInfobox) {
    html += `<div class="doc-infobox">`;
    if (entry.infoboxTitle) html += `<div class="doc-infobox-title">${escapeHtml(entry.infoboxTitle)}</div>`;
    if (entry.image) {
      html += `<img class="doc-infobox-image" src="${escapeHtml(entry.image)}" alt="${escapeHtml(entry.title || '')}" />`;
      if (entry.imageCaption) html += `<div class="doc-infobox-caption">${escapeHtml(entry.imageCaption)}</div>`;
    }
    entry.infoboxRows.forEach(row => {
      if (row.key || row.val) {
        html += `<div class="doc-infobox-row"><div class="doc-infobox-key">${escapeHtml(row.key)}</div><div class="doc-infobox-val">${escapeHtml(row.val)}</div></div>`;
      }
    });
    html += `</div>`;
  }

  // If no infobox but has image, float it right as a figure
  if (!hasInfobox && entry.image) {
    html += `<div class="doc-image-float">`;
    html += `<img src="${escapeHtml(entry.image)}" alt="${escapeHtml(entry.title || '')}" style="width:100%" />`;
    if (entry.imageCaption) html += `<div class="doc-image-caption">${escapeHtml(entry.imageCaption)}</div>`;
    html += `</div>`;
  }

  // Body — split on double newlines into paragraphs, single newlines within
  if (entry.body) {
    const paragraphs = entry.body.split(/\n{2,}/);
    paragraphs.forEach(para => {
      const trimmed = para.trim();
      if (!trimmed) return;
      // Section headers: lines starting with ## or ###
      if (trimmed.startsWith('### ')) {
        html += `<h3>${escapeHtml(trimmed.slice(4))}</h3>`;
      } else if (trimmed.startsWith('## ')) {
        html += `<h2>${escapeHtml(trimmed.slice(3))}</h2>`;
      } else {
        html += `<p>${nl2br(escapeHtml(trimmed))}</p>`;
      }
    });
  }

  return html;
}

// ─── SIDEBAR + VIEWER PAGE ────────────────────────────────────────────────────

function initSidebarPage(config) {
  const { sidebarId, viewerId, editorBarId, addBtnId, dataFile } = config;

  const sidebar = document.getElementById(sidebarId);
  const viewer = document.getElementById(viewerId);
  const editorBar = document.getElementById(editorBarId);
  const addBtn = document.getElementById(addBtnId);

  let currentData = { entries: [], sha: null };
  let activeIndex = null;

  // ── Load ──
  async function loadEntries() {
    const result = await loadData(dataFile);
    currentData = { entries: result.content.entries || [], sha: result.sha };
    renderSidebar();
    if (activeIndex !== null && activeIndex < currentData.entries.length) {
      showEntry(activeIndex);
    } else if (currentData.entries.length > 0) {
      showEntry(0);
    } else {
      showEmpty();
    }
  }

  // ── Sidebar ──
  function renderSidebar() {
    const list = sidebar?.querySelector('.sidebar-list');
    if (!list) return;
    list.innerHTML = '';
    if (currentData.entries.length === 0) {
      list.innerHTML = '<li class="sidebar-item"><span class="sidebar-empty">// No entries yet</span></li>';
      return;
    }
    currentData.entries.forEach((entry, idx) => {
      const li = document.createElement('li');
      li.className = 'sidebar-item';
      const btn = document.createElement('button');
      btn.className = 'sidebar-btn' + (idx === activeIndex ? ' active' : '');
      btn.textContent = entry.title || `Entry ${idx + 1}`;
      btn.addEventListener('click', () => showEntry(idx));
      li.appendChild(btn);
      list.appendChild(li);
    });
  }

  // ── Viewer ──
  function showEntry(idx) {
    activeIndex = idx;
    const entry = currentData.entries[idx];
    if (!entry) return;

    // Update sidebar active state
    sidebar?.querySelectorAll('.sidebar-btn').forEach((b, i) => b.classList.toggle('active', i === idx));

    const header = viewer?.querySelector('.doc-viewer-header');
    const body = viewer?.querySelector('.doc-viewer-body');
    if (!header || !body) return;

    header.innerHTML = `
      <div>
        <div class="doc-viewer-title">${escapeHtml(entry.title || 'Untitled')}</div>
        ${entry.subtitle ? `<div class="doc-viewer-subtitle">${escapeHtml(entry.subtitle)}</div>` : ''}
      </div>
      <div class="viewer-editor-controls" style="display:flex;gap:0.5rem">
        <button class="edit-entry-btn" id="viewer-edit-btn" style="display:none">EDIT</button>
        <button class="delete-entry-btn" id="viewer-delete-btn" style="display:none">DELETE</button>
      </div>
    `;

    body.innerHTML = `<div class="doc-content">${renderDocContent(entry)}</div>`;

    // Show edit/delete if logged in
    const editBtn = header.querySelector('#viewer-edit-btn');
    const deleteBtn = header.querySelector('#viewer-delete-btn');
    if (isLoggedIn()) {
      if (editBtn) editBtn.style.display = '';
      if (deleteBtn) deleteBtn.style.display = '';
    }
    if (editBtn) editBtn.addEventListener('click', () => openForm(idx));
    if (deleteBtn) deleteBtn.addEventListener('click', () => deleteEntry(idx));
  }

  function showEmpty() {
    activeIndex = null;
    const body = viewer?.querySelector('.doc-viewer-body');
    const header = viewer?.querySelector('.doc-viewer-header');
    if (header) header.innerHTML = `<div class="doc-viewer-title">// NO ENTRY SELECTED</div><div></div>`;
    if (body) body.innerHTML = `<div class="doc-viewer-empty">// SELECT AN ENTRY FROM THE SIDEBAR</div>`;
  }

  // ── Delete ──
  async function deleteEntry(idx) {
    const title = currentData.entries[idx]?.title || `Entry ${idx + 1}`;
    if (!confirm(`Delete "${title}"?`)) return;
    currentData.entries.splice(idx, 1);
    try {
      await saveEntry(dataFile, currentData.entries, currentData.sha);
      activeIndex = null;
      await loadEntries();
    } catch (e) { alert('Delete failed: ' + e.message); }
  }

  // ── Add button ──
  if (addBtn) addBtn.addEventListener('click', () => openForm(null));

  // ── Re-show edit buttons when editor activates ──
  document.addEventListener('editorStateChange', () => {
    if (activeIndex !== null) showEntry(activeIndex);
  });

  loadEntries();

  // ── Form ──
  function openForm(editIdx) {
    const existing = editIdx !== null ? currentData.entries[editIdx] : null;
    showEntryForm({
      existing,
      onSave: async (entryData) => {
        if (editIdx !== null) {
          currentData.entries[editIdx] = { ...currentData.entries[editIdx], ...entryData };
        } else {
          currentData.entries.push({ ...entryData, timestamp: new Date().toISOString() });
        }
        const result = await saveEntry(dataFile, currentData.entries, currentData.sha);
        currentData.sha = result?.content?.sha || currentData.sha;
        activeIndex = editIdx !== null ? editIdx : currentData.entries.length - 1;
        renderSidebar();
        showEntry(activeIndex);
      }
    });
  }
}

// ─── ENTRY FORM (modal) ───────────────────────────────────────────────────────

function showEntryForm({ existing, onSave }) {
  // Remove any old form
  const old = document.getElementById('entry-form-overlay');
  if (old) old.remove();

  const overlay = document.createElement('div');
  overlay.id = 'entry-form-overlay';
  overlay.className = 'entry-form-overlay open';

  overlay.innerHTML = `
    <div class="entry-form-box">
      <div class="entry-form-header">
        <div class="entry-form-header-title">${existing ? '// EDIT ENTRY' : '// NEW ENTRY'}</div>
        <button class="entry-form-close" id="efc-close">// CLOSE</button>
      </div>
      <div class="entry-form-body">

        <div class="form-section-label">IDENTIFICATION</div>
        <div class="form-row">
          <div class="form-field">
            <label class="form-label">Title</label>
            <input class="form-input" id="ef-title" type="text" placeholder="Entry title" value="${escapeHtml(existing?.title || '')}" />
          </div>
          <div class="form-field">
            <label class="form-label">Subtitle <span class="form-optional">(optional)</span></label>
            <input class="form-input" id="ef-subtitle" type="text" placeholder="Classification, category, etc." value="${escapeHtml(existing?.subtitle || '')}" />
          </div>
        </div>

        <hr class="form-divider" />
        <div class="form-section-label">BODY TEXT</div>
        <div class="form-field full">
          <label class="form-label">Content</label>
          <textarea class="form-textarea" id="ef-body" placeholder="Write entry content here. Use ## Heading and ### Subheading for sections. Blank line between paragraphs.">${escapeHtml(existing?.body || '')}</textarea>
          <span class="form-hint">## Section Heading &nbsp;|&nbsp; ### Sub-heading &nbsp;|&nbsp; Blank line = new paragraph</span>
        </div>

        <hr class="form-divider" />
        <div class="form-section-label">IMAGE <span style="font-size:0.55rem;color:var(--text-dim);font-family:var(--font-mono)">(OPTIONAL)</span></div>
        <div class="form-field full">
          <label class="form-label">Image URL <span class="form-optional">(paste a direct image link)</span></label>
          <input class="form-input" id="ef-image-url" type="text" placeholder="https://example.com/image.png" value="${escapeHtml(existing?.image || '')}" />
        </div>
        <div class="form-field full">
          <label class="form-label">Image Caption <span class="form-optional">(optional)</span></label>
          <input class="form-input" id="ef-image-caption" type="text" placeholder="Caption shown below image" value="${escapeHtml(existing?.imageCaption || '')}" />
        </div>

        <hr class="form-divider" />
        <div class="form-section-label">INFOBOX <span style="font-size:0.55rem;color:var(--text-dim);font-family:var(--font-mono)">(OPTIONAL — APPEARS AS SIDEBAR TABLE)</span></div>
        <div class="form-field full">
          <label class="form-label">Infobox Title <span class="form-optional">(optional)</span></label>
          <input class="form-input" id="ef-infobox-title" type="text" placeholder="e.g. Maelstrorca" value="${escapeHtml(existing?.infoboxTitle || '')}" />
        </div>
        <div class="form-field full" style="margin-top:0.5rem">
          <label class="form-label">Infobox Rows</label>
          <div class="infobox-rows" id="ef-infobox-rows"></div>
          <button class="add-infobox-row-btn" id="ef-add-row">+ ADD ROW</button>
        </div>

      </div>
      <div class="entry-form-footer">
        <div style="display:flex;gap:0.8rem;align-items:center">
          <button class="form-save-btn" id="ef-save">SAVE ENTRY</button>
          <button class="form-cancel-btn" id="ef-cancel">CANCEL</button>
        </div>
        <div class="form-status" id="ef-status"></div>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  // Populate infobox rows
  const rowsContainer = document.getElementById('ef-infobox-rows');
  const existingRows = existing?.infoboxRows || [];
  existingRows.forEach(row => addInfoboxRow(row.key, row.val));

  function addInfoboxRow(key = '', val = '') {
    const div = document.createElement('div');
    div.className = 'infobox-row-item';
    div.innerHTML = `
      <input class="form-input ib-key" type="text" placeholder="Label" value="${escapeHtml(key)}" />
      <input class="form-input ib-val" type="text" placeholder="Value" value="${escapeHtml(val)}" />
      <button class="infobox-row-remove" title="Remove row">×</button>
    `;
    div.querySelector('.infobox-row-remove').addEventListener('click', () => div.remove());
    rowsContainer.appendChild(div);
  }

  document.getElementById('ef-add-row').addEventListener('click', () => addInfoboxRow());

  // Close
  function closeForm() { overlay.remove(); }
  document.getElementById('efc-close').addEventListener('click', closeForm);
  document.getElementById('ef-cancel').addEventListener('click', closeForm);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) closeForm(); });

  // Save
  document.getElementById('ef-save').addEventListener('click', async () => {
    const title = document.getElementById('ef-title').value.trim();
    const subtitle = document.getElementById('ef-subtitle').value.trim();
    const body = document.getElementById('ef-body').value.trim();
    const image = document.getElementById('ef-image-url').value.trim();
    const imageCaption = document.getElementById('ef-image-caption').value.trim();
    const infoboxTitle = document.getElementById('ef-infobox-title').value.trim();

    const infoboxRows = [];
    rowsContainer.querySelectorAll('.infobox-row-item').forEach(row => {
      const key = row.querySelector('.ib-key').value.trim();
      const val = row.querySelector('.ib-val').value.trim();
      if (key || val) infoboxRows.push({ key, val });
    });

    if (!title && !body) {
      const s = document.getElementById('ef-status');
      s.textContent = '// Error: title or body required';
      s.className = 'form-status error';
      return;
    }

    const s = document.getElementById('ef-status');
    s.textContent = '// Saving...';
    s.className = 'form-status saving';

    try {
      await onSave({ title, subtitle, body, image, imageCaption, infoboxTitle, infoboxRows });
      s.textContent = '// Saved successfully';
      s.className = 'form-status success';
      setTimeout(closeForm, 800);
    } catch (e) {
      s.textContent = `// Save failed: ${e.message}`;
      s.className = 'form-status error';
    }
  });
}

// ─── SHARED HEADER/FOOTER INIT ────────────────────────────────────────────────

function initSharedUI() {
  initAuth().then(() => {
    loadGithubConfig();
    initConfigPanel();
  });
}
