import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

export const downloadCVAsPDF = async (cv: any) => {
  const html = `
  <html>
    <head>
      <style>
        body {
          font-family: Arial;
          padding: 20px;
          color: #000;
        }
        h1 { font-size: 24px; margin-bottom: 5px; }
        h2 { margin-top: 20px; border-bottom: 1px solid #ccc; padding-bottom: 5px; }
        .section { margin-bottom: 15px; }
        ul { padding-left: 20px; }
      </style>
    </head>

    <body>
      <h1>CURRICULUM VITAE OF ${cv.full_name || ''}</h1>

      <div class="section">
        <p><b>Email:</b> ${cv.email || ''}</p>
        <p><b>Phone:</b> ${cv.phone || ''}</p>
        <p><b>Address:</b> ${cv.address || ''}</p>
      </div>

      <div class="section">
        <h2>Summary</h2>
        <p>${cv.summary || ''}</p>
      </div>

      <div class="section">
        <h2>Skills</h2>
        <ul>
          ${(cv.skills || []).map((skill: string) => `<li>${skill}</li>`).join('')}
        </ul>
      </div>

      <div class="section">
        <h2>Education</h2>
        ${(cv.education || []).map((e: any) => `
          <p>
            <b>${e.institution || ''}</b><br/>
            ${e.degree || ''} (${e.start_year || ''} - ${e.end_year || ''})
          </p>
        `).join('')}
      </div>

      <div class="section">
        <h2>Work Experience</h2>
        ${(cv.work_experience || []).map((w: any) => `
          <p>
            <b>${w.company || ''}</b><br/>
            ${w.position || ''} (${w.start_date || ''} - ${w.current ? 'Present' : w.end_date || ''})<br/>
            ${w.description || ''}
          </p>
        `).join('')}
      </div>

      <div class="section">
        <h2>References</h2>
        ${(cv.references_data || []).map((r: any) => `
          <p>
            <b>${r.name || ''}</b> - ${r.email || r.contact || ''}
          </p>
        `).join('')}
      </div>
    </body>
  </html>
  `;

  const { uri } = await Print.printToFileAsync({ html });

  if (Platform.OS === 'web') {
    const a = document.createElement('a');
    a.href = uri;
    a.download = `${cv.full_name || 'cv'}.pdf`;
    a.click();
    return;
  }

  await Sharing.shareAsync(uri, {
    mimeType: 'application/pdf',
    dialogTitle: 'Download CV',
  });
};