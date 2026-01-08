
import { Assembly, Member, BoardPosition, BoardRole } from "../types";

export const printAssemblyMinutes = (assembly: Assembly, members: Member[], board: BoardPosition[]) => {
  const quorumPercentage = Math.round((assembly.attendees.length / members.length) * 100);
  const isQuorumReached = quorumPercentage >= 50;
  
  const president = board.find(b => b.role === BoardRole.PRESIDENT)?.primary.name || '____________________';
  const secretary = board.find(b => b.role === BoardRole.SECRETARY)?.primary.name || '____________________';

  const attendeesListHtml = assembly.attendees.map((rut, idx) => {
    const member = members.find(m => m.rut === rut);
    return `
      <tr>
        <td style="text-align: center;">${idx + 1}</td>
        <td>${member?.name || 'Socio no registrado'}</td>
        <td style="font-family: monospace;">${rut}</td>
        <td style="height: 35px; border-bottom: 1px solid #333; width: 150px;"></td>
      </tr>`;
  }).join('');

  const agendaHtml = assembly.agenda?.map(item => `<li>${item}</li>`).join('') || '<li>No se registraron puntos específicos.</li>';
  const agreementsHtml = assembly.agreements?.map(item => `<li><strong>ACUERDO:</strong> ${item}</li>`).join('') || '<li>No se tomaron acuerdos formales.</li>';

  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  printWindow.document.write(`
    <html>
      <head>
        <title>Acta Oficial - Tierra Esperanza - Folio ${assembly.id}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Crimson+Pro:wght@400;600;700&display=swap');
          body { 
            font-family: 'Crimson Pro', serif; 
            padding: 40px; 
            line-height: 1.5; 
            color: #1a1a1a; 
            font-size: 12pt;
            max-width: 800px;
            margin: 0 auto;
          }
          .header { text-align: center; border-bottom: 2px solid #059669; padding-bottom: 15px; margin-bottom: 30px; }
          .header h1 { margin: 0; font-size: 22pt; color: #059669; text-transform: uppercase; }
          .header p { margin: 5px 0; font-size: 10pt; color: #666; font-weight: 600; letter-spacing: 1px; }
          .acta-folio { text-align: right; font-weight: bold; font-size: 11pt; margin-bottom: 20px; color: #334155; }
          .title-main { text-align: center; font-weight: 700; font-size: 16pt; text-decoration: underline; margin-bottom: 25px; text-transform: uppercase; }
          .text-block { text-align: justify; margin-bottom: 15px; }
          .section-title { font-weight: 700; border-bottom: 1px solid #e2e8f0; margin-top: 25px; margin-bottom: 10px; text-transform: uppercase; font-size: 11pt; color: #065f46; }
          ul { margin-bottom: 20px; padding-left: 20px; }
          li { margin-bottom: 8px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 10pt; page-break-inside: auto; }
          th { text-align: left; padding: 10px; background: #f8fafc; border: 1px solid #cbd5e1; color: #475569; text-transform: uppercase; font-size: 9pt; }
          td { padding: 8px 10px; border: 1px solid #cbd5e1; }
          .signatures { margin-top: 60px; display: grid; grid-template-columns: 1fr 1fr; gap: 60px; page-break-inside: avoid; }
          .sig-box { text-align: center; }
          .sig-line { border-top: 1.5px solid #1e293b; width: 100%; margin: 0 auto 10px; }
          .sig-label { font-size: 10pt; font-weight: 700; color: #1e293b; }
          .sig-sub { font-size: 9pt; color: #64748b; }
          .footer { margin-top: 50px; font-size: 8pt; text-align: center; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 15px; font-style: italic; }
          @media print { body { padding: 0; margin: 0; } @page { margin: 2cm; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Comité Tierra Esperanza</h1>
          <p>SISTEMA DE GESTIÓN COMUNITARIA - ACTA OFICIAL</p>
        </div>
        <div class="acta-folio">FOLIO REGISTRO: #${assembly.id}</div>
        <div class="title-main">ACTA DE ASAMBLEA GENERAL ${assembly.type.toUpperCase()}</div>
        <div class="text-block">
          En la comuna de Santiago, a fecha de <strong>${assembly.date}</strong>, siendo las ${assembly.startTime || '--:--'} horas (citación original: ${assembly.summonsTime} hrs.), se constituye la Asamblea General de carácter ${assembly.type.toLowerCase()} de los socios del Comité Tierra Esperanza en dependencias de: <strong>${assembly.location || 'lugar por definir'}</strong>. La sesión es presidida por la directiva vigente para tratar la siguiente materia: <em>"${assembly.description}"</em>.
        </div>
        <div class="text-block">
          Se deja constancia fehaciente que la asamblea cuenta con un registro de asistencia de <strong>${assembly.attendees.length}</strong> socios habilitados de un total de <strong>${members.length}</strong> inscritos, lo cual representa una participación del <strong>${quorumPercentage}%</strong>. Según los estatutos, el quórum de esta sesión es de carácter <strong>${isQuorumReached ? 'RESOLUTIVO' : 'INFORMATIVO'}</strong>.
        </div>
        <div class="section-title">I. Tabla de la Sesión</div>
        <ul>${agendaHtml}</ul>
        <div class="section-title">II. Acuerdos y Resoluciones</div>
        <ul>${agreementsHtml}</ul>
        <div class="section-title">III. Observaciones de la Secretaría</div>
        <div class="text-block">${assembly.observations || 'No se registraron observaciones adicionales de relevancia técnica o administrativa.'}</div>
        <div class="section-title">IV. Nómina de Asistentes y Firmas de Conformidad</div>
        <table>
          <thead>
            <tr>
              <th style="width: 30px;">N°</th>
              <th>Nombre Completo del Socio</th>
              <th style="width: 120px;">RUT</th>
              <th style="width: 150px;">Firma / Huella Digital</th>
            </tr>
          </thead>
          <tbody>
            ${attendeesListHtml}
          </tbody>
        </table>
        <div class="signatures">
          <div class="sig-box">
            <div class="sig-line"></div>
            <div class="sig-label">${president}</div>
            <div class="sig-sub">Presidente Directiva</div>
          </div>
          <div class="sig-box">
            <div class="sig-line"></div>
            <div class="sig-label">${secretary}</div>
            <div class="sig-sub">Secretario(a) de Actas</div>
          </div>
        </div>
        <div class="footer">
          Documento generado digitalmente por el Sistema Tierra Esperanza.
        </div>
        <script>
          window.onload = function() { setTimeout(() => { window.print(); window.onafterprint = function() { window.close(); }; }, 500); }
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
};

export const printAttendanceReport = (assembly: Assembly, members: Member[], board: BoardPosition[]) => {
  const totalPresent = assembly.attendees.length;
  const totalAbsent = members.length - totalPresent;
  const quorumPercentage = Math.round((totalPresent / members.length) * 100);

  const secretary = board.find(b => b.role === BoardRole.SECRETARY)?.primary.name || '____________________';

  const rowsHtml = members.map((member, idx) => {
    const attended = assembly.attendees.includes(member.rut);
    return `
      <tr style="${!attended ? 'background-color: #fef2f2;' : ''}">
        <td style="text-align: center;">${idx + 1}</td>
        <td>${member.name}</td>
        <td style="font-family: monospace;">${member.rut}</td>
        <td style="text-align: center;">
          <span style="
            display: inline-block;
            padding: 3px 10px;
            border-radius: 4px;
            font-size: 8pt;
            font-weight: bold;
            ${attended ? 'background: #dcfce7; color: #166534;' : 'background: #fee2e2; color: #991b1b;'}
          ">
            ${attended ? 'ASISTIÓ' : 'FALTÓ'}
          </span>
        </td>
        <td style="font-size: 8pt; color: #666;">
          ${!attended ? 'Multa por Inasistencia' : '-'}
        </td>
      </tr>`;
  }).join('');

  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  printWindow.document.write(`
    <html>
      <head>
        <title>Reporte Asistencia - ${assembly.date}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
          body { font-family: 'Inter', sans-serif; padding: 40px; color: #334155; font-size: 10pt; }
          .header { text-align: center; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 20px; }
          .header h1 { margin: 0; color: #059669; font-size: 18pt; }
          .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 20px; }
          .summary-card { border: 1px solid #e2e8f0; padding: 10px; border-radius: 8px; text-align: center; }
          .summary-card div { font-size: 8pt; text-transform: uppercase; color: #64748b; font-weight: bold; }
          .summary-card p { margin: 5px 0 0; font-size: 14pt; font-weight: 800; color: #1e293b; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th { background: #f8fafc; border: 1px solid #e2e8f0; padding: 10px; text-align: left; font-size: 8pt; text-transform: uppercase; color: #475569; }
          td { border: 1px solid #e2e8f0; padding: 8px 10px; }
          .footer { margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 20px; display: flex; justify-content: space-between; align-items: center; font-size: 8pt; color: #94a3b8; }
          .sig-area { text-align: center; width: 200px; border-top: 1px solid #334155; padding-top: 5px; margin-top: 50px; align-self: flex-end; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Tierra Esperanza - Reporte de Asistencia</h1>
          <p style="margin: 5px 0; font-weight: bold;">${assembly.description}</p>
          <p style="margin: 0; font-size: 9pt; color: #64748b;">Fecha: ${assembly.date} | Lugar: ${assembly.location}</p>
        </div>

        <div class="summary">
          <div class="summary-card"><div>Total Socios</div><p>${members.length}</p></div>
          <div class="summary-card"><div>Presentes</div><p style="color: #059669;">${totalPresent}</p></div>
          <div class="summary-card"><div>Ausentes</div><p style="color: #dc2626;">${totalAbsent}</p></div>
          <div class="summary-card"><div>Participación</div><p>${quorumPercentage}%</p></div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 30px;">#</th>
              <th>Nombre del Socio</th>
              <th style="width: 110px;">RUT</th>
              <th style="width: 80px; text-align: center;">Estado</th>
              <th>Observación</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>

        <div style="display: flex; justify-content: flex-end;">
          <div class="sig-area">
            <strong>${secretary}</strong><br/>
            Responsable de Asistencia
          </div>
        </div>

        <div class="footer">
          <span>Sistema de Gestión Tierra Esperanza - Documento Interno de Control</span>
          <span>Página 1 de 1</span>
        </div>

        <script>
          window.onload = function() { setTimeout(() => { window.print(); window.onafterprint = function() { window.close(); }; }, 500); }
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
};
