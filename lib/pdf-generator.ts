import { CV } from './supabase';
import { CVTemplate } from './templates';
import html2pdf from 'html2pdf.js';

export function generatePDFHtml(cv: CV, template: CVTemplate): string {
  const skillsList = cv.skills?.join(' | ') || '';
  const educationHtml = (cv.education || []).map(edu => `
    <div class="education-item">
      <div class="item-header">
        <span class="item-title">${edu.institution || ''}</span>
        <span class="item-date">${edu.start_year || ''} - ${edu.end_year || 'Present'}</span>
      </div>
      <div class="item-subtitle">${edu.degree || ''} ${edu.field ? `in ${edu.field}` : ''}</div>
      ${edu.description ? `<div class="item-desc">${edu.description}</div>` : ''}
    </div>
  `).join('');

  const experienceHtml = (cv.work_experience || []).map(exp => `
    <div class="experience-item">
      <div class="item-header">
        <span class="item-title">${exp.company || ''}</span>
        <span class="item-date">${exp.start_date || ''} - ${exp.current ? 'Present' : exp.end_date || ''}</span>
      </div>
      <div class="item-subtitle">${exp.position || ''}</div>
      ${exp.description ? `<div class="item-desc">${exp.description}</div>` : ''}
    </div>
  `).join('');

  const referencesHtml = (cv.references_data || []).map(ref => `
    <div class="reference-item">
      <div class="ref-name">${ref.name || ''}</div>
      <div class="ref-title">${ref.position || ''} ${ref.company ? `at ${ref.company}` : ''}</div>
      <div class="ref-contact">${ref.email || ''} ${ref.phone ? `| ${ref.phone}` : ''}</div>
    </div>
  `).join('');

  const templateStyles = getTemplateStyles(template);

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${cv.title}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
      line-height: 1.6;
      color: #1a1a1a;
      background: white;
      padding: 0;
    }
    .cv-container {
      max-width: 210mm;
      margin: 0 auto;
      background: white;
      padding: 0;
    }
    .header {
      ${templateStyles.header}
      padding: 40px;
      color: white;
    }
    .name { font-size: 36px; font-weight: 700; margin-bottom: 8px; letter-spacing: 0.5px; }
    .contact-info {
      font-size: 13px;
      opacity: 0.95;
      margin-top: 16px;
      display: flex;
      flex-wrap: wrap;
      gap: 20px;
    }
    .contact-item { display: flex; align-items: center; gap: 6px; }
    .content { padding: 40px; }
    .section { margin-bottom: 32px; }
    .section-title {
      font-size: 16px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      ${templateStyles.sectionTitle}
      padding-bottom: 10px;
      border-bottom: 3px solid ${template.gradient[0]};
      margin-bottom: 18px;
    }
    .summary-text {
      font-size: 14px;
      line-height: 1.7;
      color: #444;
    }
    .skills-container {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    .skill-tag {
      ${templateStyles.skillTag}
      padding: 6px 14px;
      font-size: 12px;
      font-weight: 500;
      border-radius: 20px;
    }
    .item-header {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      margin-bottom: 4px;
    }
    .item-title { font-size: 15px; font-weight: 700; color: #1a1a1a; }
    .item-date { font-size: 12px; color: #666; }
    .item-subtitle { font-size: 13px; color: #444; font-weight: 500; margin-bottom: 8px; }
    .item-desc { font-size: 13px; color: #555; line-height: 1.5; margin-top: 6px; }
    .education-item, .experience-item, .reference-item { margin-bottom: 20px; }
    .reference-item .ref-name { font-weight: 700; font-size: 14px; }
    .reference-item .ref-title { font-size: 12px; color: #555; margin-top: 2px; }
    .reference-item .ref-contact { font-size: 11px; color: #888; margin-top: 4px; }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .cv-container { max-width: 100%; }
    }
  </style>
</head>
<body>
  <div class="cv-container">
    <div class="header">
      <div class="name">${cv.full_name || 'Your Name'}</div>
      <div class="contact-info">
        ${cv.email ? `<span class="contact-item">${cv.email}</span>` : ''}
        ${cv.phone ? `<span class="contact-item">${cv.phone}</span>` : ''}
        ${cv.address ? `<span class="contact-item">${cv.address}</span>` : ''}
      </div>
    </div>
    <div class="content">
      ${cv.summary ? `
        <div class="section">
          <div class="section-title">Professional Summary</div>
          <div class="summary-text">${cv.summary}</div>
        </div>
      ` : ''}
      ${skillsList ? `
        <div class="section">
          <div class="section-title">Skills</div>
          <div class="skills-container">
            ${(cv.skills || []).map(skill => `<span class="skill-tag">${skill}</span>`).join('')}
          </div>
        </div>
      ` : ''}
      ${experienceHtml ? `
        <div class="section">
          <div class="section-title">Work Experience</div>
          ${experienceHtml}
        </div>
      ` : ''}
      ${educationHtml ? `
        <div class="section">
          <div class="section-title">Education</div>
          ${educationHtml}
        </div>
      ` : ''}
      ${referencesHtml ? `
        <div class="section">
          <div class="section-title">References</div>
          ${referencesHtml}
        </div>
      ` : ''}
    </div>
  </div>
</body>
</html>
  `;
}

function getTemplateStyles(template: CVTemplate) {
  const baseColor = template.gradient[0];

  switch (template.style) {
    case 'modern':
      return {
        header: `background: linear-gradient(135deg, ${template.gradient[0]}, ${template.gradient[1]});`,
        sectionTitle: `color: ${baseColor};`,
        skillTag: `background: ${baseColor}; color: white;`,
      };
    case 'minimal':
      return {
        header: `background: #f8f9fa; color: #1a1a1a; border-bottom: 2px solid ${baseColor};`,
        sectionTitle: `color: ${baseColor};`,
        skillTag: `background: #f0f0f0; color: #333;`,
      };
    case 'executive':
      return {
        header: `background: linear-gradient(to right, ${baseColor}, #1E3A8A);`,
        sectionTitle: `color: ${baseColor};`,
        skillTag: `background: ${baseColor}; color: white;`,
      };
    case 'creative':
      return {
        header: `background: linear-gradient(135deg, ${template.gradient[0]}, ${template.gradient[1]});`,
        sectionTitle: `color: ${baseColor};`,
        skillTag: `background: linear-gradient(135deg, ${template.gradient[0]}, ${template.gradient[1]}); color: white;`,
      };
    case 'professional':
      return {
        header: `background: ${baseColor};`,
        sectionTitle: `color: ${baseColor};`,
        skillTag: `background: ${baseColor}; color: white;`,
      };
    case 'tech':
      return {
        header: `background: linear-gradient(135deg, #1a1a2e, ${baseColor});`,
        sectionTitle: `color: ${baseColor};`,
        skillTag: `background: ${baseColor}; color: white; font-family: 'Courier New', monospace;`,
      };
    case 'elegant':
      return {
        header: `background: linear-gradient(135deg, ${baseColor}, #b8860b);`,
        sectionTitle: `color: ${baseColor};`,
        skillTag: `background: ${baseColor}; color: white;`,
      };
    default: // classic
      return {
        header: `background: linear-gradient(to right, ${baseColor}, ${template.gradient[1]});`,
        sectionTitle: `color: ${baseColor};`,
        skillTag: `background: #e8e8e8; color: #333;`,
      };
  }
}

export function triggerPDFDownload(
  html: string,
  filename: string = 'cv.pdf'
): void {
  const container = document.createElement('div');
  container.innerHTML = html;

  html2pdf()
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
  

