/* ════════════════════════════════════════════════════
   RESUMEFORGE — app.js
   Full client-side resume builder logic
════════════════════════════════════════════════════ */

'use strict';

// ── STATE ────────────────────────────────────────────
let state = {
  template: 'classic',
  theme: 'dark',
  zoom: 1.0,
  photo: null,
  skills: [],
  experience: [],
  education: [],
  projects: [],
  certifications: [],
  // form fields read directly from DOM on render
};

// ── INIT ─────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  loadFromStorage();
  renderPreview();
  updateProgress();
  applyTheme();
  applyZoom();

  // Summary character count
  const summaryEl = document.getElementById('summary');
  summaryEl.addEventListener('input', () => {
    const len = summaryEl.value.length;
    document.getElementById('summaryCount').textContent = `${len} / 400`;
    if (len > 400) summaryEl.value = summaryEl.value.slice(0, 400);
  });
});

// ── SECTION NAVIGATION ───────────────────────────────
function showSection(name) {
  document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.form-panel').forEach(p => p.classList.remove('active'));

  document.querySelector(`[data-section="${name}"]`)?.classList.add('active');
  document.getElementById(`panel-${name}`)?.classList.add('active');
}

// ── THEME ─────────────────────────────────────────────
function toggleTheme() {
  state.theme = state.theme === 'dark' ? 'light' : 'dark';
  applyTheme();
  saveToStorage();
}
function applyTheme() {
  document.documentElement.setAttribute('data-theme', state.theme);
  document.getElementById('themeToggle').textContent = state.theme === 'dark' ? '☀' : '☾';
}

// ── TEMPLATE ─────────────────────────────────────────
function setTemplate(tpl) {
  state.template = tpl;
  document.querySelectorAll('.template-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.tpl === tpl);
  });
  renderPreview();
  saveToStorage();
}

// ── ZOOM ─────────────────────────────────────────────
function changeZoom(delta) {
  state.zoom = Math.min(1.4, Math.max(0.4, state.zoom + delta));
  applyZoom();
}
function applyZoom() {
  document.getElementById('previewWrapper').style.transform = `scale(${state.zoom})`;
  document.getElementById('zoomLevel').textContent = Math.round(state.zoom * 100) + '%';
}

// ── PHOTO ─────────────────────────────────────────────
function handlePhoto(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    state.photo = e.target.result;
    const preview = document.getElementById('photoPreview');
    preview.innerHTML = `<img src="${state.photo}" alt="Profile photo">`;
    renderPreview();
    saveToStorage();
  };
  reader.readAsDataURL(file);
}

// ── SKILLS ────────────────────────────────────────────
function handleSkillKey(e) {
  if (e.key === 'Enter') { e.preventDefault(); addSkill(); }
}
function addSkill() {
  const input = document.getElementById('skillInput');
  const val = input.value.trim();
  if (!val || state.skills.includes(val)) { input.value = ''; return; }
  state.skills.push(val);
  input.value = '';
  renderSkillTags();
  renderPreview();
  saveToStorage();
}
function removeSkill(idx) {
  state.skills.splice(idx, 1);
  renderSkillTags();
  renderPreview();
  saveToStorage();
}
function renderSkillTags() {
  const container = document.getElementById('skillTags');
  container.innerHTML = state.skills.map((s, i) => `
    <span class="skill-tag">
      ${escHtml(s)}
      <span class="tag-del" onclick="removeSkill(${i})">×</span>
    </span>
  `).join('');
}

