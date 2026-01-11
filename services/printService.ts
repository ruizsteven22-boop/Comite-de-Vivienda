
import { Assembly, Member, BoardPosition, BoardRole, Transaction } from "../types";

export const printBoardIDCard = (person: { name: string, rut: string, phone: string }, role: string, period: string) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  printWindow.document.write(`
    <html>
      <head>
        <title>Credencial - ${person.name}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
          body { margin: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #f1f5f9; font-family: 'Inter', sans-serif; }
          .card { 
            width: 85.6mm; 
            height: 54mm; 
            background: white; 
            border-radius: 12px; 
            box-shadow: 0 10px 25px rgba(0,0,0,0.1); 
            overflow: hidden; 
            position: relative; 
            border: 1px solid #e2e8f0;
            display: flex;
            flex-direction: column;
          }
          .header { 
            background: linear-gradient(135deg, #064e3b 0%, #065f46 100%); 
            padding: 12px; 
            color: white; 
            text-align: center;
          }
          .header h1 { margin: 0; font-size: 10pt; font-weight: 900; letter-spacing: 2px; text-transform: uppercase; }
          .header p { margin: 2px 0 0; font-size: 6pt; opacity: 0.8; font-weight: bold; }
          .content { flex: 1; padding: 15px; display: flex; align-items: center; gap: 15px; }
          .photo-placeholder { 
            width: 60px; 
            height: 70px; 
            background: #f8fafc; 
            border: 2px solid #059669; 
            border-radius: 6px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #059669;
            font-size: 20pt;
            font-weight: 900;
          }
          .details { flex: 1; }
          .role-badge { 
            background: #ecfdf5; 
            color: #065f46; 
            padding: 2px 8px; 
            border-radius: 4px; 
            font-size: 7pt; 
            font-weight: 900; 
            text-transform: uppercase; 
            display: inline-block;
            margin-bottom: 5px;
          }
          .name { font-size: 11pt; font-weight: 900; color: #1e293b; margin: 0; line-height: 1.1; }
          .rut { font-family: monospace; font-size: 8pt; color: #64748b; font-weight: bold; margin-top: 2px; }
          .period { position: absolute; bottom: 10px; right: 15px; font-size: 6pt; color: #94a3b8; font-weight: bold; }
          .footer-strip { background: #f8fafc; height: 4px; width: 100%; border-top: 1px solid #e2e8f0; }
          .seal { position: absolute; bottom: -10px; left: -10px; width: 60px; height: 60px; background: rgba(5, 150, 105, 0.05); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 24pt; color: rgba(5, 150, 105, 0.1); font-weight: 900; transform: rotate(-15deg); }
          @media print { 
            body { background: white; } 
            .card { box-shadow: none; border: 1px solid #ccc; -webkit-print-color-adjust: exact; } 
          }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="seal">TE</div>
          <div class="header">
            <h1>Tierra Esperanza</h1>
            <p>Comité de Vivienda • Credencial Directiva</p>
          </div>
          <div class="content">
            <div class="photo-placeholder">${person.name.charAt(0)}</div>
            <div class="details">
              <span class="role-badge">${role}</span>
              <h2 class="name">${person.name}</h2>
              <div class="rut">RUT: ${person.rut}</div>
              <div class="rut" style="font-size: 7pt; margin-top: 5px;">Fono: ${person.phone}</div>
            </div>
          </div>
          <div class="period">VIGENCIA: ${period}</div>
          <div class="footer-strip"></div>
        </div>
        <script>
          window.onload = function() { window.print(); window.onafterprint = function() { window.close(); }; }
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
};

export const printBoardReport = (board: BoardPosition[], period: string) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const rows = board.map(pos => `
    <tr>
      <td style="font-weight: 800; color: #064e3b; text-transform: uppercase; background: #f8fafc;">${pos.role}</td>
      <td>
        <div style="font-weight: bold;">${pos.primary.name}</div>
        <div style="font-size: 8pt; color: #64748b;">RUT: ${pos.primary.rut} | Fono: ${pos.primary.phone}</div>
      </td>
      <td>
        <div style="font-weight: bold; color: #475569;">${pos.substitute.name || 'No asignado'}</div>
        <div style="font-size: 8pt; color: #94a3b8;">${pos.substitute.rut ? `RUT: ${pos.substitute.rut}` : ''}</div>
      </td>
    </tr>
  `).join('');

  printWindow.document.write(`
    <html>
      <head>
        <title>Nómina Directiva - Tierra Esperanza</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap');
          body { font-family: 'Inter', sans-serif; padding: 50px; color: #1e293b; line-height: 1.5; }
          .header { text-align: center; border-bottom: 3px solid #059669; padding-bottom: 20px; margin-bottom: 40px; }
          .header h1 { margin: 0; color: #059669; font-size: 24pt; font-weight: 800; text-transform: uppercase; }
          .header p { margin: 5px 0; color: #64748b; font-weight: bold; font-size: 10pt; letter-spacing: 2px; }
          .period-box { background: #f1f5f9; padding: 15px; border-radius: 12px; text-align: center; margin-bottom: 30px; border: 1px solid #e2e8f0; }
          .period-box span { font-size: 9pt; text-transform: uppercase; color: #64748b; font-weight: 800; display: block; margin-bottom: 5px; }
          .period-box strong { font-size: 16pt; color: #0f172a; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th { background: #064e3b; color: white; text-align: left; padding: 12px 15px; font-size: 9pt; text-transform: uppercase; letter-spacing: 1px; }
          td { padding: 15px; border-bottom: 1px solid #e2e8f0; vertical-align: middle; }
          .signatures { margin-top: 80px; display: grid; grid-template-columns: 1fr 1fr; gap: 50px; text-align: center; }
          .sig-line { border-top: 2px solid #1e293b; padding-top: 10px; font-size: 9pt; font-weight: 800; text-transform: uppercase; }
          .footer { margin-top: 60px; text-align: center; font-size: 8pt; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 20px; font-style: italic; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Comité Tierra Esperanza</h1>
          <p>Nómina Oficial de Directorio Vigente</p>
        </div>

        <div class="period-box">
          <span>Periodo de Ejercicio de Funciones</span>
          <strong>${period}</strong>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 200px;">Cargo / Responsabilidad</th>
              <th>Titular Vigente</th>
              <th>Suplente / Reemplazo</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>

        <div style="margin-top: 40px; background: #fffbeb; border: 1px solid #fcd34d; padding: 20px; border-radius: 12px; font-size: 9pt; color: #92400e;">
          <strong>Certificación administrativa:</strong> Se deja constancia que los socios arriba mencionados han sido electos conforme a los estatutos vigentes de la organización y se encuentran facultados para representar al comité en las materias de su competencia.
        </div>

        <div class="signatures">
          <div style="padding-top: 50px;"><div class="sig-line">Presidente(a) Directiva</div></div>
          <div style="padding-top: 50px;"><div class="sig-line">Ministro de Fe / Secretario(a)</div></div>
        </div>

        <div class="footer">
          Documento generado por el Sistema de Gestión Tierra Esperanza el ${new Date().toLocaleDateString('es-CL')}.
        </div>

        <script>
          window.onload = function() { window.print(); window.onafterprint = function() { window.close(); }; }
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
};

export const printMemberFile = (member: Member, transactions: Transaction[], assemblies: Assembly[], board: BoardPosition[]) => {
  const memberPayments = transactions.filter(t => t.memberId === member.id);
  const memberAttendance = assemblies.map(a => ({
    ...a,
    present: a.attendees.includes(member.rut)
  })).filter(a => a.status === 'Finalizada');

  const president = board.find(b => b.role === BoardRole.PRESIDENT)?.primary.name || '____________________';
  const treasurer = board.find(b => b.role === BoardRole.TREASURER)?.primary.name || '____________________';

  const familyRows = member.familyMembers.length > 0 
    ? member.familyMembers.map(fm => `
        <tr>
          <td>${fm.name}</td>
          <td>${fm.rut}</td>
          <td>${fm.relationship}</td>
        </tr>`).join('')
    : '<tr><td colspan="3" style="text-align:center; color:#999;">No registra cargas familiares</td></tr>';

  const paymentRows = memberPayments.length > 0
    ? memberPayments.map(t => `
        <tr>
          <td>${t.date}</td>
          <td>${t.description}</td>
          <td>${t.paymentMethod}</td>
          <td style="text-align:right; font-weight:bold;">$${t.amount.toLocaleString('es-CL')}</td>
        </tr>`).join('')
    : '<tr><td colspan="4" style="text-align:center; color:#999;">Sin movimientos financieros registrados</td></tr>';

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
          .header h1 { margin: 0; color: #059669; font-size: 20pt; font-weight: 800; }
          .header p { margin: 2px 0; font-size: 9pt; color: #64748b; font-weight: bold; text-transform: uppercase; }
          .profile-section { display: flex; gap: 30px; margin-bottom: 30px; }
          .photo-box { width: 120px; height: 120px; border: 4px solid #f1f5f9; border-radius: 15px; overflow: hidden; }
          .photo-box img { width: 100%; height: 100%; object-fit: cover; }
          .info-grid { flex: 1; display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
          .info-item { border-bottom: 1px solid #f1f5f9; padding-bottom: 5px; }
          .info-label { font-size: 8pt; color: #94a3b8; font-weight: bold; text-transform: uppercase; }
          .info-value { font-size: 11pt; font-weight: 600; color: #1e293b; }
          .section-title { background: #f8fafc; padding: 8px 15px; border-radius: 8px; font-size: 10pt; font-weight: 800; color: #065f46; text-transform: uppercase; margin: 25px 0 15px 0; border-left: 4px solid #059669; }
          table { width: 100%; border-collapse: collapse; font-size: 9pt; margin-bottom: 20px; }
          th { text-align: left; padding: 10px; border-bottom: 2px solid #e2e8f0; color: #64748b; }
          td { padding: 10px; border-bottom: 1px solid #f1f5f9; }
          .signatures { margin-top: 60px; display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 30px; }
          .sig-box { text-align: center; border-top: 1px solid #334155; padding-top: 10px; font-size: 8pt; font-weight: bold; }
          .watermark { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-45deg); font-size: 80pt; color: rgba(5, 150, 105, 0.03); font-weight: 900; white-space: nowrap; pointer-events: none; z-index: -1; }
          @media print { body { padding: 0; } .no-print { display: none; } }
        </style>
      </head>
      <body>
        <div class="watermark">TIERRA ESPERANZA</div>
        <div class="header">
          <div>
            <h1>Comité Tierra Esperanza</h1>
            <p>Expediente Maestro de Socio • Folio #${member.id}</p>
          </div>
          <div style="text-align: right">
            <p style="font-size: 8pt">Fecha de Emisión</p>
            <p style="font-size: 10pt; color: #1e293b">${new Date().toLocaleDateString('es-CL')}</p>
          </div>
        </div>

        <div class="profile-section">
          <div class="photo-box">
            <img src="${member.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=047857&color=fff&size=200`}" />
          </div>
          <div class="info-grid">
            <div class="info-item"><div class="info-label">Nombre Completo</div><div class="info-value">${member.name}</div></div>
            <div class="info-item"><div class="info-label">RUT / Identidad</div><div class="info-value">${member.rut}</div></div>
            <div class="info-item"><div class="info-label">Fecha de Ingreso</div><div class="info-value">${member.joinDate}</div></div>
            <div class="info-item"><div class="info-label">Estado Actual</div><div class="info-value">${member.status}</div></div>
            <div class="info-item"><div class="info-label">Correo Electrónico</div><div class="info-value">${member.email || 'No registrado'}</div></div>
            <div class="info-item"><div class="info-label">Teléfono</div><div class="info-value">${member.phone || 'No registrado'}</div></div>
            <div class="info-item" style="grid-column: span 2;"><div class="info-label">Dirección Particular</div><div class="info-value">${member.address || 'No registrada'}</div></div>
          </div>
        </div>

        <div class="section-title">I. Núcleo Familiar Registrado</div>
        <table>
          <thead>
            <tr><th>Nombre del Integrante</th><th>RUT</th><th>Vínculo / Relación</th></tr>
          </thead>
          <tbody>${familyRows}</tbody>
        </table>

        <div class="section-title">II. Resumen de Obligaciones Financieras (Últimos Movimientos)</div>
        <table>
          <thead>
            <tr><th>Fecha</th><th>Concepto</th><th>Método</th><th style="text-align:right;">Monto</th></tr>
          </thead>
          <tbody>${paymentRows}</tbody>
        </table>

        <div class="section-title">III. Registro de Participación en Asambleas</div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
          <div style="background: #f1f5f9; padding: 15px; border-radius: 10px; text-align: center;">
            <div class="info-label">Total Asistencias</div>
            <div style="font-size: 18pt; font-weight: 800;">${memberAttendance.filter(a => a.present).length}</div>
          </div>
          <div style="background: #f1f5f9; padding: 15px; border-radius: 10px; text-align: center;">
            <div class="info-label">Total Inasistencias</div>
            <div style="font-size: 18pt; font-weight: 800; color: #dc2626;">${memberAttendance.filter(a => !a.present).length}</div>
          </div>
        </div>

        <div class="signatures">
          <div class="sig-box">Firma del Socio<br/><br/><br/>${member.name}</div>
          <div class="sig-box">Tesorería General<br/><br/><br/>${treasurer}</div>
          <div class="sig-box">Presidencia / Timbre<br/><br/><br/>${president}</div>
        </div>

        <div style="margin-top: 40px; font-size: 7pt; color: #94a3b8; text-align: center;">
          Este documento es una copia oficial del registro digital de "Tierra Esperanza". Para validez ante terceros requiere timbre original.
        </div>

        <script>
          window.onload = function() { window.print(); window.onafterprint = function() { window.close(); }; }
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
};

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
