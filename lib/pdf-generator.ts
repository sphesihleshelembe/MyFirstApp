//import html2pdf from 'html2pdf.js';
import { CV } from './supabase';
import { CVTemplate } from './templates';

export function generatePDFHtml(cv: CV, template: CVTemplate): string {
  const layout = template.layout || 'single';

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

  const templateStyles = getTemplateStyles(template);

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>${cv.title || 'CV'}</title>

  <style>
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
      padding: 40px;
      ${templateStyles.header}
      color: ${template.style === 'minimal' ? '#1a1a1a' : '#fff'};
    }

    .name {
      font-size: 34px;
      font-weight: 700;
      margin-bottom: 8px;
    }

    .contact-info {
      font-size: 13px;
      opacity: 0.9;
      display: flex;
      flex-wrap: wrap;
      gap: 15px;
    }

    .content {
      padding: 40px;
    }

    .section {
      margin-bottom: 28px;
    }

    .section-title {
      font-size: 15px;
      font-weight: 700;
      text-transform: uppercase;
      margin-bottom: 12px;
      border-bottom: 2px solid ${template.gradient[0]};
      padding-bottom: 6px;
      color: ${template.gradient[0]};
    }

    .item {
      margin-bottom: 12px;
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
      line-height: 1.5;
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

    @media print {
      body {
        -webkit-print-color-adjust: exact;
      }
    }
  </style>
</head>

<body>
  <div class="cv-container layout-${layout}">

    <div class="header">
      <div class="name">${cv.full_name || 'Your Name'}</div>
      <div class="contact-info">
        ${cv.email ? `<div>${cv.email}</div>` : ''}
        ${cv.phone ? `<div>${cv.phone}</div>` : ''}
        ${cv.address ? `<div>${cv.address}</div>` : ''}
      </div>
    </div>

    <div class="content"> 
    
${layout === 'sidebar' ? `
  <div class="layout-sidebar">

    <div class="sidebar">
      <h3>Skills</h3>
      ${(cv.skills || []).map(s => `<div>${s}</div>`).join('')}
    </div>

    <div class="main">
` : `
  <div class="content">
`}

      <div class="section">
        <div class="section-title">Experience</div>
        ${experienceHtml}
      </div>
      
          : ''
      }

      ${
        (cv.education || []).length
          ? `
      <div class="section">
       <div class="section-title">Education</div>
        ${educationHtml}
      </div>
      `
          : '
      }

      ${
        (cv.references_data || []).length
          ? `
      <div class="section">
        <div class="section-title">References</div>
        ${referencesHtml}
      </div>
      `
          : ''
      }

    ${layout === 'sidebar' ? `</div></div>` : `</div>`}
  </div>
</body>
</html>
  `;
}

function getTemplateStyles(template: CVTemplate) {
  const base = template.gradient[0];

  switch (template.style) {
    case 'modern':
      return {
        header: `background: linear-gradient(135deg, ${template.gradient[0]}, ${template.gradient[1]});`,
      };

    case 'minimal':
      return {
        header: `background: #f5f5f5; color: #000; border-bottom: 2px solid ${base};`,
      };

    case 'executive':
      return {
        header: `background: linear-gradient(to right, ${base}, #1e3a8a);`,
      };

    case 'creative':
      return {
        header: `background: linear-gradient(135deg, ${template.gradient[0]}, ${template.gradient[1]});`,
      };

    case 'professional':
      return {
        header: `background: ${base};`,
      };

    case 'tech':
      return {
        header: `background: linear-gradient(135deg, #111827, ${base});`,
      };

    case 'elegant':
      return {
        header: `background: linear-gradient(135deg, ${base}, #b8860b);`,
      };

    default:
      return {
        header: `background: linear-gradient(to right, ${base}, ${template.gradient[1]});`,
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