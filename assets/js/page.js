// ─── AUDIO ENGINE ────────────────────────────────────────────────────────────
// All sounds generated via Web Audio API — no external files needed.

const SFX = (() => {
  let ctx = null;

  function getCtx() {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    return ctx;
  }

  // Core tone generator
  function tone({ freq = 440, freq2 = null, type = 'sine', gain = 0.15, attack = 0.01, sustain = 0.08, release = 0.12, delay = 0 } = {}) {
    try {
      const ac = getCtx();
      const t = ac.currentTime + delay;

      const osc = ac.createOscillator();
      const gainNode = ac.createGain();

      osc.connect(gainNode);
      gainNode.connect(ac.destination);

      osc.type = type;
      osc.frequency.setValueAtTime(freq, t);
      if (freq2) osc.frequency.linearRampToValueAtTime(freq2, t + attack + sustain);

      gainNode.gain.setValueAtTime(0, t);
      gainNode.gain.linearRampToValueAtTime(gain, t + attack);
      gainNode.gain.setValueAtTime(gain, t + attack + sustain);
      gainNode.gain.linearRampToValueAtTime(0, t + attack + sustain + release);

      osc.start(t);
      osc.stop(t + attack + sustain + release + 0.01);
    } catch(e) { /* silently fail if audio unavailable */ }
  }

  return {
    // Soft click — nav links, sidebar buttons
    click() {
      tone({ freq: 880, freq2: 660, type: 'sine', gain: 0.08, attack: 0.005, sustain: 0.02, release: 0.06 });
    },

    // Entry open — selecting a doc
    open() {
      tone({ freq: 520, type: 'sine', gain: 0.1, attack: 0.01, sustain: 0.05, release: 0.15 });
      tone({ freq: 780, type: 'sine', gain: 0.06, attack: 0.01, sustain: 0.03, release: 0.1, delay: 0.04 });
    },

    // Form open
    formOpen() {
      tone({ freq: 440, freq2: 600, type: 'sine', gain: 0.1, attack: 0.01, sustain: 0.08, release: 0.18 });
    },

    // Form close / cancel
    formClose() {
      tone({ freq: 500, freq2: 340, type: 'sine', gain: 0.08, attack: 0.01, sustain: 0.05, release: 0.12 });
    },

    // Save success — bright confirmation
    success() {
      tone({ freq: 660, type: 'sine', gain: 0.1, attack: 0.01, sustain: 0.06, release: 0.1 });
      tone({ freq: 880, type: 'sine', gain: 0.08, attack: 0.01, sustain: 0.06, release: 0.12, delay: 0.08 });
      tone({ freq: 1100, type: 'sine', gain: 0.06, attack: 0.01, sustain: 0.08, release: 0.15, delay: 0.16 });
    },

    // Error / login fail — descending harsh buzz
    error() {
      tone({ freq: 300, freq2: 180, type: 'sawtooth', gain: 0.12, attack: 0.005, sustain: 0.1, release: 0.15 });
    },

    // Login success
    loginSuccess() {
      tone({ freq: 480, type: 'sine', gain: 0.1, attack: 0.01, sustain: 0.05, release: 0.1 });
      tone({ freq: 720, type: 'sine', gain: 0.08, attack: 0.01, sustain: 0.08, release: 0.15, delay: 0.07 });
    },

    // Logout
    logout() {
      tone({ freq: 600, freq2: 360, type: 'sine', gain: 0.09, attack: 0.01, sustain: 0.1, release: 0.2 });
    },

    // Tag filter click
    filter() {
      tone({ freq: 740, type: 'sine', gain: 0.07, attack: 0.005, sustain: 0.02, release: 0.08 });
    },

    // Delete — low warning thud
    del() {
      tone({ freq: 200, freq2: 140, type: 'triangle', gain: 0.12, attack: 0.005, sustain: 0.06, release: 0.18 });
    }
  };
})();

// ─── UTILITIES ───────────────────────────────────────────────────────────────