// ── EXPERIENCE ────────────────────────────────────────
function addExperience() {
  state.experience.push({ company: '', title: '', from: '', to: '', current: false, desc: '' });
  renderExperienceList();
}
function removeExperience(idx) {
  state.experience.splice(idx, 1);
  renderExperienceList();
  renderPreview();
  saveToStorage();
}
function renderExperienceList() {
  const list = document.getElementById('experienceList');
  list.innerHTML = state.experience.map((exp, i) => `
    <div class="dynamic-card" draggable="true"
         ondragstart="dragStart(event,'experience',${i})"
         ondragover="dragOver(event)"
         ondrop="dragDrop(event,'experience',${i})"
         ondragleave="dragLeave(event)">
      <div class="card-header">
        <span class="drag-handle" title="Drag to reorder">⠿</span>
        <span class="card-title">Experience ${i + 1}</span>
        <div class="card-actions">
          <button class="btn-remove" onclick="removeExperience(${i})" title="Remove">✕</button>
        </div>
      </div>
      <div class="form-grid-2">
        <div class="field">
          <label>Job Title</label>
          <input type="text" value="${escAttr(exp.title)}" placeholder="Senior Developer"
            oninput="state.experience[${i}].title=this.value;updateResume()">
        </div>
        <div class="field">
          <label>Company</label>
          <input type="text" value="${escAttr(exp.company)}" placeholder="Acme Inc."
            oninput="state.experience[${i}].company=this.value;updateResume()">
        </div>
      </div>
      <div class="form-grid-2">
        <div class="field">
          <label>From</label>
          <input type="text" value="${escAttr(exp.from)}" placeholder="Jan 2021"
            oninput="state.experience[${i}].from=this.value;updateResume()">
        </div>
        <div class="field">
          <label>To (or "Present")</label>
          <input type="text" value="${escAttr(exp.to)}" placeholder="Present"
            oninput="state.experience[${i}].to=this.value;updateResume()">
        </div>
      </div>
      <div class="field">
        <label>Description / Achievements</label>
        <textarea rows="3" placeholder="• Led a team of 5 engineers to deliver…"
          oninput="state.experience[${i}].desc=this.value;updateResume()">${escHtml(exp.desc)}</textarea>
      </div>
    </div>
  `).join('');
}

// ── EDUCATION ─────────────────────────────────────────
function addEducation() {
  state.education.push({ school: '', degree: '', field: '', from: '', to: '', desc: '' });
  renderEducationList();
}
function removeEducation(idx) {
  state.education.splice(idx, 1);
  renderEducationList();
  renderPreview();
  saveToStorage();
}
function renderEducationList() {
  const list = document.getElementById('educationList');
  list.innerHTML = state.education.map((edu, i) => `
    <div class="dynamic-card" draggable="true"
         ondragstart="dragStart(event,'education',${i})"
         ondragover="dragOver(event)"
         ondrop="dragDrop(event,'education',${i})"
         ondragleave="dragLeave(event)">
      <div class="card-header">
        <span class="drag-handle" title="Drag to reorder">⠿</span>
        <span class="card-title">Education ${i + 1}</span>
        <div class="card-actions">
          <button class="btn-remove" onclick="removeEducation(${i})" title="Remove">✕</button>
        </div>
      </div>
      <div class="field">
        <label>School / University</label>
        <input type="text" value="${escAttr(edu.school)}" placeholder="MIT"
          oninput="state.education[${i}].school=this.value;updateResume()">
      </div>
      <div class="form-grid-2">
        <div class="field">
          <label>Degree</label>
          <input type="text" value="${escAttr(edu.degree)}" placeholder="Bachelor of Science"
            oninput="state.education[${i}].degree=this.value;updateResume()">
        </div>
        <div class="field">
          <label>Field of Study</label>
          <input type="text" value="${escAttr(edu.field)}" placeholder="Computer Science"
            oninput="state.education[${i}].field=this.value;updateResume()">
        </div>
      </div>
      <div class="form-grid-2">
        <div class="field">
          <label>From</label>
          <input type="text" value="${escAttr(edu.from)}" placeholder="2017"
            oninput="state.education[${i}].from=this.value;updateResume()">
        </div>
        <div class="field">
          <label>To</label>
          <input type="text" value="${escAttr(edu.to)}" placeholder="2021"
            oninput="state.education[${i}].to=this.value;updateResume()">
        </div>
      </div>
      <div class="field">
        <label>Notes (optional)</label>
        <input type="text" value="${escAttr(edu.desc)}" placeholder="GPA: 3.9, Dean's List"
          oninput="state.education[${i}].desc=this.value;updateResume()">
      </div>
    </div>
  `).join('');
}

