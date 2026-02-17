
import { Assembly, Member, BoardPosition, BoardRole, Transaction, CommitteeConfig, Document } from "../types";

export const printBoardReport = (board: BoardPosition[], period: string, config: CommitteeConfig) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const rows = board.map(pos => `
    <tr>
      <td style="font-weight: 800; color: #064e3b; text-transform: uppercase; background: #f8fafc; font-size: 10pt;">${pos.role}</td>
      <td style="border-right: 2px solid #e2e8f0;">
        <div style="font-weight: 900; font-size: 11pt; color: #0f172a;">${pos.primary.name || 'Vacante'}</div>
        <div style="font-size: 8pt; color: #64748b; font-weight: bold; margin-top: 4px;">RUT: ${pos.primary.rut || 'N/A'}</div>
      </td>
      <td>
        <div style="font-weight: bold; font-size: 10pt; color: #475569;">${pos.substitute.name || '---'}</div>
        <div style="font-size: 8pt; color: #94a3b8; margin-top: 4px;">${pos.substitute.rut ? `RUT: ${pos.substitute.rut}` : ''}</div>
      </td>
    </tr>
  `).join('');

  printWindow.document.write(`
    <html>
      <head>
        <title>Nómina Directiva - ${config.tradeName}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800;900&display=swap');
          body { font-family: 'Inter', sans-serif; padding: 50px; color: #1e293b; line-height: 1.5; }
          .header { text-align: center; border-bottom: 4px solid #059669; padding-bottom: 25px; margin-bottom: 40px; }
          .header h1 { margin: 0; color: #059669; font-size: 26pt; font-weight: 900; text-transform: uppercase; letter-spacing: -1px; }
          .header .legal-info { margin: 5px 0; color: #64748b; font-weight: 800; font-size: 10pt; letter-spacing: 2px; text-transform: uppercase; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; table-layout: fixed; }
          th { background: #064e3b; color: white; text-align: left; padding: 15px; font-size: 9pt; text-transform: uppercase; letter-spacing: 1px; font-weight: 900; }
          td { padding: 15px; border-bottom: 1px solid #e2e8f0; vertical-align: top; }
          .footer { margin-top: 80px; text-align: center; font-size: 8pt; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 20px; font-style: italic; font-weight: 600; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${config.legalName}</h1>
          <p class="legal-info">RUT: ${config.rut} • Nómina Oficial de Directorio</p>
        </div>
        <table>
          <thead>
            <tr>
              <th style="width: 25%;">Cargo</th>
              <th style="width: 40%;">Titular Vigente</th>
              <th style="width: 35%;">Suplente Oficial</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
        <div class="footer">
          Documento oficial generado por ${config.tradeName} el ${new Date().toLocaleDateString('es-CL')}.
        </div>
        <script>window.onload = function() { window.print(); window.onafterprint = function() { window.close(); }; }</script>
      </body>
    </html>
  `);
  printWindow.document.close();
};

