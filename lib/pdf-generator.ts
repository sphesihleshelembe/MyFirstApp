import { CV } from './supabase';
import { CVTemplate } from './templates';

export function generatePDFHtml(cv: CV, template: CVTemplate): string {
  const layout = template.layout || 'single';
  const style = template.style;
  const [c1, c2] = template.gradient;

  // Shared data
  const hasSummary = !!(cv.summary && cv.summary.trim());
  const hasSkills = (cv.skills || []).length > 0;
  const hasEducation = (cv.education || []).length > 0;
  const hasExperience = (cv.work_experience || []).length > 0;
  const hasReferences = (cv.references_data || []).length > 0;

  const educationHtml = (cv.education || [])
    .map(
      (edu) => `
      <div class="edu-item">
        <div class="item-top">
          <span class="item-title">${edu.institution || ''}</span>
          <span class="item-date">${edu.start_year || ''}${edu.end_year ? ' – ' + edu.end_year : ' – Present'}</span>
        </div>
        <div class="item-sub">${edu.degree || ''}${edu.field ? ' in ' + edu.field : ''}</div>
        ${edu.description ? `<div class="item-desc">${edu.description}</div>` : ''}
      </div>`
    )
    .join('');

  const experienceHtml = (cv.work_experience || [])
    .map(
      (exp) => `
      <div class="exp-item">
        <div class="item-top">
          <span class="item-title">${exp.position || exp.company || ''}</span>
          <span class="item-date">${exp.start_date || ''} – ${exp.current ? 'Present' : exp.end_date || ''}</span>
        </div>
        ${exp.company && exp.position ? `<div class="item-sub">${exp.company}</div>` : ''}
        ${
          exp.description
            ? `<div class="item-desc">${(exp.description || '')
                .split('\n')
                .filter((l: string) => l.trim())
                .map((l: string) => `<span class="bullet-line">• ${l}</span>`)
                .join('')}</div>`
            : ''
        }
      </div>`
    )
    .join('');

  const referencesHtml = (cv.references_data || [])
    .map(
      (ref) => `
      <div class="ref-item">
        <span class="ref-name">${ref.name || ''}</span>
        <span class="ref-detail">${[ref.position, ref.company].filter(Boolean).join(' at ')}</span>
        <span class="ref-contact">${[ref.email, ref.phone].filter(Boolean).join(' | ')}</span>
      </div>`
    )
    .join('');

  const skillsHtml = `<div class="skills-wrap">${(cv.skills || [])
    .map((s) => `<span class="skill-tag">${s}</span>`)
    .join('')}</div>`;

  // Build complete HTML based on template style and layout
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8"/>
<title>${cv.title || 'CV'}</title>
<style>
${getBaseCSS(c1, c2, style, layout)}
${getHeaderCSS(c1, c2, style)}
${getLayoutCSS(layout)}
${getSectionCSS(style, c1, c2)}
${getComponentCSS(style, c1, c2)}
@media print {
  body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .cv-page { box-shadow: none; }
}
</style>
</head>
<body>
<div class="cv-page">
${buildHeader(cv, style, c1, c2)}
${buildBody(cv, layout, style, c1, c2, {
  hasSummary, hasSkills, hasEducation, hasExperience, hasReferences,
  summaryHtml: cv.summary || '',
  skillsHtml,
  educationHtml,
  experienceHtml,
  referencesHtml,
})}
</div>
</body>
</html>`;
}

/* ── Base Reset & Typography ── */

function getBaseCSS(c1: string, c2: string, style: string, layout: string): string {
  return `
  *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', Arial, Helvetica, sans-serif; color: #1a1a1a; background: #e5e5e5; }
  .cv-page {
    width: 210mm; min-height: 297mm; margin: 0 auto; background: white;
    box-shadow: 0 2px 20px rgba(0,0,0,0.08); overflow: hidden;
  }
  .section { margin-bottom: 22px; }
  .section-label {
    font-size: 11px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase;
    padding-bottom: 8px; margin-bottom: 14px;
  }
  .summary-text { font-size: 12.5px; line-height: 1.7; color: #444; }
  .item-top { display: flex; justify-content: space-between; align-items: baseline; gap: 8px; }
  .item-title { font-size: 13px; font-weight: 700; }
  .item-date { font-size: 11px; color: #777; white-space: nowrap; }
  .item-sub { font-size: 12px; color: #555; margin: 2px 0 6px; font-style: italic; }
  .item-desc { font-size: 11.5px; color: #555; line-height: 1.65; margin-top: 4px; }
  .bullet-line { display: block; }
  .edu-item, .exp-item { margin-bottom: 16px; page-break-inside: avoid; }
  .ref-item { margin-bottom: 10px; page-break-inside: avoid; }
  .ref-name { font-weight: 700; font-size: 12.5px; display: block; }
  .ref-detail { font-size: 11.5px; color: #555; display: block; }
  .ref-contact { font-size: 10.5px; color: #888; display: block; margin-top: 2px; }
  .skills-wrap { display: flex; flex-wrap: wrap; gap: 6px; }`;
}

/* ── Header Styles per Template ── */

function getHeaderCSS(c1: string, c2: string, style: string): string {
  switch (style) {
    case 'modern':
      return `
      .cv-header {
        background: linear-gradient(135deg, ${c1}, ${c2}); color: white;
        padding: 36px 40px 28px; position: relative; overflow: hidden;
      }
      .cv-header::after {
        content: ''; position: absolute; top: -40px; right: -40px;
        width: 180px; height: 180px; border-radius: 50%;
        background: rgba(255,255,255,0.06);
      }
      .header-name { font-size: 30px; font-weight: 800; letter-spacing: 0.5px; margin-bottom: 6px; }
      .header-title-line {
        font-size: 11px; letter-spacing: 3px; text-transform: uppercase;
        opacity: 0.75; margin-bottom: 14px;
      }
      .header-contacts { display: flex; flex-wrap: wrap; gap: 16px; font-size: 12px; opacity: 0.9; }
      .header-contacts span { display: flex; align-items: center; gap: 5px; }`;

    case 'minimal':
      return `
      .cv-header { padding: 40px 44px 24px; border-bottom: 1.5px solid #e5e5e5; }
      .header-name { font-size: 28px; font-weight: 300; letter-spacing: 2px; color: #1a1a1a; }
      .header-title-line { display: none; }
      .header-contacts {
        display: flex; flex-wrap: wrap; gap: 14px; font-size: 11.5px; color: #777; margin-top: 8px;
      }`;

    case 'executive':
      return `
      .cv-header {
        background: linear-gradient(to right, ${c1}, ${c2}); color: white;
        padding: 32px 40px 24px; display: flex; justify-content: space-between; align-items: center;
      }
      .header-name { font-size: 26px; font-weight: 700; letter-spacing: 1px; }
      .header-title-line { font-size: 10px; letter-spacing: 3px; text-transform: uppercase; opacity: 0.7; margin-top: 4px; }
      .header-right { text-align: right; }
      .header-contacts { display: flex; flex-wrap: wrap; gap: 10px 16px; font-size: 11px; justify-content: flex-end; }
      .header-contacts span { opacity: 0.9; }`;

    case 'creative':
      return `
      .cv-header {
        background: linear-gradient(135deg, ${c1}, ${c2}); color: white;
        padding: 40px 40px 32px; position: relative;
      }
      .cv-header::before {
        content: ''; position: absolute; bottom: 0; left: 40px; right: 40px; height: 3px;
        background: rgba(255,255,255,0.3); border-radius: 2px;
      }
      .header-name { font-size: 32px; font-weight: 800; letter-spacing: 1px; }
      .header-title-line { font-size: 11px; letter-spacing: 3px; text-transform: uppercase; opacity: 0.7; margin-top: 4px; margin-bottom: 16px; }
      .header-contacts { display: flex; flex-wrap: wrap; gap: 16px; font-size: 12px; opacity: 0.9; }`;

    case 'professional':
      return `
      .cv-header {
        background: ${c1}; color: white;
        padding: 28px 40px; display: flex; align-items: center; gap: 24px;
      }
      .header-initials {
        width: 56px; height: 56px; border-radius: 50%; border: 2px solid rgba(255,255,255,0.3);
        display: flex; align-items: center; justify-content: center;
        font-size: 22px; font-weight: 700; flex-shrink: 0;
      }
      .header-name { font-size: 24px; font-weight: 700; letter-spacing: 0.5px; }
      .header-title-line { font-size: 10px; letter-spacing: 2.5px; text-transform: uppercase; opacity: 0.7; margin-top: 3px; }
      .header-contacts { display: flex; flex-wrap: wrap; gap: 14px; font-size: 11.5px; opacity: 0.9; margin-top: 8px; }`;

    case 'tech':
      return `
      .cv-header {
        background: #0f172a; color: #e2e8f0;
        padding: 28px 40px; border-bottom: 3px solid ${c1};
        display: flex; justify-content: space-between; align-items: flex-start;
      }
      .header-name { font-size: 24px; font-weight: 700; font-family: 'Courier New', monospace; letter-spacing: 1px; }
      .header-name::before { content: '> '; color: ${c1}; }
      .header-title-line { display: none; }
      .header-contacts { display: flex; flex-direction: column; gap: 4px; font-size: 11px; font-family: 'Courier New', monospace; text-align: right; }
      .header-contacts span::before { content: '// '; color: ${c1}; }`;

    case 'elegant':
      return `
      .cv-header {
        padding: 40px 44px 20px; text-align: center;
        border-bottom: 2px solid ${c1};
      }
      .header-name { font-size: 28px; font-weight: 300; letter-spacing: 6px; text-transform: uppercase; color: #1a1a1a; }
      .header-title-line { display: none; }
      .header-contacts {
        display: flex; justify-content: center; flex-wrap: wrap; gap: 8px 20px;
        font-size: 11.5px; color: #777; margin-top: 12px; letter-spacing: 0.5px;
      }
      .header-contacts span::before { content: ''; display: none; }
      .header-divider {
        width: 40px; height: 2px; background: ${c1}; margin: 14px auto 0;
      }`;

    default: // classic
      return `
      .cv-header {
        padding: 32px 40px 24px; text-align: center;
        border-bottom: 2px solid ${c1};
      }
      .header-title-line {
        font-size: 10px; letter-spacing: 3px; text-transform: uppercase;
        color: ${c1}; margin-bottom: 8px;
      }
      .header-name { font-size: 28px; font-weight: 700; color: #1a1a1a; }
      .header-contacts { display: flex; justify-content: center; flex-wrap: wrap; gap: 6px 16px; font-size: 12px; color: #555; margin-top: 10px; }`;
  }
}

/* ── Layout CSS ── */

function getLayoutCSS(layout: string): string {
  if (layout === 'sidebar') {
    return `
    .cv-body { display: flex; min-height: 240mm; }
    .sidebar { width: 32%; background: #f7f8fa; padding: 28px 22px; }
    .main-col { width: 68%; padding: 28px 32px; }`;
  }
  if (layout === 'two-column') {
    return `
    .cv-body { display: flex; gap: 0; min-height: 240mm; }
    .col-left { width: 50%; padding: 28px 24px 28px 40px; }
    .col-right { width: 50%; padding: 28px 40px 28px 24px; border-left: 1px solid #eee; }`;
  }
  // single
  return `.cv-body { padding: 28px 40px 40px; }`;
}

/* ── Section Styles per Template ── */

function getSectionCSS(style: string, c1: string, c2: string): string {
  switch (style) {
    case 'modern':
      return `
      .section-label { color: ${c1}; border-bottom: 2px solid ${c1}; }
      .sidebar .section-label { color: ${c1}; border-bottom: 1px solid ${c1}; }`;

    case 'minimal':
      return `
      .section-label { color: #333; border-bottom: 1.5px solid #ddd; }`;

    case 'executive':
      return `
      .section-label { color: ${c1}; border-bottom: 2px solid ${c1}; padding-left: 12px; border-left: 4px solid ${c1}; }
      .sidebar .section-label { color: ${c1}; border-bottom: 1px solid ${c1}; border-left: none; padding-left: 0; }`;

    case 'creative':
      return `
      .section-label { color: ${c1}; border-bottom: none; background: linear-gradient(to right, rgba(${hexToRgb(c1)},0.1), transparent); padding: 6px 12px; border-radius: 4px; }
      .sidebar .section-label { color: ${c1}; background: none; padding: 6px 0; border-bottom: 2px solid ${c1}; }`;

    case 'professional':
      return `
      .section-label { color: ${c1}; border-bottom: 2px solid ${c1}; }`;

    case 'tech':
      return `
      .section-label { color: ${c1}; border-bottom: none; font-family: 'Courier New', monospace; }
      .section-label::before { content: '# '; opacity: 0.6; }
      .main-col .section-label::before { content: '## '; }`;

    case 'elegant':
      return `
      .section-label { color: #333; border-bottom: 1px solid #e5e5e5; letter-spacing: 3px; font-size: 10px; }
      .section-label::after { content: ''; display: block; width: 24px; height: 2px; background: ${c1}; margin-top: 6px; }`;

    default: // classic
      return `.section-label { color: ${c1}; border-bottom: 1.5px solid ${c1}; }`;
  }
}

/* ── Component Styles ── */

function getComponentCSS(style: string, c1: string, c2: string): string {
  let skillCSS = `
  .skill-tag {
    display: inline-block; padding: 5px 12px; border-radius: 4px;
    font-size: 11px; font-weight: 600;
  }`;

  switch (style) {
    case 'modern':
      skillCSS += `.skill-tag { background: rgba(${hexToRgb(c1)},0.1); color: ${darken(c1)}; border: 1px solid rgba(${hexToRgb(c1)},0.2); border-radius: 20px; }`;
      break;
    case 'minimal':
      skillCSS += `.skill-tag { background: #f5f5f5; color: #333; border-radius: 3px; }`;
      break;
    case 'executive':
      skillCSS += `.skill-tag { background: rgba(${hexToRgb(c1)},0.08); color: ${darken(c1)}; border-radius: 3px; border-left: 3px solid ${c1}; }`;
      break;
    case 'creative':
      skillCSS += `.skill-tag { background: linear-gradient(135deg, ${c1}, ${c2}); color: white; border-radius: 20px; }`;
      break;
    case 'professional':
      skillCSS += `.skill-tag { background: ${c1}; color: white; border-radius: 3px; }`;
      break;
    case 'tech':
      skillCSS += `.skill-tag { background: #1e293b; color: #e2e8f0; border: 1px solid ${c1}; border-radius: 3px; font-family: 'Courier New', monospace; font-size: 10.5px; }`;
      break;
    case 'elegant':
      skillCSS += `.skill-tag { background: none; color: #333; border: 1px solid #ccc; border-radius: 0; font-size: 10.5px; letter-spacing: 0.5px; }`;
      break;
    default:
      skillCSS += `.skill-tag { background: ${c1}; color: white; border-radius: 20px; }`;
  }

  let cardCSS = '';
  if (style === 'creative') {
    cardCSS = `.exp-item, .edu-item { background: #fafafa; padding: 12px 14px; border-radius: 8px; margin-bottom: 12px; border-left: 3px solid ${c1}; }`;
  } else if (style === 'tech') {
    cardCSS = `.exp-item, .edu-item { border-left: 2px solid ${c1}; padding-left: 12px; margin-bottom: 14px; }`;
  }

  return skillCSS + cardCSS;
}

/* ── Build Header ── */

function buildHeader(cv: CV, style: string, c1: string, c2: string): string {
  const contacts = [
    cv.email,
    cv.phone,
    cv.address,
  ].filter(Boolean);

  const contactsHtml = contacts.map(c => `<span>${c}</span>`).join('');

  if (style === 'professional') {
    const initials = (cv.full_name || '??').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
    return `<div class="cv-header">
      <div class="header-initials">${initials}</div>
      <div>
        <div class="header-name">${cv.full_name || 'Your Name'}</div>
        <div class="header-title-line">Curriculum Vitae</div>
        <div class="header-contacts">${contactsHtml}</div>
      </div>
    </div>`;
  }

  if (style === 'tech') {
    return `<div class="cv-header">
      <div>
        <div class="header-name">${cv.full_name || 'Your Name'}</div>
      </div>
      <div class="header-contacts">
        ${contacts.map(c => `<span>${c}</span>`).join('')}
      </div>
    </div>`;
  }

  if (style === 'elegant') {
    return `<div class="cv-header">
      <div class="header-title-line">CURRICULUM VITAE</div>
      <div class="header-name">${cv.full_name || 'Your Name'}</div>
      <div class="header-contacts">${contactsHtml}</div>
      <div class="header-divider"></div>
    </div>`;
  }

  if (style === 'executive') {
    return `<div class="cv-header">
      <div>
        <div class="header-name">${cv.full_name || 'Your Name'}</div>
        <div class="header-title-line">Curriculum Vitae</div>
      </div>
      <div class="header-right">
        <div class="header-contacts">
          ${contactsHtml}
        </div>
      </div>
    </div>`;
  }

  // modern, minimal, creative, classic
  const titleLine = style === 'modern' || style === 'creative'
    ? `<div class="header-title-line">Curriculum Vitae</div>`
    : style === 'minimal'
      ? ''
      : `<div class="header-title-line">Curriculum Vitae</div>`;

  return `<div class="cv-header">
    ${titleLine}
    <div class="header-name">${cv.full_name || 'Your Name'}</div>
    <div class="header-contacts">${contactsHtml}</div>
  </div>`;
}

/* ── Build Body ── */

function buildBody(
  cv: CV,
  layout: string,
  style: string,
  c1: string,
  c2: string,
  data: {
    hasSummary: boolean; hasSkills: boolean; hasEducation: boolean;
    hasExperience: boolean; hasReferences: boolean;
    summaryHtml: string; skillsHtml: string;
    educationHtml: string; experienceHtml: string; referencesHtml: string;
  }
): string {
  const summarySection = data.hasSummary
    ? `<div class="section"><div class="section-label">Professional Summary</div><div class="summary-text">${data.summaryHtml}</div></div>`
    : '';

  const skillsSection = data.hasSkills
    ? `<div class="section"><div class="section-label">Skills</div>${data.skillsHtml}</div>`
    : '';

  const experienceSection = data.hasExperience
    ? `<div class="section"><div class="section-label">Experience</div>${data.experienceHtml}</div>`
    : '';

  const educationSection = data.hasEducation
    ? `<div class="section"><div class="section-label">Education</div>${data.educationHtml}</div>`
    : '';

  const referencesSection = data.hasReferences
    ? `<div class="section"><div class="section-label">References</div>${data.referencesHtml}</div>`
    : '';

  if (layout === 'sidebar') {
    const sidebarBg = style === 'tech' ? 'background: #0f172a; color: #cbd5e1;' : '';
    return `<div class="cv-body">
      <div class="sidebar" style="${sidebarBg}">
        ${summarySection}
        ${skillsSection}
        ${educationSection}
      </div>
      <div class="main-col">
        ${experienceSection}
        ${referencesSection}
      </div>
    </div>`;
  }

  if (layout === 'two-column') {
    return `<div class="cv-body">
      <div class="col-left">
        ${summarySection}
        ${experienceSection}
      </div>
      <div class="col-right">
        ${skillsSection}
        ${educationSection}
        ${referencesSection}
      </div>
    </div>`;
  }

  // single-column
  return `<div class="cv-body">
    ${summarySection}
    ${skillsSection}
    ${experienceSection}
    ${educationSection}
    ${referencesSection}
  </div>`;
}

/* ── Helpers ── */

function hexToRgb(hex: string): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `${r},${g},${b}`;
}

function darken(hex: string): string {
  const h = hex.replace('#', '');
  const r = Math.max(0, parseInt(h.substring(0, 2), 16) - 40);
  const g = Math.max(0, parseInt(h.substring(2, 4), 16) - 40);
  const b = Math.max(0, parseInt(h.substring(4, 6), 16) - 40);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

/* ── PDF Download ── */

export async function triggerPDFDownload(
  html: string,
  filename = 'cv.pdf'
) {
  if (typeof window === 'undefined') return;

  const html2pdf = (await import('html2pdf.js')).default;

  const container = document.createElement('div');
  container.innerHTML = html;
  container.style.width = '210mm';
  container.style.background = 'white';

  await html2pdf()
    .from(container)
    .set({
      filename,
      margin: 0,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    })
    .save();
}