function escapeHtml(str) {
  return (str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function nl2br(str) {
  return (str || '').replace(/\n/g, '<br>');
}

// ─── DOCUMENT RENDERER ───────────────────────────────────────────────────────

function renderDocContent(entry) {
  let html = '';

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

  if (!hasInfobox && entry.image) {
    html += `<div class="doc-image-float">`;
    html += `<img src="${escapeHtml(entry.image)}" alt="${escapeHtml(entry.title || '')}" style="width:100%" />`;
    if (entry.imageCaption) html += `<div class="doc-image-caption">${escapeHtml(entry.imageCaption)}</div>`;
    html += `</div>`;
  }

  if (entry.body) {
    const paragraphs = entry.body.split(/\n{2,}/);
    paragraphs.forEach(para => {
      const trimmed = para.trim();
      if (!trimmed) return;
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
  const {
    sidebarId, viewerId, editorBarId, addBtnId, dataFile,
    tagFilterBarId, sidebarCountId
  } = config;

  const sidebar = document.getElementById(sidebarId);
  const viewer = document.getElementById(viewerId);
  const editorBar = document.getElementById(editorBarId);
  const addBtn = document.getElementById(addBtnId);
  const sidebarCount = sidebarCountId ? document.getElementById(sidebarCountId) : null;

  let currentData = { entries: [], sha: null };
  let activeIndex = null; // index into currentData.entries
  let activeTag = '__all__';

  // ── Preset tags for tech page ──
  const PRESET_TAGS = ['Infrastructure', 'Energy', 'Weapon', 'Drone', 'Transport', 'Computing', 'FTL'];

  // ── Custom tags (persisted in localStorage so they survive across sessions) ──
  let customTags = [];
  try {
    customTags = JSON.parse(localStorage.getItem('solv_custom_tags') || '[]');
  } catch(e) { customTags = []; }

  function saveCustomTags() {
    localStorage.setItem('solv_custom_tags', JSON.stringify(customTags));
  }

  // ── Tag filter bar init ──
  const filterBar = tagFilterBarId ? document.getElementById(tagFilterBarId) : null;
  const presetsContainer = filterBar ? document.getElementById('tag-filter-presets') : null;
  let filterExpanded = false;

  // Build the toggle button and expandable tag area into the bar
  if (filterBar) {
    // Replace bar contents with controlled layout
    filterBar.innerHTML = `
      <span class="tag-filter-label">// FILTER:</span>
      <button class="tag-filter-btn all-btn active" id="tag-all-btn" data-tag="__all__">ALL</button>
      <button class="tag-filter-btn" id="tag-toggle-btn" style="border-style:dashed;margin-left:2px;">▼ SHOW TAGS</button>
      <span id="tag-active-indicator" style="font-family:var(--font-terminal);font-size:0.8rem;color:var(--teal-hot);letter-spacing:0.1em;display:none;"></span>
      <div id="tag-expanded-area" style="display:none;width:100%;margin-top:0.5rem;display:none;flex-wrap:wrap;gap:0.4rem;align-items:center;">
        <div id="tag-filter-presets" style="display:contents"></div>
        <div class="tag-filter-divider" id="tag-editor-divider" style="display:none"></div>
        <input class="tag-custom-input" id="tag-custom-input" type="text" placeholder="NEW TAG..." maxlength="24" style="display:none;" />
        <button class="tag-custom-add" id="tag-custom-add-btn" style="display:none;">+ ADD</button>
      </div>
    `;
  }

  const tagExpandedArea = document.getElementById('tag-expanded-area');
  const tagToggleBtn = document.getElementById('tag-toggle-btn');
  const tagActiveIndicator = document.getElementById('tag-active-indicator');

  if (tagToggleBtn) {
    tagToggleBtn.addEventListener('click', () => {
      filterExpanded = !filterExpanded;
      SFX.click();
      tagExpandedArea.style.display = filterExpanded ? 'flex' : 'none';
      tagToggleBtn.textContent = filterExpanded ? '▲ HIDE TAGS' : '▼ SHOW TAGS';
    });
  }

  const allBtnEl = document.getElementById('tag-all-btn');
  if (allBtnEl) allBtnEl.addEventListener('click', () => { SFX.filter(); setActiveTag('__all__'); });

  function updateEditorTagControls() {
    const editorDiv = document.getElementById('tag-editor-divider');
    const customInput = document.getElementById('tag-custom-input');
    const customAddBtn = document.getElementById('tag-custom-add-btn');
    const show = isLoggedIn();
    if (editorDiv) editorDiv.style.display = show ? 'block' : 'none';
    if (customInput) customInput.style.display = show ? '' : 'none';
    if (customAddBtn) customAddBtn.style.display = show ? '' : 'none';
  }

  function renderTagFilterBar() {
    const presetsEl = document.getElementById('tag-filter-presets');
    if (!presetsEl) return;

    presetsEl.innerHTML = '';

    const entryTags = new Set();
    currentData.entries.forEach(e => (e.tags || []).forEach(t => entryTags.add(t)));
    const allTags = [...new Set([...PRESET_TAGS, ...customTags, ...entryTags])];

    allTags.forEach(tag => {
      const isCustom = !PRESET_TAGS.includes(tag);
      const wrap = document.createElement('span');
      wrap.style.cssText = 'display:inline-flex;align-items:center;gap:2px;';

      const btn = document.createElement('button');
      btn.className = 'tag-filter-btn' + (activeTag === tag ? ' active' : '');
      btn.dataset.tag = tag;
      btn.textContent = tag.toUpperCase();
      btn.addEventListener('click', () => { SFX.filter(); setActiveTag(tag); });
      wrap.appendChild(btn);

      // Delete button for custom tags — only visible in editor mode
      if (isCustom) {
        const del = document.createElement('button');
        del.className = 'tag-del-btn';
        del.title = `Remove tag "${tag}"`;
        del.textContent = '×';
        del.style.cssText = `
          background:none;
          border:none;
          color:#aa4400;
          font-family:var(--font-mono);
          font-size:0.7rem;
          cursor:pointer;
          padding:0 3px;
          line-height:1;
          display:${isLoggedIn() ? 'inline-block' : 'none'};
        `;
        del.addEventListener('click', (e) => {
          e.stopPropagation();
          SFX.del();
          customTags = customTags.filter(t => t !== tag);
          saveCustomTags();
          if (activeTag === tag) setActiveTag('__all__');
          else renderTagFilterBar();
        });
        wrap.appendChild(del);
      }

      presetsEl.appendChild(wrap);
    });

    // ALL button state
    if (allBtnEl) allBtnEl.classList.toggle('active', activeTag === '__all__');

    // Active tag indicator (shown in collapsed state)
    if (tagActiveIndicator) {
      if (activeTag !== '__all__') {
        tagActiveIndicator.textContent = `— ${activeTag.toUpperCase()}`;
        tagActiveIndicator.style.display = '';
      } else {
        tagActiveIndicator.style.display = 'none';
      }
    }

    updateEditorTagControls();
  }

  function setActiveTag(tag) {
    activeTag = tag;
    renderTagFilterBar();
    renderSidebar();
  }

  // Custom tag add
  const customInput = document.getElementById('tag-custom-input');
  const customAddBtn = document.getElementById('tag-custom-add-btn');

  function addCustomTag() {
    if (!customInput) return;
    const val = customInput.value.trim();
    if (!val) return;
    const normalised = val.charAt(0).toUpperCase() + val.slice(1).toLowerCase();
    if (!customTags.includes(normalised) && !PRESET_TAGS.includes(normalised)) {
      customTags.push(normalised);
      saveCustomTags();
    }
    customInput.value = '';
    renderTagFilterBar();
  }

  if (customAddBtn) customAddBtn.addEventListener('click', addCustomTag);
  if (customInput) customInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') addCustomTag(); });

  // ── Load ──
  async function loadEntries() {
    const result = await loadData(dataFile);
    currentData = { entries: result.content.entries || [], sha: result.sha };
    renderTagFilterBar();
    renderSidebar();
    // Try to restore active entry
    if (activeIndex !== null && activeIndex < currentData.entries.length) {
      showEntry(activeIndex);
    } else if (filteredEntries().length > 0) {
      showEntry(currentData.entries.indexOf(filteredEntries()[0]));
    } else {
      showEmpty();
    }
  }

  // ── Filter ──
  function filteredEntries() {
    if (activeTag === '__all__') return currentData.entries;
    return currentData.entries.filter(e => (e.tags || []).includes(activeTag));
  }

  // ── Sidebar ──
  function renderSidebar() {
    const list = sidebar?.querySelector('.sidebar-list');
    if (!list) return;
    list.innerHTML = '';

    const visible = filteredEntries();

    if (sidebarCount) {
      sidebarCount.textContent = `// ${visible.length} ENTR${visible.length === 1 ? 'Y' : 'IES'}${activeTag !== '__all__' ? ` — ${activeTag.toUpperCase()}` : ''}`;
    }

    if (visible.length === 0) {
      list.innerHTML = '<li class="sidebar-item"><span class="sidebar-empty">// No entries match filter</span></li>';
      return;
    }

    visible.forEach((entry) => {
      const realIdx = currentData.entries.indexOf(entry);
      const li = document.createElement('li');
      li.className = 'sidebar-item';

      const btn = document.createElement('button');
      btn.className = 'sidebar-btn' + (realIdx === activeIndex ? ' active' : '');

      // Title
      const titleSpan = document.createElement('span');
      titleSpan.textContent = entry.title || `Entry ${realIdx + 1}`;

      btn.appendChild(titleSpan);

      // Tag chips under title
      if (entry.tags && entry.tags.length > 0) {
        const chipsWrap = document.createElement('div');
        chipsWrap.className = 'sidebar-entry-tags';
        entry.tags.forEach(tag => {
          const chip = document.createElement('span');
          chip.className = 'sidebar-tag-chip';
          chip.textContent = tag;
          chipsWrap.appendChild(chip);
        });
        btn.appendChild(chipsWrap);
      }

      btn.style.flexDirection = 'column';
      btn.style.alignItems = 'flex-start';

      btn.addEventListener('click', () => { SFX.open(); showEntry(realIdx); });
      li.appendChild(btn);
      list.appendChild(li);
    });
  }

  // ── Viewer ──
  function showEntry(idx) {
    activeIndex = idx;
    const entry = currentData.entries[idx];
    if (!entry) return;

    sidebar?.querySelectorAll('.sidebar-btn').forEach((b, i) => {
      // match by data rather than index since sidebar only shows filtered
      b.classList.remove('active');
    });
    // Re-find the correct sidebar btn
    const list = sidebar?.querySelector('.sidebar-list');
    if (list) {
      list.querySelectorAll('.sidebar-btn').forEach(btn => {
        const titleText = btn.querySelector('span')?.textContent;
        if (titleText === (entry.title || `Entry ${idx + 1}`)) btn.classList.add('active');
      });
    }

    const header = viewer?.querySelector('.doc-viewer-header');
    const body = viewer?.querySelector('.doc-viewer-body');
    if (!header || !body) return;

    // Tags display in viewer header
    const tagsHtml = (entry.tags && entry.tags.length > 0)
      ? `<div class="viewer-tags">${entry.tags.map(t => `<span class="viewer-tag-chip">${escapeHtml(t)}</span>`).join('')}</div>`
      : '';

    header.innerHTML = `
      <div>
        <div class="doc-viewer-title">${escapeHtml(entry.title || 'Untitled')}</div>
        ${entry.subtitle ? `<div class="doc-viewer-subtitle">${escapeHtml(entry.subtitle)}</div>` : ''}
        ${tagsHtml}
      </div>
      <div class="viewer-editor-controls" style="display:flex;gap:0.5rem;align-items:flex-start">
        <button class="edit-entry-btn" id="viewer-edit-btn" style="display:none">EDIT</button>
        <button class="delete-entry-btn" id="viewer-delete-btn" style="display:none">DELETE</button>
      </div>
    `;

    body.innerHTML = `<div class="doc-content">${renderDocContent(entry)}</div>`;

    const editBtn = header.querySelector('#viewer-edit-btn');
    const deleteBtn = header.querySelector('#viewer-delete-btn');
    if (isLoggedIn()) {
      if (editBtn) editBtn.style.display = '';
      if (deleteBtn) deleteBtn.style.display = '';
    }
    if (editBtn) editBtn.addEventListener('click', () => { SFX.formOpen(); openForm(idx); });
    if (deleteBtn) deleteBtn.addEventListener('click', () => { SFX.del(); deleteEntry(idx); });
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

  if (addBtn) addBtn.addEventListener('click', () => { SFX.formOpen(); openForm(null); });

  document.addEventListener('editorStateChange', () => {
    if (activeIndex !== null) showEntry(activeIndex);
    if (typeof updateEditorTagControls === 'function') updateEditorTagControls();
    renderTagFilterBar();
  });

  loadEntries();

  // ── Form ──
  function openForm(editIdx) {
    const existing = editIdx !== null ? currentData.entries[editIdx] : null;
    // Build full tag list for the form
    const allAvailableTags = [...new Set([
      ...PRESET_TAGS,
      ...customTags,
      ...currentData.entries.flatMap(e => e.tags || [])
    ])];

    showEntryForm({
      existing,
      availableTags: allAvailableTags,
      onSave: async (entryData) => {
        // Merge any new tags into customTags
        (entryData.tags || []).forEach(t => {
          if (!PRESET_TAGS.includes(t) && !customTags.includes(t)) {
            customTags.push(t);
            saveCustomTags();
          }
        });

        if (editIdx !== null) {
          currentData.entries[editIdx] = { ...currentData.entries[editIdx], ...entryData };
        } else {
          currentData.entries.push({ ...entryData, timestamp: new Date().toISOString() });
        }
        const result = await saveEntry(dataFile, currentData.entries, currentData.sha);
        currentData.sha = result?.content?.sha || currentData.sha;
        activeIndex = editIdx !== null ? editIdx : currentData.entries.length - 1;
        renderTagFilterBar();
        renderSidebar();
        showEntry(activeIndex);
      }
    });
  }
}

// ─── ENTRY FORM (modal) ───────────────────────────────────────────────────────

function showEntryForm({ existing, availableTags = [], onSave }) {
  const old = document.getElementById('entry-form-overlay');
  if (old) old.remove();

  const overlay = document.createElement('div');
  overlay.id = 'entry-form-overlay';
  overlay.className = 'entry-form-overlay open';

  // Build tag selector HTML
  const selectedTags = new Set(existing?.tags || []);
  const allTagsForForm = [...new Set([...availableTags, ...(existing?.tags || [])])];

  const tagSelectorHtml = `
    <div class="form-field full">
      <label class="form-label">Tags <span class="form-optional">(select all that apply)</span></label>
      <div id="ef-tag-selector" style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:6px;">
        ${allTagsForForm.map(tag => `
          <button type="button" class="tag-filter-btn ef-tag-btn${selectedTags.has(tag) ? ' active' : ''}" data-tag="${escapeHtml(tag)}" style="font-size:0.6rem;padding:0.2rem 0.6rem;">
            ${escapeHtml(tag.toUpperCase())}
          </button>
        `).join('')}
      </div>
      <div style="display:flex;gap:0.5rem;align-items:center;margin-top:4px;">
        <input class="tag-custom-input" id="ef-new-tag-input" type="text" placeholder="NEW TAG..." maxlength="24" style="width:130px;" />
        <button type="button" class="tag-custom-add" id="ef-new-tag-add">+ ADD</button>
      </div>
      <span class="form-hint">Click to toggle. Type a new tag and click + ADD to create it.</span>
    </div>
  `;

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

        ${tagSelectorHtml}

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
          <input class="form-input" id="ef-infobox-title" type="text" placeholder="e.g. Elenaric Crystal" value="${escapeHtml(existing?.infoboxTitle || '')}" />
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

  // Tag toggle logic
  const tagSelector = document.getElementById('ef-tag-selector');

  tagSelector.addEventListener('click', (e) => {
    const btn = e.target.closest('.ef-tag-btn');
    if (!btn) return;
    btn.classList.toggle('active');
  });

  // Add new tag to form
  const newTagInput = document.getElementById('ef-new-tag-input');
  const newTagAddBtn = document.getElementById('ef-new-tag-add');

  function addTagToForm() {
    const val = newTagInput.value.trim();
    if (!val) return;
    const normalised = val.charAt(0).toUpperCase() + val.slice(1).toLowerCase();
    // Check not already in selector
    const existing_btn = tagSelector.querySelector(`[data-tag="${normalised}"]`);
    if (!existing_btn) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'tag-filter-btn ef-tag-btn active';
      btn.dataset.tag = normalised;
      btn.style.cssText = 'font-size:0.6rem;padding:0.2rem 0.6rem;';
      btn.textContent = normalised.toUpperCase();
      tagSelector.appendChild(btn);
    } else {
      existing_btn.classList.add('active');
    }
    newTagInput.value = '';
  }

  newTagAddBtn.addEventListener('click', addTagToForm);
  newTagInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); addTagToForm(); } });

  // Infobox rows
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

  function closeForm() { SFX.formClose(); overlay.remove(); }
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

    // Collect active tags
    const tags = [];
    tagSelector.querySelectorAll('.ef-tag-btn.active').forEach(btn => {
      if (btn.dataset.tag) tags.push(btn.dataset.tag);
    });

    const infoboxRows = [];
    rowsContainer.querySelectorAll('.infobox-row-item').forEach(row => {
      const key = row.querySelector('.ib-key').value.trim();
      const val = row.querySelector('.ib-val').value.trim();
      if (key || val) infoboxRows.push({ key, val });
    });

    if (!title && !body) {
      SFX.error();
      const s = document.getElementById('ef-status');
      s.textContent = '// Error: title or body required';
      s.className = 'form-status error';
      return;
    }

    const s = document.getElementById('ef-status');
    s.textContent = '// Saving...';
    s.className = 'form-status saving';

    try {
      await onSave({ title, subtitle, body, image, imageCaption, infoboxTitle, infoboxRows, tags });
      SFX.success();
      s.textContent = '// Saved successfully';
      s.className = 'form-status success';
      setTimeout(closeForm, 800);
    } catch (e) {
      SFX.error();
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