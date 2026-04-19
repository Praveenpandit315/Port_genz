/* ════════════════════════════════════════════════════════
   portfolio-download.js
   Generates standalone HTML + CSS + JS zip for deployment
   Kept in a separate file so template literals never break
   the HTML parser inside a <script> tag.
════════════════════════════════════════════════════════ */

'use strict';

/* ── Helper: dynamically load a script once ── */
function loadScript(src) {
  return new Promise(function(res, rej) {
    if (document.querySelector('script[src="' + src + '"]')) { res(); return; }
    var s = document.createElement('script');
    s.src = src; s.onload = res; s.onerror = rej;
    document.head.appendChild(s);
  });
}

/* ── Helper: HTML-escape ── */
function esc(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/* ════════════════════════════════════════
   MAIN ENTRY — triggered by button click
════════════════════════════════════════ */
async function downloadPortfolioZip() {
  var btn = document.getElementById('downloadPortfolioBtn');
  var raw = localStorage.getItem('resumeforge_data');
  if (!raw) { alert('No resume data found. Please fill your resume first.'); return; }

  var d        = JSON.parse(raw);
  var fullName = [d.firstName, d.lastName].filter(Boolean).join(' ') || 'My Portfolio';
  var slug     = fullName.toLowerCase().replace(/\s+/g, '_');

  btn.textContent = '⏳ Building...';
  btn.disabled    = true;

  try {
    await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js');

    var zip = new JSZip();
    zip.file('index.html', buildHTML(d, fullName));
    zip.file('style.css',  buildCSS());
    zip.file('script.js',  buildJS(d));
    zip.file('README.md',  buildReadme(fullName));

    var blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
    var url  = URL.createObjectURL(blob);
    var a    = document.createElement('a');
    a.href     = url;
    a.download = slug + '_portfolio.zip';
    a.click();
    URL.revokeObjectURL(url);

    btn.textContent = '✓ Downloaded!';
    setTimeout(function() {
      btn.textContent = '⬇ Download Portfolio';
      btn.disabled    = false;
    }, 2500);

  } catch(err) {
    console.error(err);
    btn.textContent = '⬇ Download Portfolio';
    btn.disabled    = false;
    alert('Something went wrong. Please try again.');
  }
}

/* ════════════════════════════════════════
   FILE 1 — index.html
   All strings use concat, no backticks,
   so no </script> can escape the tag.
════════════════════════════════════════ */
function buildHTML(d, fullName) {
  var skills = d.skills        || [];
  var exp    = d.experience    || [];
  var edu    = d.education     || [];
  var proj   = d.projects      || [];
  var certs  = d.certifications|| [];

  var initials = ([d.firstName && d.firstName[0], d.lastName && d.lastName[0]]
    .filter(Boolean).join('').toUpperCase()) || '?';

  /* Nav links */
  var navSections = ['hero','about']
    .concat(exp.length   ? ['experience']     : [])
    .concat(edu.length   ? ['education']      : [])
    .concat(proj.length  ? ['projects']       : [])
    .concat(certs.length ? ['certifications'] : [])
    .concat(['contact']);

  var navItems = navSections.map(function(id) {
    var label = id.charAt(0).toUpperCase() + id.slice(1);
    return '<li><a href="#' + id + '" class="nav-link">' + label + '</a></li>';
  }).join('\n      ');

  /* Hero photo */
  var photoHTML = d.photo
    ? '<img src="' + esc(d.photo) + '" class="hero-avatar" alt="' + esc(fullName) + '">'
    : '<div class="hero-initials">' + esc(initials) + '</div>';

  /* Stats */
  var statItems = [];
  if (exp.length)   statItems.push('<div class="stat-card"><div class="stat-val">' + exp.length   + '</div><div class="stat-lbl">Roles</div></div>');
  if (proj.length)  statItems.push('<div class="stat-card"><div class="stat-val">' + proj.length  + '</div><div class="stat-lbl">Projects</div></div>');
  if (skills.length)statItems.push('<div class="stat-card"><div class="stat-val">' + skills.length+ '</div><div class="stat-lbl">Skills</div></div>');
  if (certs.length) statItems.push('<div class="stat-card"><div class="stat-val">' + certs.length + '</div><div class="stat-lbl">Certs</div></div>');
  var statsHTML = statItems.length ? '<div class="stats-grid">' + statItems.join('') + '</div>' : '';

  /* Contact chips */
  var chips = [];
  if (d.email)    chips.push('<a href="mailto:' + esc(d.email)  + '" class="chip">\u2709 ' + esc(d.email)  + '</a>');
  if (d.phone)    chips.push('<a href="tel:'    + esc(d.phone)  + '" class="chip">\u260E ' + esc(d.phone)  + '</a>');
  if (d.location) chips.push('<span class="chip">\u25CE ' + esc(d.location) + '</span>');
  if (d.website)  chips.push('<a href="' + esc(d.website) + '" target="_blank" class="chip">\u2301 ' + esc(d.website.replace(/^https?:\/\//, '')) + '</a>');
  var chipsHTML = chips.join('\n          ');

  /* CTA buttons */
  var btns = [];
  if (d.email)    btns.push('<a href="mailto:' + esc(d.email)    + '" class="btn-primary">Hire Me \u2192</a>');
  if (d.linkedin) btns.push('<a href="' + esc(d.linkedin) + '" target="_blank" class="btn-secondary">LinkedIn \u2197</a>');
  if (d.github)   btns.push('<a href="' + esc(d.github)   + '" target="_blank" class="btn-secondary">GitHub \u2197</a>');
  var btnsHTML = btns.join('\n          ');

  /* Skills */
  var skillsHTML = skills.map(function(s) {
    return '<span class="skill-tag">' + esc(s) + '</span>';
  }).join('\n          ');

  /* Info cards (about) */
  var infoCards = '';
  if (d.email)    infoCards += '<div class="info-card"><div class="ic-lbl">\u2709 Email</div><div class="ic-val">'    + esc(d.email)    + '</div></div>';
  if (d.phone)    infoCards += '<div class="info-card"><div class="ic-lbl">\u260E Phone</div><div class="ic-val">'    + esc(d.phone)    + '</div></div>';
  if (d.location) infoCards += '<div class="info-card"><div class="ic-lbl">\u25CE Location</div><div class="ic-val">' + esc(d.location) + '</div></div>';
  if (d.website)  infoCards += '<div class="info-card"><div class="ic-lbl">\u2301 Website</div><div class="ic-val">'  + esc(d.website)  + '</div></div>';

  /* Experience timeline */
  var expHTML = exp.map(function(ex) {
    var date = [ex.from, ex.to].filter(Boolean).join(' \u2013 ');
    return [
      '<div class="timeline-item">',
      '  <div class="tl-dot"></div>',
      '  <div class="tl-card">',
      '    <div class="tl-head">',
      '      <div>',
      '        <div class="tl-title">' + esc(ex.title) + '</div>',
      ex.company ? '        <div class="tl-company">' + esc(ex.company) + '</div>' : '',
      '      </div>',
      date ? '      <span class="tl-date">' + esc(date) + '</span>' : '',
      '    </div>',
      ex.desc ? '    <p class="tl-desc">' + esc(ex.desc).replace(/\n/g, '<br>') + '</p>' : '',
      '  </div>',
      '</div>'
    ].filter(Boolean).join('\n        ');
  }).join('\n        ');

  /* Education */
  var eduHTML = edu.map(function(ed) {
    var deg = [ed.degree, ed.field].filter(Boolean).join(', ');
    var dt  = [ed.from, ed.to].filter(Boolean).join(' \u2013 ');
    return [
      '<div class="edu-card">',
      '  <div class="edu-icon">\U0001F393</div>',
      '  <div>',
      '    <div class="edu-school">' + esc(ed.school) + '</div>',
      deg ? '    <div class="edu-degree">' + esc(deg) + '</div>' : '',
      dt  ? '    <div class="edu-date">'   + esc(dt)  + '</div>' : '',
      ed.desc ? '    <div class="edu-note">' + esc(ed.desc) + '</div>' : '',
      '  </div>',
      '</div>'
    ].filter(Boolean).join('\n        ');
  }).join('\n        ');

  /* Projects */
  var projHTML = proj.map(function(p) {
    return [
      '<div class="proj-card">',
      '  <div class="proj-top">',
      '    <div class="proj-name">' + esc(p.name || 'Project') + '</div>',
      p.url ? '    <a href="' + esc(p.url) + '" target="_blank" class="proj-link">\u2197 View</a>' : '',
      '  </div>',
      p.role ? '  <div class="proj-role">' + esc(p.role) + '</div>' : '',
      p.desc ? '  <p class="proj-desc">' + esc(p.desc) + '</p>' : '',
      p.url  ? '  <div class="proj-url">' + esc(p.url.replace(/^https?:\/\//, '')) + '</div>' : '',
      '</div>'
    ].filter(Boolean).join('\n        ');
  }).join('\n        ');

  /* Certifications */
  var certHTML = certs.map(function(c) {
    return [
      '<div class="cert-card">',
      '  <div class="cert-icon">\U0001F3C6</div>',
      '  <div class="cert-name">' + esc(c.name) + '</div>',
      c.issuer ? '  <div class="cert-issuer">' + esc(c.issuer) + '</div>' : '',
      c.date   ? '  <div class="cert-date">'   + esc(c.date)   + '</div>' : '',
      c.url    ? '  <a href="' + esc(c.url) + '" target="_blank" class="cert-link">View credential \u2197</a>' : '',
      '</div>'
    ].filter(Boolean).join('\n        ');
  }).join('\n        ');

  /* Social buttons */
  var socialDefs = [
    { k:'linkedin', label:'LinkedIn', icon:'\uD83D\uDD17' },
    { k:'github',   label:'GitHub',   icon:'\uD83D\uDC19' },
    { k:'portfolio',label:'Portfolio',icon:'\uD83C\uDF10' },
    { k:'twitter',  label:'Twitter',  icon:'\uD83D\uDC26' },
    { k:'website',  label:'Website',  icon:'\u2301'       }
  ];
  var socialHTML = socialDefs.filter(function(s) { return d[s.k]; }).map(function(s) {
    return '<a href="' + esc(d[s.k]) + '" target="_blank" class="social-btn">' + s.icon + ' ' + s.label + '</a>';
  }).join('\n          ');

  /* Contact cards */
  var ccHTML = '';
  if (d.email)    ccHTML += '<a href="mailto:' + esc(d.email) + '" class="contact-card"><span class="cc-icon">\u2709\uFE0F</span><div><div class="cc-lbl">Email</div><div class="cc-val">' + esc(d.email) + '</div></div></a>';
  if (d.phone)    ccHTML += '<a href="tel:' + esc(d.phone) + '" class="contact-card"><span class="cc-icon">\uD83D\uDCF1</span><div><div class="cc-lbl">Phone</div><div class="cc-val">' + esc(d.phone) + '</div></div></a>';
  if (d.location) ccHTML += '<div class="contact-card"><span class="cc-icon">\uD83D\uDCCD</span><div><div class="cc-lbl">Location</div><div class="cc-val">' + esc(d.location) + '</div></div></div>';

  /* Assemble HTML — use string concat, NEVER backticks in HTML file */
  var year = new Date().getFullYear();

  var html = '<!DOCTYPE html>\n'
    + '<html lang="en">\n'
    + '<head>\n'
    + '  <meta charset="UTF-8"/>\n'
    + '  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>\n'
    + '  <title>' + esc(fullName) + ' \u2014 Portfolio</title>\n'
    + '  <link rel="stylesheet" href="style.css"/>\n'
    + '</head>\n'
    + '<body>\n\n'

    /* NAV */
    + '<!-- NAV -->\n'
    + '<nav class="site-nav" id="siteNav">\n'
    + '  <div class="container nav-inner">\n'
    + '    <a href="#hero" class="nav-logo">\n'
    + '      <div class="nav-hex hex"></div>\n'
    + '      <span class="nav-name">' + esc(fullName) + '</span>\n'
    + '    </a>\n'
    + '    <ul class="nav-links">\n      ' + navItems + '\n    </ul>\n'
    + '  </div>\n'
    + '</nav>\n\n'

    /* HERO */
    + '<!-- HERO -->\n'
    + '<section id="hero">\n'
    + '  <div class="hero-grid-bg"></div>\n'
    + '  <div class="container hero-inner">\n'
    + '    <div class="hero-left">\n'
    + '      <div class="hero-badge"><span class="hero-badge-dot"></span> Available for opportunities</div>\n'
    + '      <h1 class="hero-name">' + esc(fullName) + '</h1>\n'
    + (d.jobTitle ? '      <div class="hero-title">' + esc(d.jobTitle) + '</div>\n' : '')
    + (d.summary  ? '      <p class="hero-summary">' + esc(d.summary)  + '</p>\n'   : '')
    + '      <div class="hero-chips">' + chipsHTML + '</div>\n'
    + '      <div class="hero-btns">'  + btnsHTML  + '</div>\n'
    + '    </div>\n'
    + '    <div class="hero-right">\n'
    + '      ' + photoHTML + '\n'
    + '      ' + statsHTML + '\n'
    + '    </div>\n'
    + '  </div>\n'
    + '</section>\n\n'

    /* ABOUT */
    + '<!-- ABOUT -->\n'
    + '<section id="about" class="section bg-alt">\n'
    + '  <div class="container">\n'
    + '    <div class="two-col">\n'
    + '      <div class="reveal">\n'
    + '        <div class="section-badge"><span class="badge-dot"></span> About Me</div>\n'
    + '        <h2 class="section-title">A little about <em>who I am</em></h2>\n'
    + '        <p class="section-text">' + esc(d.summary || '') + '</p>\n'
    + '        <div class="info-cards">' + infoCards + '</div>\n'
    + '      </div>\n'
    + (skills.length
        ? '      <div class="reveal">\n'
        + '        <div class="section-badge"><span class="badge-dot"></span> Skills &amp; Tools</div>\n'
        + '        <h2 class="section-title">My <em>expertise</em></h2>\n'
        + '        <div class="skills-wrap">' + skillsHTML + '</div>\n'
        + '      </div>\n'
        : '')
    + '    </div>\n'
    + '  </div>\n'
    + '</section>\n\n'

    /* EXPERIENCE */
    + (exp.length
        ? '<!-- EXPERIENCE -->\n'
        + '<section id="experience" class="section">\n'
        + '  <div class="container">\n'
        + '    <div class="section-head reveal">\n'
        + '      <div class="section-badge"><span class="badge-dot"></span> Career</div>\n'
        + '      <h2 class="section-title">Work Experience</h2>\n'
        + '    </div>\n'
        + '    <div class="timeline reveal">\n        ' + expHTML + '\n    </div>\n'
        + '  </div>\n'
        + '</section>\n\n'
        : '')

    /* EDUCATION */
    + (edu.length
        ? '<!-- EDUCATION -->\n'
        + '<section id="education" class="section bg-alt">\n'
        + '  <div class="container">\n'
        + '    <div class="section-head reveal">\n'
        + '      <div class="section-badge"><span class="badge-dot"></span> Education</div>\n'
        + '      <h2 class="section-title">Academic Background</h2>\n'
        + '    </div>\n'
        + '    <div class="edu-grid reveal">\n        ' + eduHTML + '\n    </div>\n'
        + '  </div>\n'
        + '</section>\n\n'
        : '')

    /* PROJECTS */
    + (proj.length
        ? '<!-- PROJECTS -->\n'
        + '<section id="projects" class="section">\n'
        + '  <div class="container">\n'
        + '    <div class="section-head reveal">\n'
        + '      <div class="section-badge"><span class="badge-dot"></span> Work</div>\n'
        + '      <h2 class="section-title">Featured Projects</h2>\n'
        + '    </div>\n'
        + '    <div class="proj-grid reveal">\n        ' + projHTML + '\n    </div>\n'
        + '  </div>\n'
        + '</section>\n\n'
        : '')

    /* CERTIFICATIONS */
    + (certs.length
        ? '<!-- CERTIFICATIONS -->\n'
        + '<section id="certifications" class="section bg-alt">\n'
        + '  <div class="container">\n'
        + '    <div class="section-head reveal">\n'
        + '      <div class="section-badge"><span class="badge-dot"></span> Credentials</div>\n'
        + '      <h2 class="section-title">Certifications</h2>\n'
        + '    </div>\n'
        + '    <div class="cert-grid reveal">\n        ' + certHTML + '\n    </div>\n'
        + '  </div>\n'
        + '</section>\n\n'
        : '')

    /* CONTACT */
    + '<!-- CONTACT -->\n'
    + '<section id="contact" class="section contact-section">\n'
    + '  <div class="container text-center reveal">\n'
    + '    <div class="section-badge" style="justify-content:center"><span class="badge-dot"></span> Get In Touch</div>\n'
    + '    <h2 class="section-title">Let\'s work <em>together</em></h2>\n'
    + '    <p class="section-text" style="max-width:500px;margin:16px auto 36px">\n'
    + '      I\'m ' + esc(d.firstName || 'available') + ' and open to new opportunities.\n'
    + '    </p>\n'
    + '    <div class="contact-cards">' + ccHTML     + '</div>\n'
    + '    <div class="social-links">'  + socialHTML + '</div>\n'
    + '  </div>\n'
    + '</section>\n\n'

    /* FOOTER */
    + '<footer>\n'
    + '  <div class="container footer-inner">\n'
    + '    <div class="footer-logo"><div class="nav-hex hex"></div><span>' + esc(fullName) + '</span></div>\n'
    + '    <p class="footer-copy">&copy; ' + year + ' ' + esc(fullName) + '. Built with PortGen.</p>\n'
    + '  </div>\n'
    + '</footer>\n\n'

    + '<script src="script.js"><\/script>\n'
    + '</body>\n'
    + '</html>';

  return html;
}

/* ════════════════════════════════════════
   FILE 2 — style.css
   Plain string — no template literals needed
════════════════════════════════════════ */
function buildCSS() {
  var lines = [
    "/* Portfolio — Generated by PortGen */",
    "@import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,500;1,9..144,500&family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600&display=swap');",
    "*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}",
    "html{scroll-behavior:smooth}",
    "body{font-family:'DM Sans',sans-serif;background:#09090c;color:#f0ede6;line-height:1.65;overflow-x:hidden}",
    "a{text-decoration:none;color:inherit}",
    "img{display:block;max-width:100%}",
    "em{font-style:italic;color:#c8a96e}",
    "::-webkit-scrollbar{width:5px}",
    "::-webkit-scrollbar-thumb{background:#2e2e3a;border-radius:999px}",
    ":root{--gold:#c8a96e;--gold2:#e2c98a;--ink:#09090c;--ink2:#111116;--ink3:#18181f;--ink4:#22222c;--tx1:#f0ede6;--tx2:#9a9790;--tx3:#5a5854;--ease:cubic-bezier(.4,0,.2,1)}",
    ".container{max-width:1160px;margin:0 auto;padding:0 24px}",
    ".hex{clip-path:polygon(50% 0%,100% 25%,100% 75%,50% 100%,0% 75%,0% 25%)}",
    ".text-center{text-align:center}",
    ".bg-alt{background:var(--ink2)}",
    "/* Reveal */",
    ".reveal{opacity:0;transform:translateY(26px);transition:opacity .7s var(--ease),transform .7s var(--ease)}",
    ".reveal.visible{opacity:1;transform:translateY(0)}",
    "/* NAV */",
    ".site-nav{position:fixed;top:0;left:0;right:0;z-index:100;height:56px;display:flex;align-items:center;background:rgba(9,9,12,.9);border-bottom:1px solid rgba(255,255,255,.06);backdrop-filter:blur(20px);transition:background .3s}",
    ".site-nav.scrolled{background:rgba(9,9,12,.98)}",
    ".nav-inner{display:flex;align-items:center;width:100%}",
    ".nav-logo{display:flex;align-items:center;gap:9px;margin-right:auto}",
    ".nav-hex{width:24px;height:24px;background:var(--gold);flex-shrink:0}",
    ".nav-name{font-family:'Fraunces',serif;font-size:1.05rem;font-weight:500;color:var(--tx1)}",
    ".nav-links{display:flex;list-style:none;gap:2px}",
    ".nav-links a{font-size:.84rem;color:var(--tx2);padding:6px 12px;border-radius:6px;transition:all .2s}",
    ".nav-links a:hover,.nav-links a.active{color:var(--tx1);background:rgba(255,255,255,.05)}",
    ".nav-links a.active{color:var(--gold)}",
    "/* HERO */",
    "#hero{min-height:100vh;display:flex;align-items:center;padding:90px 0 60px;position:relative;overflow:hidden}",
    ".hero-grid-bg{position:absolute;inset:0;pointer-events:none;background-image:linear-gradient(rgba(255,255,255,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.04) 1px,transparent 1px);background-size:60px 60px;mask-image:radial-gradient(ellipse 80% 70% at 50% 50%,black 40%,transparent 100%);-webkit-mask-image:radial-gradient(ellipse 80% 70% at 50% 50%,black 40%,transparent 100%)}",
    ".hero-inner{display:grid;grid-template-columns:3fr 2fr;gap:60px;align-items:center;position:relative;z-index:1}",
    ".hero-badge{display:inline-flex;align-items:center;gap:7px;font-size:.75rem;color:var(--gold);background:rgba(200,169,110,.1);border:1px solid rgba(200,169,110,.2);padding:5px 14px;border-radius:999px;margin-bottom:20px}",
    ".hero-badge-dot{width:6px;height:6px;border-radius:50%;background:var(--gold);animation:pulse 2s ease-in-out infinite}",
    "@keyframes pulse{0%,100%{opacity:.5}50%{opacity:1}}",
    ".hero-name{font-family:'Fraunces',serif;font-size:clamp(2.8rem,5vw,4.4rem);font-weight:500;line-height:1.06;letter-spacing:-.03em;margin-bottom:12px}",
    ".hero-title{font-size:1.1rem;color:var(--gold);font-weight:500;margin-bottom:18px}",
    ".hero-summary{font-size:1rem;color:var(--tx2);line-height:1.75;max-width:500px;margin-bottom:24px}",
    ".hero-chips{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:26px}",
    ".chip{display:inline-flex;align-items:center;gap:6px;font-size:.78rem;color:var(--tx2);background:#18181f;border:1px solid rgba(255,255,255,.07);padding:5px 13px;border-radius:999px;transition:all .2s}",
    ".chip:hover{border-color:rgba(200,169,110,.3);color:var(--gold)}",
    ".hero-btns{display:flex;gap:12px;flex-wrap:wrap}",
    ".btn-primary{display:inline-flex;align-items:center;gap:7px;background:var(--gold);color:#1a0f00;font-family:'DM Sans',sans-serif;font-size:.95rem;font-weight:600;padding:12px 28px;border-radius:12px;border:none;cursor:pointer;transition:all .2s}",
    ".btn-primary:hover{background:var(--gold2);transform:translateY(-2px);box-shadow:0 8px 28px rgba(200,169,110,.25)}",
    ".btn-secondary{display:inline-flex;align-items:center;gap:7px;background:transparent;color:var(--tx2);font-family:'DM Sans',sans-serif;font-size:.95rem;padding:11px 22px;border-radius:12px;border:1px solid rgba(255,255,255,.1);cursor:pointer;transition:all .2s}",
    ".btn-secondary:hover{border-color:var(--gold);color:var(--gold);background:rgba(200,169,110,.08)}",
    ".hero-right{display:flex;flex-direction:column;align-items:center;gap:20px}",
    ".hero-avatar{width:220px;height:220px;border-radius:50%;object-fit:cover;box-shadow:0 0 0 3px rgba(200,169,110,.3),0 0 0 6px rgba(200,169,110,.1)}",
    ".hero-initials{width:220px;height:220px;border-radius:50%;background:linear-gradient(135deg,rgba(200,169,110,.2),rgba(200,169,110,.06));border:2px solid rgba(200,169,110,.3);display:flex;align-items:center;justify-content:center;font-family:'Fraunces',serif;font-size:4rem;font-weight:500;color:var(--gold);box-shadow:0 0 0 3px rgba(200,169,110,.15),0 0 0 6px rgba(200,169,110,.07)}",
    ".stats-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;width:100%;max-width:240px}",
    ".stat-card{background:var(--ink3);border:1px solid rgba(255,255,255,.07);border-radius:14px;padding:14px;text-align:center}",
    ".stat-val{font-family:'Fraunces',serif;font-size:1.8rem;font-weight:500;color:var(--gold)}",
    ".stat-lbl{font-size:.7rem;color:var(--tx3);margin-top:2px}",
    "/* SECTIONS */",
    ".section{padding:88px 0}",
    ".section-head{text-align:center;margin-bottom:52px}",
    ".section-badge{display:inline-flex;align-items:center;gap:7px;font-size:.72rem;color:var(--gold);background:rgba(200,169,110,.1);border:1px solid rgba(200,169,110,.2);padding:4px 13px;border-radius:999px;margin-bottom:14px}",
    ".badge-dot{width:5px;height:5px;border-radius:50%;background:var(--gold)}",
    ".section-title{font-family:'Fraunces',serif;font-size:clamp(1.8rem,3vw,2.6rem);font-weight:500;letter-spacing:-.03em;line-height:1.15}",
    ".section-text{font-size:.95rem;color:var(--tx2);line-height:1.8;margin-bottom:20px}",
    "/* ABOUT */",
    ".two-col{display:grid;grid-template-columns:1fr 1fr;gap:60px;align-items:start}",
    ".info-cards{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:20px}",
    ".info-card{background:var(--ink3);border:1px solid rgba(255,255,255,.07);border-radius:12px;padding:14px}",
    ".ic-lbl{font-size:.65rem;text-transform:uppercase;letter-spacing:.08em;color:var(--tx3);margin-bottom:4px}",
    ".ic-val{font-size:.85rem;color:var(--tx1);word-break:break-all}",
    ".skills-wrap{display:flex;flex-wrap:wrap;gap:9px;margin-top:8px}",
    ".skill-tag{display:inline-flex;align-items:center;font-size:.85rem;font-weight:500;color:var(--tx1);background:var(--ink3);border:1px solid rgba(255,255,255,.07);padding:6px 16px;border-radius:999px;transition:all .2s;cursor:default}",
    ".skill-tag:hover{border-color:rgba(200,169,110,.4);color:var(--gold);background:rgba(200,169,110,.08)}",
    "/* TIMELINE */",
    ".timeline{position:relative;padding-left:44px;display:flex;flex-direction:column;gap:28px;max-width:760px;margin:0 auto}",
    ".timeline::before{content:'';position:absolute;left:20px;top:0;bottom:0;width:1px;background:linear-gradient(to bottom,transparent,rgba(200,169,110,.3),transparent)}",
    ".timeline-item{position:relative}",
    ".tl-dot{position:absolute;left:-44px;top:20px;width:16px;height:16px;border-radius:50%;background:var(--ink);border:2px solid var(--gold);display:flex;align-items:center;justify-content:center}",
    ".tl-dot::after{content:'';width:5px;height:5px;border-radius:50%;background:var(--gold)}",
    ".tl-card{background:var(--ink3);border:1px solid rgba(255,255,255,.07);border-radius:18px;padding:22px 24px;transition:border-color .3s}",
    ".tl-card:hover{border-color:rgba(200,169,110,.2)}",
    ".tl-head{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:10px;flex-wrap:wrap}",
    ".tl-title{font-weight:600;font-size:.95rem;color:var(--tx1)}",
    ".tl-company{font-size:.84rem;color:var(--gold);margin-top:2px}",
    ".tl-date{font-size:.74rem;color:var(--tx3);background:var(--ink4);padding:3px 10px;border-radius:999px;white-space:nowrap;border:1px solid rgba(255,255,255,.06)}",
    ".tl-desc{font-size:.84rem;color:var(--tx2);line-height:1.65}",
    "/* EDUCATION */",
    ".edu-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:18px;max-width:900px;margin:0 auto}",
    ".edu-card{background:var(--ink3);border:1px solid rgba(255,255,255,.07);border-radius:18px;padding:22px;display:flex;gap:14px;transition:border-color .3s}",
    ".edu-card:hover{border-color:rgba(200,169,110,.2)}",
    ".edu-icon{width:42px;height:42px;background:rgba(200,169,110,.1);border:1px solid rgba(200,169,110,.2);border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:1.2rem;flex-shrink:0}",
    ".edu-school{font-weight:600;font-size:.92rem;color:var(--tx1);margin-bottom:3px}",
    ".edu-degree{font-size:.82rem;color:var(--gold);margin-bottom:3px}",
    ".edu-date,.edu-note{font-size:.78rem;color:var(--tx3)}",
    "/* PROJECTS */",
    ".proj-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:18px}",
    ".proj-card{background:var(--ink3);border:1px solid rgba(255,255,255,.07);border-radius:18px;overflow:hidden;transition:all .3s;display:flex;flex-direction:column}",
    ".proj-card:hover{border-color:rgba(200,169,110,.35);transform:translateY(-4px);box-shadow:0 16px 48px rgba(0,0,0,.4)}",
    ".proj-card::before{content:'';height:3px;background:linear-gradient(90deg,var(--gold),transparent)}",
    ".proj-top{display:flex;justify-content:space-between;align-items:flex-start;padding:20px 20px 0;margin-bottom:6px}",
    ".proj-name{font-weight:600;font-size:.92rem;color:var(--tx1)}",
    ".proj-link{font-size:.78rem;color:var(--gold);transition:color .2s}",
    ".proj-link:hover{color:var(--gold2)}",
    ".proj-role{font-size:.78rem;color:var(--gold);padding:0 20px;margin-bottom:8px}",
    ".proj-desc{font-size:.82rem;color:var(--tx2);line-height:1.65;padding:0 20px;flex:1}",
    ".proj-url{font-size:.74rem;color:var(--tx3);padding:14px 20px;border-top:1px solid rgba(255,255,255,.05);margin-top:12px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
    "/* CERTIFICATIONS */",
    ".cert-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:18px;max-width:900px;margin:0 auto}",
    ".cert-card{background:var(--ink3);border:1px solid rgba(255,255,255,.07);border-radius:18px;padding:22px;transition:border-color .3s}",
    ".cert-card:hover{border-color:rgba(200,169,110,.2)}",
    ".cert-icon{font-size:1.5rem;margin-bottom:12px}",
    ".cert-name{font-weight:600;font-size:.9rem;color:var(--tx1);margin-bottom:4px}",
    ".cert-issuer{font-size:.8rem;color:var(--gold);margin-bottom:3px}",
    ".cert-date{font-size:.76rem;color:var(--tx3)}",
    ".cert-link{display:inline-block;margin-top:10px;font-size:.78rem;color:var(--tx3);transition:color .2s}",
    ".cert-link:hover{color:var(--gold)}",
    "/* CONTACT */",
    ".contact-section{position:relative;overflow:hidden}",
    ".contact-section::before{content:'';position:absolute;inset:0;pointer-events:none;background:radial-gradient(ellipse 60% 80% at 50% 50%,rgba(200,169,110,.06) 0%,transparent 70%)}",
    ".contact-cards{display:flex;flex-wrap:wrap;justify-content:center;gap:14px;margin-bottom:24px}",
    ".contact-card{display:flex;align-items:center;gap:12px;background:var(--ink3);border:1px solid rgba(255,255,255,.07);border-radius:18px;padding:16px 22px;transition:all .3s}",
    ".contact-card:hover{border-color:rgba(200,169,110,.35);transform:translateY(-3px);background:rgba(200,169,110,.05)}",
    ".cc-icon{font-size:1.5rem}",
    ".cc-lbl{font-size:.7rem;color:var(--tx3);margin-bottom:2px}",
    ".cc-val{font-size:.88rem;color:var(--tx1)}",
    ".social-links{display:flex;flex-wrap:wrap;justify-content:center;gap:10px}",
    ".social-btn{display:inline-flex;align-items:center;gap:7px;font-size:.85rem;color:var(--tx2);background:var(--ink3);border:1px solid rgba(255,255,255,.07);padding:8px 18px;border-radius:999px;transition:all .2s}",
    ".social-btn:hover{border-color:rgba(200,169,110,.35);color:var(--gold);background:rgba(200,169,110,.08)}",
    "/* FOOTER */",
    "footer{background:var(--ink2);border-top:1px solid rgba(255,255,255,.07);padding:28px 0}",
    ".footer-inner{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px}",
    ".footer-logo{display:flex;align-items:center;gap:8px;font-family:'Fraunces',serif;font-size:1rem;font-weight:500;color:var(--tx1)}",
    ".footer-copy{font-size:.78rem;color:var(--tx3)}",
    "/* RESPONSIVE */",
    "@media(max-width:900px){.hero-inner,.two-col{grid-template-columns:1fr;gap:36px}.hero-right{display:none}.nav-links{display:none}}",
    "@media(max-width:600px){.info-cards{grid-template-columns:1fr}.edu-grid,.proj-grid,.cert-grid{grid-template-columns:1fr}}"
  ];
  return lines.join('\n');
}

/* ════════════════════════════════════════
   FILE 3 — script.js
════════════════════════════════════════ */
function buildJS(d) {
  var sections = ['hero','about']
    .concat((d.experience    || []).length ? ['experience']     : [])
    .concat((d.education     || []).length ? ['education']      : [])
    .concat((d.projects      || []).length ? ['projects']       : [])
    .concat((d.certifications|| []).length ? ['certifications'] : [])
    .concat(['contact']);

  var lines = [
    "/* Portfolio Script — Generated by PortGen */",
    "'use strict';",
    "var nav = document.getElementById('siteNav');",
    "window.addEventListener('scroll', function() {",
    "  nav.classList.toggle('scrolled', window.scrollY > 40);",
    "  highlightNav();",
    "});",
    "var sections = " + JSON.stringify(sections) + ";",
    "function highlightNav() {",
    "  var current = '';",
    "  sections.forEach(function(id) {",
    "    var el = document.getElementById(id);",
    "    if (el && window.scrollY >= el.offsetTop - 80) current = id;",
    "  });",
    "  document.querySelectorAll('.nav-links a').forEach(function(a) {",
    "    var id = a.getAttribute('href').replace('#','');",
    "    a.classList.toggle('active', id === current);",
    "  });",
    "}",
    "var obs = new IntersectionObserver(function(entries) {",
    "  entries.forEach(function(e) {",
    "    if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); }",
    "  });",
    "}, { threshold: 0.1 });",
    "document.querySelectorAll('.reveal').forEach(function(el) { obs.observe(el); });",
    "document.querySelectorAll('a[href^=\"#\"]').forEach(function(a) {",
    "  a.addEventListener('click', function(e) {",
    "    var t = document.querySelector(a.getAttribute('href'));",
    "    if (t) { e.preventDefault(); t.scrollIntoView({ behavior: 'smooth' }); }",
    "  });",
    "});"
  ];
  return lines.join('\n');
}

/* ════════════════════════════════════════
   FILE 4 — README.md
════════════════════════════════════════ */
function buildReadme(fullName) {
  return [
    "# " + fullName + " — Portfolio Website",
    "",
    "Generated with **PortGen**.",
    "",
    "## Deploy in 30 seconds",
    "",
    "### Netlify (easiest)",
    "1. Go to https://app.netlify.com/drop",
    "2. Drag this entire folder onto the page — done!",
    "",
    "### GitHub Pages",
    "1. Create a new repo, upload all 3 files",
    "2. Settings > Pages > set source to main branch",
    "",
    "### Vercel",
    "1. https://vercel.com/new > drag & drop folder",
    "",
    "## Files",
    "```",
    "index.html   Main HTML",
    "style.css    All styles",
    "script.js    Animations & nav",
    "README.md    This file",
    "```"
  ].join('\n');
}