// ── PROJECTS ──────────────────────────────────────────
function addProject() {
  state.projects.push({ name: '', role: '', url: '', desc: '' });
  renderProjectList();
}
function removeProject(idx) {
  state.projects.splice(idx, 1);
  renderProjectList();
  renderPreview();
  saveToStorage();
}
function renderProjectList() {
  const list = document.getElementById('projectList');
  list.innerHTML = state.projects.map((p, i) => `
    <div class="dynamic-card">
      <div class="card-header">
        <span class="drag-handle">⠿</span>
        <span class="card-title">Project ${i + 1}</span>
        <button class="btn-remove" onclick="removeProject(${i})">✕</button>
      </div>
      <div class="form-grid-2">
        <div class="field">
          <label>Project Name</label>
          <input type="text" value="${escAttr(p.name)}" placeholder="AI Dashboard"
            oninput="state.projects[${i}].name=this.value;updateResume()">
        </div>
        <div class="field">
          <label>Your Role</label>
          <input type="text" value="${escAttr(p.role)}" placeholder="Lead Developer"
            oninput="state.projects[${i}].role=this.value;updateResume()">
        </div>
      </div>
      <div class="field">
        <label>Project URL</label>
        <input type="url" value="${escAttr(p.url)}" placeholder="https://github.com/..."
          oninput="state.projects[${i}].url=this.value;updateResume()">
      </div>
      <div class="field">
        <label>Description</label>
        <textarea rows="2" placeholder="Built a real-time analytics dashboard using…"
          oninput="state.projects[${i}].desc=this.value;updateResume()">${escHtml(p.desc)}</textarea>
      </div>
    </div>
  `).join('');
}

// ── CERTIFICATIONS ────────────────────────────────────
function addCert() {
  state.certifications.push({ name: '', issuer: '', date: '', url: '' });
  renderCertList();
}
function removeCert(idx) {
  state.certifications.splice(idx, 1);
  renderCertList();
  renderPreview();
  saveToStorage();
}
function renderCertList() {
  const list = document.getElementById('certList');
  list.innerHTML = state.certifications.map((c, i) => `
    <div class="dynamic-card">
      <div class="card-header">
        <span class="drag-handle">⠿</span>
        <span class="card-title">Certification ${i + 1}</span>
        <button class="btn-remove" onclick="removeCert(${i})">✕</button>
      </div>
      <div class="form-grid-2">
        <div class="field">
          <label>Certification Name</label>
          <input type="text" value="${escAttr(c.name)}" placeholder="AWS Solutions Architect"
            oninput="state.certifications[${i}].name=this.value;updateResume()">
        </div>
        <div class="field">
          <label>Issuing Organization</label>
          <input type="text" value="${escAttr(c.issuer)}" placeholder="Amazon Web Services"
            oninput="state.certifications[${i}].issuer=this.value;updateResume()">
        </div>
      </div>
      <div class="form-grid-2">
        <div class="field">
          <label>Date Obtained</label>
          <input type="text" value="${escAttr(c.date)}" placeholder="March 2023"
            oninput="state.certifications[${i}].date=this.value;updateResume()">
        </div>
        <div class="field">
          <label>Credential URL</label>
          <input type="url" value="${escAttr(c.url)}" placeholder="https://..."
            oninput="state.certifications[${i}].url=this.value;updateResume()">
        </div>
      </div>
    </div>
  `).join('');
}

// ── DRAG & DROP ────────────────────────────────────────
let dragSrc = null;
function dragStart(e, list, idx) {
  dragSrc = { list, idx };
  e.dataTransfer.effectAllowed = 'move';
}
function dragOver(e) {
  e.preventDefault();
  e.currentTarget.classList.add('drag-over');
}
function dragLeave(e) {
  e.currentTarget.classList.remove('drag-over');
}
function dragDrop(e, list, idx) {
  e.currentTarget.classList.remove('drag-over');
  if (!dragSrc || dragSrc.list !== list || dragSrc.idx === idx) return;
  const arr = state[list];
  const item = arr.splice(dragSrc.idx, 1)[0];
  arr.splice(idx, 0, item);
  dragSrc = null;
  // Re-render the appropriate list
  if (list === 'experience') renderExperienceList();
  if (list === 'education') renderEducationList();
  renderPreview();
  saveToStorage();
}

// ── GET FORM DATA ─────────────────────────────────────
function getFormData() {
  return {
    firstName: val('firstName'),
    lastName: val('lastName'),
    jobTitle: val('jobTitle'),
    email: val('email'),
    phone: val('phone'),
    location: val('location'),
    website: val('website'),
    summary: val('summary'),
    linkedin: val('linkedin'),
    github: val('github'),
    portfolio: val('portfolio'),
    twitter: val('twitter'),
  };
}

function val(id) {
  const el = document.getElementById(id);
  return el ? el.value.trim() : '';
}

// ── UPDATE (called on every input) ───────────────────
function updateResume() {
  renderPreview();
  updateProgress();
  saveToStorage();
}

