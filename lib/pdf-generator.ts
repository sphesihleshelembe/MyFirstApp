import { CV } from './supabase';
import { CVTemplate } from './templates';

export function generatePDFHtml(cv: CV, template: CVTemplate): string {
  const layout = template.layout || 'single';

  const skillsHtml = (cv.skills || []).length
    ? `<div class="section">
        <div class="section-title">Skills</div>
        <div class="skills-container">
          ${(cv.skills || [])
            .map((skill) => `<span class="skill-tag">${skill}</span>`)
            .join('')}
        </div>
      </div>`
    : '';

  const summaryHtml = cv.summary
    ? `<div class="section">
        <div class="section-title">Professional Summary</div>
        <div class="summary-text">${cv.summary}</div>
      </div>`
    : '';

  const educationHtml = (cv.education || [])
    .map(
      (edu) => `
    <div class="education-item">
      <div class="item-header">
        <span class="item-title">${edu.institution || ''}</span>
        <span class="item-date">${edu.start_year || ''} - ${
        edu.end_year || 'Present'
      }</span>
      </div>
      <div class="item-subtitle">
        ${edu.degree || ''} ${edu.field ? `in ${edu.field}` : ''}
      </div>
      ${
        edu.description
          ? `<div class="item-desc">${edu.description}</div>`
          : ''
      }
    </div>
  `
    )
    .join('');

  const experienceHtml = (cv.work_experience || [])
    .map(
      (exp) => `
    <div class="experience-item">
      <div class="item-header">
        <span class="item-title">${exp.company || ''}</span>
        <span class="item-date">${exp.start_date || ''} - ${
        exp.current ? 'Present' : exp.end_date || ''
      }</span>
      </div>
      <div class="item-subtitle">${exp.position || ''}</div>
      ${
        exp.description
          ? `<div class="item-desc">${(exp.description || '')
              .split('\n')
              .map((l) => `• ${l}`)
              .join('<br/>')}</div>`
          : ''
      }
    </div>
  `
    )
    .join('');

  const referencesHtml = (cv.references_data || [])
    .map(
      (ref) => `
    <div class="reference-item">
      <div class="ref-name">${ref.name || ''}</div>
      <div class="ref-title">
        ${ref.position || ''} ${ref.company ? `at ${ref.company}` : ''}
      </div>
      <div class="ref-contact">
        ${ref.email || ''} ${ref.phone ? `| ${ref.phone}` : ''}
      </div>
    </div>
  `
    )
    .join('');

  const experienceSection = (cv.work_experience || []).length
    ? `<div class="section">
        <div class="section-title">Experience</div>
        ${experienceHtml}
      </div>`
    : '';

  const educationSection = (cv.education || []).length
    ? `<div class="section">
        <div class="section-title">Education</div>
        ${educationHtml}
      </div>`
    : '';

  const referencesSection = (cv.references_data || []).length
    ? `<div class="section">
        <div class="section-title">References</div>
        ${referencesHtml}
      </div>`
    : '';

  const templateStyles = getTemplateStyles(template);

  let bodyContent = '';

  if (layout === 'sidebar') {
    bodyContent = `
      <div class="layout-sidebar">
        <div class="sidebar">
          ${summaryHtml}
          ${skillsHtml}
        </div>
        <div class="main">
          ${experienceSection}
          ${educationSection}
          ${referencesSection}
        </div>
      </div>`;
  } else if (layout === 'two-column') {
    bodyContent = `
      <div class="layout-two-column">
        <div class="col-left">
          ${summaryHtml}
          ${skillsHtml}
          ${educationSection}
          ${referencesSection}
        </div>
        <div class="col-right">
          ${experienceSection}
        </div>
      </div>`;
  } else {
    bodyContent = `
      ${summaryHtml}
      ${skillsHtml}
      ${experienceSection}
      ${educationSection}
      ${referencesSection}`;
  }

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>${cv.title || 'CV'}</title>

  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: Arial, Helvetica, sans-serif;
      color: #1a1a1a;
      background: white;
    }

    .cv-container {
      width: 210mm;
      margin: 0 auto;
    }

    .header {
      padding: 30px 40px 20px;
      margin-bottom: 10px;
      border-bottom: 2px solid #333;
      text-align: center;
      background: white;
      color: #000;
    }

    .cv-title {
      text-align: center;
      font-size: 18px;
      font-weight: 700;
      letter-spacing: 2px;
      text-transform: uppercase;
      margin-bottom: 15px;
    }

    .name {
      font-size: 28px;
      font-weight: 700;
      margin-bottom: 10px;
    }

    .contact-info {
      display: flex;
      justify-content: center;
      align-items: center;
      flex-wrap: wrap;
      gap: 8px;
      text-align: center;
      font-size: 13px;
      color: #555;
    }

    .content {
      padding: 20px 40px 40px;
    }

    .section {
      margin-bottom: 25px;
    }

    .section-title {
      font-size: 15px;
      font-weight: 700;
      text-transform: uppercase;
      border-bottom: 1px solid #000;
      color: #000;
      padding-bottom: 5px;
      margin-bottom: 15px;
      ${templateStyles.sectionTitle}
    }

    .summary-text {
      line-height: 1.8;
      font-size: 13px;
      color: #444;
    }

    .item-header {
      display: flex;
      justify-content: space-between;
    }

    .item-title {
      font-weight: 700;
    }

    .item-date {
      font-size: 12px;
      color: #666;
    }

    .item-subtitle {
      font-size: 13px;
      color: #444;
      margin-bottom: 6px;
    }

    .item-desc {
      font-size: 12px;
      color: #555;
      line-height: 1.8;
      margin-top: 6px;
    }

    .skills-container {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .skill-tag {
      padding: 6px 12px;
      border-radius: 20px;
      font-size: 12px;
      background: ${template.gradient[0]};
      color: white;
    }

    .education-item,
    .experience-item,
    .reference-item {
      ${templateStyles.card}
    }

    .reference-item {
      margin-bottom: 10px;
    }

    .ref-name {
      font-weight: 700;
    }

    .ref-contact {
      font-size: 11px;
      color: #777;
    }

    .layout-sidebar {
      display: flex;
    }

    .layout-sidebar .sidebar {
      width: 30%;
      background: #f5f5f5;
      padding: 20px;
    }

    .layout-sidebar .main {
      width: 70%;
      padding: 20px;
    }

    .layout-two-column {
      display: flex;
      gap: 30px;
    }

    .layout-two-column .col-left {
      width: 48%;
    }

    .layout-two-column .col-right {
      width: 48%;
    }

    @media print {
      body {
        -webkit-print-color-adjust: exact;
      }
    }
  </style>
</head>

<body>
  <div class="cv-container">
    <div class="header">
      <div class="cv-title">CURRICULUM VITAE OF</div>
      <div class="name">${cv.full_name || 'Your Name'}</div>
      <div class="contact-info">
        ${cv.email || ''}
        ${cv.phone ? ` | ${cv.phone}` : ''}
        ${cv.address ? ` | ${cv.address}` : ''}
      </div>
    </div>

    <div class="content">
      ${bodyContent}
    </div>
  </div>
</body>
</html>`;
}

function getTemplateStyles(template: CVTemplate) {
  const base = template.gradient[0];

  switch (template.style) {
    case 'modern':
      return {
        header: `background: linear-gradient(135deg, ${template.gradient[0]}, ${template.gradient[1]});`,
        sectionTitle: '',
        card: '',
      };

    case 'minimal':
      return {
        header: `background: #f5f5f5; color: #000; border-bottom: 2px solid ${base};`,
        sectionTitle: '',
        card: '',
      };

    case 'executive':
      return {
        header: `background: linear-gradient(to right, ${base}, #1e3a8a);`,
        sectionTitle: '',
        card: '',
      };

    case 'creative':
      return {
        header: `background: linear-gradient(135deg, ${template.gradient[0]}, ${template.gradient[1]});`,
        sectionTitle: `
          color: ${template.gradient[0]};
          border-left: 6px solid ${template.gradient[0]};
          padding-left: 10px;
        `,
        card: `
          background: #faf5ff;
          padding: 12px;
          border-radius: 12px;
          margin-bottom: 12px;
        `,
      };

    case 'professional':
      return {
        header: `background: ${base};`,
        sectionTitle: '',
        card: '',
      };

    case 'tech':
      return {
        header: `background: linear-gradient(135deg, #111827, ${base});`,
        sectionTitle: '',
        card: '',
      };

    case 'elegant':
      return {
        header: `background: linear-gradient(135deg, ${base}, #b8860b);`,
        sectionTitle: '',
        card: '',
      };

    default:
      return {
        header: `background: linear-gradient(to right, ${base}, ${template.gradient[1]});`,
        sectionTitle: '',
        card: '',
      };
  }
}

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
      margin: 10,
      image: {
        type: 'jpeg',
        quality: 0.98,
      },
      html2canvas: {
        scale: 2,
      },
      jsPDF: {
        unit: 'mm',
        format: 'a4',
        orientation: 'portrait',
      },
    })
    .save();
}