export const printOfficialDocument = (doc: Document, board: BoardPosition[], config: CommitteeConfig) => {
  const president = board.find(b => b.role === BoardRole.PRESIDENT)?.primary.name || '____________________';
  const secretary = board.find(b => b.role === BoardRole.SECRETARY)?.primary.name || '____________________';
  
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  printWindow.document.write(`
    <html>
      <head>
        <title>${doc.type} N° ${doc.folioNumber || 'S/N'} - ${doc.year}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Crimson+Pro:wght@400;600;700&family=Inter:wght@400;700;900&display=swap');
          
          /* Configuración de Página para PDF */
          @page {
            size: letter;
            margin: 2.5cm;
          }

          body { 
            font-family: 'Crimson Pro', serif; 
            line-height: 1.6; 
            color: #000; 
            font-size: 11.5pt;
            margin: 0;
            padding: 0;
          }

          .container {
            width: 100%;
          }

          .header { 
            border-bottom: 2px solid #000; 
            padding-bottom: 15px; 
            margin-bottom: 35px; 
            display: flex; 
            justify-content: space-between; 
            align-items: flex-end; 
          }

          .header-left h1 { 
            margin: 0; 
            font-family: 'Inter', sans-serif; 
            font-weight: 900; 
            font-size: 14pt; 
            text-transform: uppercase; 
            color: #000; 
            letter-spacing: -0.5px; 
          }

          .header-left p { 
            margin: 3px 0 0 0; 
            font-family: 'Inter', sans-serif; 
            font-size: 7.5pt; 
            font-weight: 700; 
            color: #444; 
            text-transform: uppercase; 
            letter-spacing: 0.5px; 
          }

          .doc-meta { 
            text-align: right; 
            font-family: 'Inter', sans-serif; 
            font-size: 8.5pt; 
            color: #000; 
            font-weight: 700; 
            line-height: 1.4;
          }

          .doc-type-title { 
            margin-top: 30px; 
            font-family: 'Inter', sans-serif; 
            font-weight: 900; 
            font-size: 18pt; 
            text-align: center; 
            text-transform: uppercase; 
            color: #000; 
            text-decoration: underline; 
            margin-bottom: 35px; 
          }

          .intro-table { 
            width: 100%; 
            margin-bottom: 35px; 
            border-spacing: 0;
          }

          .intro-table td { 
            padding: 4px 0; 
            vertical-align: top; 
          }

          .intro-label { 
            font-family: 'Inter', sans-serif; 
            font-weight: 900; 
            text-transform: uppercase; 
            font-size: 9pt; 
            width: 100px; 
          }

          .content { 
            text-align: justify; 
            white-space: pre-wrap; 
            margin-bottom: 50px; 
            min-height: 350px;
            font-size: 11.5pt;
          }

          .signatures { 
            margin-top: 60px; 
            display: flex;
            justify-content: space-between;
            gap: 50px; 
          }

          .sig-box { 
            width: 45%;
            text-align: center; 
            border-top: 1.5px solid #000; 
            padding-top: 12px; 
            font-family: 'Inter', sans-serif; 
            font-weight: 700; 
            font-size: 9.5pt; 
            text-transform: uppercase; 
          }

          .sig-role {
            font-size: 7.5pt;
            color: #555;
            display: block;
            margin-top: 4px;
            font-weight: 600;
          }

          .footer { 
            position: fixed; 
            bottom: 0; 
            left: 0; 
            right: 0; 
            border-top: 1px solid #ddd; 
            padding-top: 12px; 
            font-family: 'Inter', sans-serif; 
            font-size: 6.5pt; 
            color: #777; 
            text-align: center; 
            font-weight: 700; 
            text-transform: uppercase; 
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="header-left">
              <h1>${config.legalName}</h1>
              <p>RUT: ${config.rut} • ${config.municipalRes}</p>
            </div>
            <div class="doc-meta">
              FOLIO: ${doc.type.toUpperCase()} N° ${doc.folioNumber || '---'} - ${doc.year}<br/>
              FECHA: ${doc.date}
            </div>
          </div>

          <div class="doc-type-title">${doc.type}</div>

          <table class="intro-table">
            <tr><td class="intro-label">PARA:</td><td>${doc.addressee}</td></tr>
            <tr><td class="intro-label">DE:</td><td>SECRETARÍA GENERAL - ${config.tradeName}</td></tr>
            <tr><td class="intro-label">ASUNTO:</td><td><strong>${doc.subject}</strong></td></tr>
          </table>

          <div class="content">${doc.content}</div>

          <div class="signatures">
            <div class="sig-box">
              ${secretary}<br/>
              <span class="sig-role">SECRETARIO(A) GENERAL</span>
            </div>
            <div class="sig-box">
              ${president}<br/>
              <span class="sig-role">PRESIDENTE(A) DEL COMITÉ</span>
            </div>
          </div>

          <div class="footer">
            Este documento es un registro oficial del ${config.legalName}. <br/>
            Generado digitalmente vía Plataforma Tierra Esperanza el ${new Date().toLocaleString('es-CL')}.
          </div>
        </div>
        <script>
          window.onload = function() { 
            window.print(); 
            window.onafterprint = function() { window.close(); }; 
          }
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
};

export const printMemberFile = (member: Member, transactions: Transaction[], assemblies: Assembly[], board: BoardPosition[], config: CommitteeConfig) => {
  const president = board.find(b => b.role === BoardRole.PRESIDENT)?.primary.name || '____________________';
  const treasurer = board.find(b => b.role === BoardRole.TREASURER)?.primary.name || '____________________';

  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  printWindow.document.write(`
    <html>
      <head>
        <title>Ficha Socio - ${member.name}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap');
          body { font-family: 'Inter', sans-serif; padding: 40px; color: #1e293b; line-height: 1.4; }
          .header { border-bottom: 3px solid #059669; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: center; }
          .header h1 { margin: 0; color: #059669; font-size: 18pt; font-weight: 800; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; }
          .info-item { border-bottom: 1px solid #f1f5f9; padding-bottom: 5px; }
          .label { font-size: 8pt; font-weight: 800; color: #64748b; text-transform: uppercase; }
          .value { font-size: 10pt; font-weight: 600; color: #0f172a; display: block; }
          .signatures { margin-top: 80px; display: flex; justify-content: space-around; }
          .sig-box { text-align: center; border-top: 1px solid #334155; padding-top: 8px; font-size: 8pt; font-weight: bold; width: 30%; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1>${config.legalName}</h1>
            <p>EXPEDIENTE DE SOCIO FOLIO #${member.id}</p>
          </div>
          <div style="text-align: right">
            <p>Fecha de Emisión: ${new Date().toLocaleDateString('es-CL')}</p>
          </div>
        </div>

        <div class="info-grid">
          <div class="info-item"><span class="label">Nombre Completo</span><span class="value">${member.name}</span></div>
          <div class="info-item"><span class="label">RUT</span><span class="value">${member.rut}</span></div>
          <div class="info-item"><span class="label">Fecha Ingreso</span><span class="value">${member.joinDate}</span></div>
          <div class="info-item"><span class="label">Estado</span><span class="value">${member.status}</span></div>
          <div class="info-item"><span class="label">Dirección</span><span class="value">${member.address}, ${member.comuna}</span></div>
          <div class="info-item"><span class="label">Teléfono</span><span class="value">${member.phone}</span></div>
        </div>

        <div class="signatures">
          <div class="sig-box">Firma del Socio<br/>${member.name}</div>
          <div class="sig-box">Tesorería<br/>${treasurer}</div>
          <div class="sig-box">Presidencia<br/>${president}</div>
        </div>
        <script>window.onload = function() { window.print(); window.onafterprint = function() { window.close(); }; }</script>
      </body>
    </html>
  `);
  printWindow.document.close();
};

// Fix for missing export: printAssemblyMinutes
export const printAssemblyMinutes = (assembly: Assembly, members: Member[], board: BoardPosition[], config: CommitteeConfig) => {
  const president = board.find(b => b.role === BoardRole.PRESIDENT)?.primary.name || '____________________';
  const secretary = board.find(b => b.role === BoardRole.SECRETARY)?.primary.name || '____________________';
  
  const attendeesList = members
    .filter(m => assembly.attendees.includes(m.rut))
    .map(m => `<li>${m.name} (${m.rut})</li>`)
    .join('');

  const agendaList = (assembly.agenda || []).map(item => `<li>${item}</li>`).join('');
  const agreementsList = (assembly.agreements || []).map(item => `<li>${item}</li>`).join('');

  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  printWindow.document.write(`
    <html>
      <head>
        <title>Acta de Asamblea - ${assembly.date}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
          body { font-family: 'Inter', sans-serif; padding: 40px; color: #1e293b; line-height: 1.6; }
          .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 20px; margin-bottom: 30px; }
          h1 { text-transform: uppercase; font-size: 16pt; margin: 0; }
          .meta { margin-bottom: 30px; }
          .section { margin-bottom: 25px; }
          .section-title { font-weight: 900; text-transform: uppercase; font-size: 10pt; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px; margin-bottom: 10px; }
          .signatures { margin-top: 60px; display: flex; justify-content: space-around; }
          .sig-box { text-align: center; border-top: 1px solid #000; padding-top: 10px; width: 40%; font-size: 10pt; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>ACTA DE ASAMBLEA ${assembly.type.toUpperCase()}</h1>
          <p>${config.legalName}<br/>RUT: ${config.rut}</p>
        </div>
        <div class="meta">
          <p><strong>Fecha:</strong> ${assembly.date}</p>
          <p><strong>Lugar:</strong> ${assembly.location || 'Sede Social'}</p>
          <p><strong>Hora Inicio:</strong> ${assembly.startTime || assembly.summonsTime}</p>
        </div>
        <div class="section">
          <div class="section-title">Descripción / Motivo</div>
          <p>${assembly.description}</p>
        </div>
        <div class="section">
          <div class="section-title">Tabla / Agenda</div>
          <ul>${agendaList || '<li>No se registró agenda específica</li>'}</ul>
        </div>
        <div class="section">
          <div class="section-title">Acuerdos Adoptados</div>
          <ul>${agreementsList || '<li>No se registraron acuerdos</li>'}</ul>
        </div>
        <div class="section">
          <div class="section-title">Asistentes (${assembly.attendees.length})</div>
          <ul style="column-count: 2; font-size: 9pt;">${attendeesList}</ul>
        </div>
        <div class="signatures">
          <div class="sig-box">${secretary}<br/>Secretario(a)</div>
          <div class="sig-box">${president}<br/>Presidente(a)</div>
        </div>
      </body>
    </html>
  `);
  printWindow.document.close();
};

// Fix for missing export: printAttendanceReport
export const printAttendanceReport = (assembly: Assembly, members: Member[], board: BoardPosition[], config: CommitteeConfig) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const rows = members.map(m => `
    <tr>
      <td style="padding: 10px; border: 1px solid #ddd;">${m.name}</td>
      <td style="padding: 10px; border: 1px solid #ddd; font-family: monospace;">${m.rut}</td>
      <td style="padding: 10px; border: 1px solid #ddd; text-align: center;">${assembly.attendees.includes(m.rut) ? 'PRESENTE' : ''}</td>
      <td style="padding: 10px; border: 1px solid #ddd; width: 150px;"></td>
    </tr>
  `).join('');

  printWindow.document.write(`
    <html>
      <head>
        <title>Control de Asistencia - ${assembly.date}</title>
        <style>
          body { font-family: sans-serif; padding: 30px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th { background: #f8fafc; padding: 12px; border: 1px solid #ddd; text-align: left; font-size: 9pt; text-transform: uppercase; }
          .header { text-align: center; margin-bottom: 30px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h2>LISTADO DE ASISTENCIA Y FIRMAS</h2>
          <p>${config.legalName} - RUT: ${config.rut}</p>
          <p>Asamblea: ${assembly.description} (${assembly.date})</p>
        </div>
        <table>
          <thead>
            <tr>
              <th>Nombre del Socio</th>
              <th>RUT</th>
              <th>Estado</th>
              <th>Firma</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </body>
    </html>
  `);
  printWindow.document.close();
};