// ── PROGRESS BAR ──────────────────────────────────────
function updateProgress() {
  const fd = getFormData();
  let score = 0, total = 0;

  const check = (v) => { total++; if (v) score++; };

  check(fd.firstName); check(fd.lastName); check(fd.email);
  check(fd.phone); check(fd.jobTitle); check(fd.location);
  check(fd.summary && fd.summary.length > 40);
  check(state.experience.length > 0);
  check(state.education.length > 0);
  check(state.skills.length >= 3);
  check(fd.linkedin || fd.github);
  check(state.photo);

  const pct = Math.round((score / total) * 100);
  document.getElementById('progressFill').style.width = pct + '%';
  document.getElementById('progressPct').textContent = pct + '%';
}

// ══════════════════════════════════════════
// RENDER PREVIEW
// ══════════════════════════════════════════
function renderPreview() {
  const fd = getFormData();
  const sheet = document.getElementById('resumePreview');
  const tpl = state.template;

  // Nothing filled in → show empty state
  const hasData = fd.firstName || fd.lastName || fd.email || fd.summary ||
    state.experience.length || state.education.length || state.skills.length;

  if (!hasData) {
    sheet.className = 'resume-sheet';
    sheet.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📄</div>
        <p>Start filling in your details<br>to see your resume come to life</p>
      </div>`;
    return;
  }

  sheet.className = `resume-sheet tpl-${tpl}`;

  const fullName = [fd.firstName, fd.lastName].filter(Boolean).join(' ');

  // Build contact items
  const contacts = [
    fd.email && `✉ ${escHtml(fd.email)}`,
    fd.phone && `✆ ${escHtml(fd.phone)}`,
    fd.location && `◎ ${escHtml(fd.location)}`,
    fd.website && `⌁ ${escHtml(fd.website)}`,
  ].filter(Boolean);

  // Social links
  const socials = [
    fd.linkedin && { label: 'LinkedIn', url: fd.linkedin },
    fd.github && { label: 'GitHub', url: fd.github },
    fd.portfolio && { label: 'Portfolio', url: fd.portfolio },
    fd.twitter && { label: 'Twitter', url: fd.twitter },
  ].filter(Boolean);

  if (tpl === 'classic') sheet.innerHTML = renderClassic(fd, fullName, contacts, socials);
  else if (tpl === 'modern') sheet.innerHTML = renderModern(fd, fullName, contacts, socials);
  else if (tpl === 'minimal') sheet.innerHTML = renderMinimal(fd, fullName, contacts, socials);
}

// ── TEMPLATE: CLASSIC ────────────────────────────────
function renderClassic(fd, fullName, contacts, socials) {
  return `
    <div class="resume-header">
      ${state.photo ? `<img class="header-photo" src="${state.photo}" alt="Profile">` : ''}
      <div class="header-info">
        ${fullName ? `<div class="r-name">${escHtml(fullName)}</div>` : ''}
        ${fd.jobTitle ? `<div class="r-title">${escHtml(fd.jobTitle)}</div>` : ''}
        <div class="r-contacts">
          ${contacts.map(c => `<span class="r-contact-item">${c}</span>`).join('')}
        </div>
      </div>
    </div>
    <div class="resume-body">
      <div class="main-col">
        ${fd.summary ? `
          <div class="r-section">
            <div class="r-section-title">Professional Summary</div>
            <p class="r-summary">${escHtml(fd.summary)}</p>
          </div>` : ''}
        ${state.experience.length ? `
          <div class="r-section">
            <div class="r-section-title">Work Experience</div>
            ${state.experience.map(e => `
              <div class="r-item">
                <div class="r-item-header">
                  <span class="r-item-title">${escHtml(e.title)}</span>
                  <span class="r-item-date">${escHtml([e.from, e.to].filter(Boolean).join(' – '))}</span>
                </div>
                ${e.company ? `<div class="r-item-sub">${escHtml(e.company)}</div>` : ''}
                ${e.desc ? `<div class="r-item-desc">${nl2br(escHtml(e.desc))}</div>` : ''}
              </div>`).join('')}
          </div>` : ''}
        ${state.projects.length ? `
          <div class="r-section">
            <div class="r-section-title">Projects</div>
            ${state.projects.map(p => `
              <div class="r-item">
                <div class="r-item-header">
                  <span class="r-item-title">${escHtml(p.name)}</span>
                  ${p.role ? `<span class="r-item-date">${escHtml(p.role)}</span>` : ''}
                </div>
                ${p.url ? `<div class="r-item-sub">${escHtml(p.url)}</div>` : ''}
                ${p.desc ? `<div class="r-item-desc">${escHtml(p.desc)}</div>` : ''}
              </div>`).join('')}
          </div>` : ''}
      </div>
      <div class="side-col">
        ${state.education.length ? `
          <div class="r-section">
            <div class="r-section-title">Education</div>
            ${state.education.map(e => `
              <div class="r-item">
                <div class="r-item-title">${escHtml(e.school)}</div>
                <div class="r-item-sub">${escHtml([e.degree, e.field].filter(Boolean).join(', '))}</div>
                <div class="r-item-date">${escHtml([e.from, e.to].filter(Boolean).join(' – '))}</div>
                ${e.desc ? `<div class="r-item-desc">${escHtml(e.desc)}</div>` : ''}
              </div>`).join('')}
          </div>` : ''}
        ${state.skills.length ? `
          <div class="r-section">
            <div class="r-section-title">Skills</div>
            <div class="r-skill-list">
              ${state.skills.map(s => `<span class="r-skill-tag">${escHtml(s)}</span>`).join('')}
            </div>
          </div>` : ''}
        ${state.certifications.length ? `
          <div class="r-section">
            <div class="r-section-title">Certifications</div>
            ${state.certifications.map(c => `
              <div class="r-item">
                <div class="r-item-title">${escHtml(c.name)}</div>
                <div class="r-item-sub">${escHtml(c.issuer)}</div>
                <div class="r-item-date">${escHtml(c.date)}</div>
              </div>`).join('')}
          </div>` : ''}
        ${socials.length ? `
          <div class="r-section">
            <div class="r-section-title">Links</div>
            <div class="r-social">
              ${socials.map(s => `<div class="r-social-item">🔗 ${escHtml(s.label)}: ${escHtml(s.url)}</div>`).join('')}
            </div>
          </div>` : ''}
      </div>
    </div>`;
}

// ── TEMPLATE: MODERN ────────────────────────────────
function renderModern(fd, fullName, contacts, socials) {
  return `
    <div class="resume-header">
      ${state.photo ? `<img class="header-photo" src="${state.photo}" alt="Profile">` : ''}
      <div class="header-info">
        ${fullName ? `<div class="r-name">${escHtml(fullName)}</div>` : ''}
        ${fd.jobTitle ? `<div class="r-title">${escHtml(fd.jobTitle)}</div>` : ''}
        <div class="r-contacts">
          ${contacts.map(c => `<span>${c}</span>`).join('')}
        </div>
      </div>
    </div>
    <div class="resume-body">
      ${fd.summary ? `
        <div class="r-section">
          <div class="r-section-title">About</div>
          <p class="r-summary">${escHtml(fd.summary)}</p>
        </div>` : ''}
      ${state.experience.length ? `
        <div class="r-section">
          <div class="r-section-title">Experience</div>
          ${state.experience.map(e => `
            <div class="r-item">
              <div class="r-item-header">
                <span class="r-item-title">${escHtml(e.title)}${e.company ? ` · ${escHtml(e.company)}` : ''}</span>
                ${(e.from || e.to) ? `<span class="r-item-date">${escHtml([e.from, e.to].filter(Boolean).join(' – '))}</span>` : ''}
              </div>
              ${e.desc ? `<div class="r-item-desc">${nl2br(escHtml(e.desc))}</div>` : ''}
            </div>`).join('')}
        </div>` : ''}
      <div class="r-grid">
        <div>
          ${state.education.length ? `
            <div class="r-section">
              <div class="r-section-title">Education</div>
              ${state.education.map(e => `
                <div class="r-item">
                  <div class="r-item-header">
                    <span class="r-item-title">${escHtml(e.school)}</span>
                    ${(e.from || e.to) ? `<span class="r-item-date">${escHtml([e.from, e.to].filter(Boolean).join('–'))}</span>` : ''}
                  </div>
                  <div class="r-item-sub">${escHtml([e.degree, e.field].filter(Boolean).join(', '))}</div>
                  ${e.desc ? `<div class="r-item-desc">${escHtml(e.desc)}</div>` : ''}
                </div>`).join('')}
            </div>` : ''}
          ${state.certifications.length ? `
            <div class="r-section">
              <div class="r-section-title">Certifications</div>
              ${state.certifications.map(c => `
                <div class="r-item">
                  <div class="r-item-header">
                    <span class="r-item-title">${escHtml(c.name)}</span>
                    ${c.date ? `<span class="r-item-date">${escHtml(c.date)}</span>` : ''}
                  </div>
                  ${c.issuer ? `<div class="r-item-sub">${escHtml(c.issuer)}</div>` : ''}
                </div>`).join('')}
            </div>` : ''}
        </div>
        <div>
          ${state.skills.length ? `
            <div class="r-section">
              <div class="r-section-title">Skills</div>
              <div class="r-skill-list">
                ${state.skills.map(s => `<span class="r-skill-tag">${escHtml(s)}</span>`).join('')}
              </div>
            </div>` : ''}
          ${state.projects.length ? `
            <div class="r-section">
              <div class="r-section-title">Projects</div>
              ${state.projects.map(p => `
                <div class="r-item">
                  <div class="r-item-title">${escHtml(p.name)}</div>
                  ${p.role ? `<div class="r-item-sub">${escHtml(p.role)}</div>` : ''}
                  ${p.desc ? `<div class="r-item-desc">${escHtml(p.desc)}</div>` : ''}
                </div>`).join('')}
            </div>` : ''}
          ${socials.length ? `
            <div class="r-section">
              <div class="r-section-title">Links</div>
              <div class="r-social">
                ${socials.map(s => `<span class="r-social-item">${escHtml(s.label)}</span>`).join('')}
              </div>
            </div>` : ''}
        </div>
      </div>
    </div>`;
}

// ── TEMPLATE: MINIMAL ────────────────────────────────
function renderMinimal(fd, fullName, contacts, socials) {
  const makeItems = (items, renderFn) => items.length
    ? items.map(renderFn).join('')
    : '';

  return `
    <div class="resume-header">
      ${state.photo ? `<img class="header-photo" src="${state.photo}" alt="Profile">` : ''}
      <div class="header-info">
        ${fullName ? `<div class="r-name">${escHtml(fullName)}</div>` : ''}
        ${fd.jobTitle ? `<div class="r-title">${escHtml(fd.jobTitle)}</div>` : ''}
        <div class="r-contacts">
          ${contacts.map(c => `<span>${c}</span>`).join('')}
        </div>
      </div>
    </div>
    <div class="resume-body">
      ${fd.summary ? `
        <div class="r-section">
          <div class="r-section-title">Summary</div>
          <p class="r-summary">${escHtml(fd.summary)}</p>
        </div>` : ''}
      ${state.experience.length ? `
        <div class="r-section">
          <div class="r-section-title">Experience</div>
          ${state.experience.map(e => `
            <div class="r-item">
              <div class="r-item-left">
                <div class="r-item-date">${escHtml(e.from || '')}</div>
                <div class="r-item-date">→ ${escHtml(e.to || 'Present')}</div>
              </div>
              <div class="r-item-right">
                <div class="r-item-title">${escHtml(e.title)}</div>
                ${e.company ? `<div class="r-item-sub">${escHtml(e.company)}</div>` : ''}
                ${e.desc ? `<div class="r-item-desc">${nl2br(escHtml(e.desc))}</div>` : ''}
              </div>
            </div>`).join('')}
        </div>` : ''}
      ${state.education.length ? `
        <div class="r-section">
          <div class="r-section-title">Education</div>
          ${state.education.map(e => `
            <div class="r-item">
              <div class="r-item-left">
                <div class="r-item-date">${escHtml([e.from, e.to].filter(Boolean).join('–'))}</div>
              </div>
              <div class="r-item-right">
                <div class="r-item-title">${escHtml(e.school)}</div>
                <div class="r-item-sub">${escHtml([e.degree, e.field].filter(Boolean).join(', '))}</div>
                ${e.desc ? `<div class="r-item-desc">${escHtml(e.desc)}</div>` : ''}
              </div>
            </div>`).join('')}
        </div>` : ''}
      ${state.skills.length ? `
        <div class="r-section">
          <div class="r-section-title">Skills</div>
          <div class="r-skill-list">
            ${state.skills.map(s => `<span class="r-skill-tag">${escHtml(s)}</span>`).join('')}
          </div>
        </div>` : ''}
      ${state.projects.length ? `
        <div class="r-section">
          <div class="r-section-title">Projects</div>
          ${state.projects.map(p => `
            <div class="r-item">
              <div class="r-item-left">
                ${p.role ? `<div class="r-item-date">${escHtml(p.role)}</div>` : ''}
              </div>
              <div class="r-item-right">
                <div class="r-item-title">${escHtml(p.name)}</div>
                ${p.url ? `<div class="r-item-sub">${escHtml(p.url)}</div>` : ''}
                ${p.desc ? `<div class="r-item-desc">${escHtml(p.desc)}</div>` : ''}
              </div>
            </div>`).join('')}
        </div>` : ''}
      ${state.certifications.length ? `
        <div class="r-section">
          <div class="r-section-title">Certifications</div>
          ${state.certifications.map(c => `
            <div class="r-item">
              <div class="r-item-left">
                <div class="r-item-date">${escHtml(c.date)}</div>
              </div>
              <div class="r-item-right">
                <div class="r-item-title">${escHtml(c.name)}</div>
                ${c.issuer ? `<div class="r-item-sub">${escHtml(c.issuer)}</div>` : ''}
              </div>
            </div>`).join('')}
        </div>` : ''}
      ${socials.length ? `
        <div class="r-section">
          <div class="r-section-title">Links</div>
          <div class="r-social">
            ${socials.map(s => `<span class="r-social-item">${escHtml(s.label)}: ${escHtml(s.url)}</span>`).join('')}
          </div>
        </div>` : ''}
    </div>`;
}

// ══════════════════════════════════════════
// LOCAL STORAGE
// ══════════════════════════════════════════
function saveToStorage() {
  const fd = getFormData();
  const payload = {
    ...fd,
    ...state,
    // override theme/template/zoom from state
  };
  try {
    localStorage.setItem('resumeforge_data', JSON.stringify(payload));
  } catch (e) {
    // Storage full or unavailable
  }
}

function saveResume() {
  saveToStorage();
  showToast('Resume saved locally ✓', 'success');
}

function loadFromStorage() {
  const raw = localStorage.getItem('resumeforge_data');
  if (!raw) return;
  try {
    const data = JSON.parse(raw);
    populateForm(data);
    state.template = data.template || 'classic';
    state.theme = data.theme || 'dark';
    state.zoom = data.zoom || 1.0;
    state.photo = data.photo || null;
    state.skills = data.skills || [];
    state.experience = data.experience || [];
    state.education = data.education || [];
    state.projects = data.projects || [];
    state.certifications = data.certifications || [];

    // Update template UI
    setTemplate(state.template);

    // Render lists
    renderExperienceList();
    renderEducationList();
    renderProjectList();
    renderCertList();
    renderSkillTags();

    // Photo
    if (state.photo) {
      const preview = document.getElementById('photoPreview');
      preview.innerHTML = `<img src="${state.photo}" alt="Profile photo">`;
    }

    // Summary char count
    const summaryEl = document.getElementById('summary');
    if (summaryEl) {
      document.getElementById('summaryCount').textContent = `${summaryEl.value.length} / 400`;
    }
  } catch (e) {
    console.warn('Could not load saved data', e);
  }
}

function populateForm(data) {
  const fields = ['firstName','lastName','jobTitle','email','phone','location',
    'website','summary','linkedin','github','portfolio','twitter'];
  fields.forEach(id => {
    const el = document.getElementById(id);
    if (el && data[id] !== undefined) el.value = data[id];
  });
}

// ══════════════════════════════════════════
// A4 PREVIEW MODAL
// ══════════════════════════════════════════
function openA4Preview() {
  // Clone resume content into the A4 modal container
  const source = document.getElementById('resumePreview');
  const target = document.getElementById('a4ResumeContent');

  // Copy the inner HTML of the live preview
  target.innerHTML = source.innerHTML;

  // Copy the template class so styles apply correctly
  const sheetClass = source.className; // e.g. "resume-sheet tpl-classic"
  target.style.cssText = 'width:100%;height:100%;font-family:"DM Sans",sans-serif;';
  // Apply template classes directly on container
  target.className = sheetClass;
  target.style.width  = '100%';
  target.style.height = '100%';
  target.style.boxShadow = 'none';
  target.style.borderRadius = '0';

  // Show the modal
  const modal = document.getElementById('a4Modal');
  modal.style.display = 'flex';

  // Prevent body scroll
  document.body.style.overflow = 'hidden';
}

function closeA4Preview() {
  document.getElementById('a4Modal').style.display = 'none';
  document.body.style.overflow = '';
}

// Close modal on backdrop click
document.addEventListener('DOMContentLoaded', () => {
  const modal = document.getElementById('a4Modal');
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeA4Preview();
    });
  }
});

// ══════════════════════════════════════════
// PDF DOWNLOAD — uses html2canvas + jsPDF
// ══════════════════════════════════════════
async function downloadPDF() {
  const fd = getFormData();
  const fullName = [fd.firstName, fd.lastName].filter(Boolean).join('_') || 'resume';
  const btn = document.getElementById('downloadBtn');

  // Check resume has content
  const source = document.getElementById('resumePreview');
  if (source.querySelector('.empty-state')) {
    showToast('Please fill in your resume details first', 'error');
    return;
  }

  // Button loading state
  btn.textContent = '⏳ Generating...';
  btn.disabled = true;

  try {
    // ── 1. Build an off-screen A4 render container ──
    const renderEl = document.createElement('div');
    renderEl.style.cssText = `
      position: fixed;
      left: -9999px;
      top: 0;
      width: 794px;
      min-height: 1122px;
      background: white;
      font-family: 'DM Sans', sans-serif;
      overflow: hidden;
      z-index: -1;
    `;
    // Copy resume HTML & template class
    renderEl.innerHTML = source.innerHTML;
    renderEl.className = source.className;
    renderEl.style.position = 'fixed';
    renderEl.style.left = '-9999px';
    renderEl.style.top  = '0';
    renderEl.style.width = '794px';
    renderEl.style.boxShadow = 'none';
    renderEl.style.borderRadius = '0';

    document.body.appendChild(renderEl);

    // ── 2. Wait for fonts/images to load ──
    await new Promise(r => setTimeout(r, 300));

    // ── 3. Render to canvas via html2canvas ──
    const canvas = await html2canvas(renderEl, {
      scale: 2,            // 2× for sharp text
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      width: 794,
      windowWidth: 794,
      logging: false,
    });

    document.body.removeChild(renderEl);

    // ── 4. Create PDF with jsPDF (A4 = 210×297 mm) ──
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageW  = pdf.internal.pageSize.getWidth();   // 210 mm
    const pageH  = pdf.internal.pageSize.getHeight();  // 297 mm
    const ratio  = canvas.width / canvas.height;
    const imgH   = pageW / ratio;

    // If content taller than one page, split across pages
    if (imgH <= pageH) {
      pdf.addImage(canvas.toDataURL('image/jpeg', 0.95), 'JPEG', 0, 0, pageW, imgH);
    } else {
      // Multi-page: slice canvas into page-sized chunks
      const pxPerMm  = canvas.width / pageW;
      const pageHpx  = pageH * pxPerMm;
      let   yOffset  = 0;

      while (yOffset < canvas.height) {
        const sliceH = Math.min(pageHpx, canvas.height - yOffset);
        const sliceCanvas = document.createElement('canvas');
        sliceCanvas.width  = canvas.width;
        sliceCanvas.height = sliceH;
        const ctx = sliceCanvas.getContext('2d');
        ctx.drawImage(canvas, 0, -yOffset, canvas.width, canvas.height);

        if (yOffset > 0) pdf.addPage();
        pdf.addImage(sliceCanvas.toDataURL('image/jpeg', 0.95), 'JPEG',
                     0, 0, pageW, sliceH / pxPerMm);

        yOffset += pageHpx;
      }
    }

    pdf.save(`${fullName}_resume.pdf`);
    showToast('PDF downloaded successfully ✓', 'success');

  } catch (err) {
    console.error('PDF error:', err);
    showToast('PDF generation failed. Try the Preview → Print method.', 'error');
  } finally {
    btn.textContent = '⬇ Download PDF';
    btn.disabled = false;
  }
}

// ══════════════════════════════════════════
// UTILITIES
// ══════════════════════════════════════════
function escHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
function escAttr(str) {
  return escHtml(str).replace(/'/g, '&#39;');
}
function nl2br(str) {
  return str.replace(/\n/g, '<br>');
}

// ── TOAST ─────────────────────────────────────────────
let toastTimer;
function showToast(msg, type = '') {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.className = `toast show ${type}`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.className = 'toast';
  }, 3000);
}
