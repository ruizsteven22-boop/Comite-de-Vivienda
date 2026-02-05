
import { Assembly, Member, BoardPosition, BoardRole, Transaction, CommitteeConfig } from "../types";

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
          .period-box { background: #f8fafc; padding: 20px; border-radius: 16px; text-align: center; margin-bottom: 30px; border: 2px solid #e2e8f0; }
          .period-box span { font-size: 8pt; text-transform: uppercase; color: #94a3b8; font-weight: 900; display: block; margin-bottom: 5px; letter-spacing: 2px; }
          .period-box strong { font-size: 20pt; color: #0f172a; font-weight: 900; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; table-layout: fixed; }
          th { background: #064e3b; color: white; text-align: left; padding: 15px; font-size: 9pt; text-transform: uppercase; letter-spacing: 1px; font-weight: 900; }
          td { padding: 15px; border-bottom: 1px solid #e2e8f0; vertical-align: top; }
          .signatures { margin-top: 100px; display: grid; grid-template-columns: 1fr 1fr; gap: 60px; text-align: center; }
          .sig-line { border-top: 2px solid #1e293b; padding-top: 12px; font-size: 9pt; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; }
          .footer { margin-top: 80px; text-align: center; font-size: 8pt; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 20px; font-style: italic; font-weight: 600; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${config.legalName}</h1>
          <p class="legal-info">RUT: ${config.rut} • Nómina Oficial de Directorio</p>
        </div>
        <div class="period-box">
          <span>Periodo de Vigencia de Funciones</span>
          <strong>${period}</strong>
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
        <div class="signatures">
          <div style="padding-top: 60px;"><div class="sig-line">Presidente(a)</div></div>
          <div style="padding-top: 60px;"><div class="sig-line">Secretario(a) de Actas</div></div>
        </div>
        <div class="footer">
          Documento oficial generado por ${config.tradeName} el ${new Date().toLocaleDateString('es-CL')}.
        </div>
        <script>window.onload = function() { window.print(); window.onafterprint = function() { window.close(); }; }</script>
      </body>
    </html>
  `);
  printWindow.document.close();
};

export const printMemberFile = (member: Member, transactions: Transaction[], assemblies: Assembly[], board: BoardPosition[], config: CommitteeConfig) => {
  const memberPayments = transactions.filter(t => t.memberId === member.id);
  
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
          .header h1 { margin: 0; color: #059669; font-size: 18pt; font-weight: 800; }
          .header p { margin: 2px 0; font-size: 8pt; color: #64748b; font-weight: bold; text-transform: uppercase; }
          .section-title { background: #f8fafc; padding: 8px 15px; border-radius: 8px; font-size: 9pt; font-weight: 800; color: #065f46; text-transform: uppercase; margin: 25px 0 10px 0; border-left: 4px solid #059669; }
          .profile-section { display: flex; gap: 30px; margin-bottom: 20px; }
          .photo-box { width: 100px; height: 100px; border-radius: 12px; overflow: hidden; border: 2px solid #e2e8f0; }
          .photo-box img { width: 100%; height: 100%; object-fit: cover; }
          .info-grid { flex: 1; display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
          .info-label { font-size: 7pt; color: #94a3b8; font-weight: bold; text-transform: uppercase; }
          .info-value { font-size: 10pt; font-weight: 600; }
          table { width: 100%; border-collapse: collapse; font-size: 8pt; margin-bottom: 15px; }
          th { text-align: left; padding: 8px; border-bottom: 2px solid #e2e8f0; }
          td { padding: 8px; border-bottom: 1px solid #f1f5f9; }
          .signatures { margin-top: 50px; display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; }
          .sig-box { text-align: center; border-top: 1px solid #334155; padding-top: 8px; font-size: 7pt; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1>${config.legalName}</h1>
            <p>RUT: ${config.rut} • Expediente Folio #${member.id}</p>
          </div>
          <div style="text-align: right">
            <p>Emisión: ${new Date().toLocaleDateString('es-CL')}</p>
          </div>
        </div>
        <div class="profile-section">
          <div class="photo-box">
            <img src="${member.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=047857&color=fff&size=200`}" />
          </div>
          <div class="info-grid">
            <div><div class="info-label">Socio</div><div class="info-value">${member.name}</div></div>
            <div><div class="info-label">RUT</div><div class="info-value">${member.rut}</div></div>
            <div><div class="info-label">Ingreso</div><div class="info-value">${member.joinDate}</div></div>
            <div><div class="info-label">Estado</div><div class="info-value">${member.status}</div></div>
            <div style="grid-column: span 2"><div class="info-label">Email</div><div class="info-value">${member.email || 'N/A'}</div></div>
            <div style="grid-column: span 2"><div class="info-label">Dirección</div><div class="info-value">${member.address || 'Sin registrar'} ${member.comuna ? ', ' + member.comuna : ''} ${member.region ? ', ' + member.region : ''}</div></div>
          </div>
        </div>
        <div class="section-title">I. Familia</div>
        <table><thead><tr><th>Nombre</th><th>RUT</th><th>Parentesco</th></tr></thead><tbody>${familyRows}</tbody></table>
        <div class="section-title">II. Tesorería</div>
        <table><thead><tr><th>Fecha</th><th>Concepto</th><th>Método</th><th style="text-align:right;">Monto</th></tr></thead><tbody>${paymentRows}</tbody></table>
        <div class="signatures">
          <div class="sig-box">Firma Socio<br/><br/>${member.name}</div>
          <div class="sig-box">Tesorería<br/><br/>${treasurer}</div>
          <div class="sig-box">Presidencia<br/><br/>${president}</div>
        </div>
        <script>window.onload = function() { window.print(); window.onafterprint = function() { window.close(); }; }</script>
      </body>
    </html>
  `);
  printWindow.document.close();
};

export const printAssemblyMinutes = (assembly: Assembly, members: Member[], board: BoardPosition[], config: CommitteeConfig) => {
  const quorumPercentage = Math.round((assembly.attendees.length / members.length) * 100);
  const isQuorumReached = quorumPercentage >= 50;
  const president = board.find(b => b.role === BoardRole.PRESIDENT)?.primary.name || '____________________';
  const secretary = board.find(b => b.role === BoardRole.SECRETARY)?.primary.name || '____________________';

  const attendeesListHtml = assembly.attendees.map((rut, idx) => {
    const member = members.find(m => m.rut === rut);
    return `<tr><td>${idx + 1}</td><td>${member?.name || 'Socio'}</td><td>${rut}</td><td style="border-bottom: 1px solid #333; width: 120px;"></td></tr>`;
  }).join('');

  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  printWindow.document.write(`
    <html>
      <head>
        <title>Acta ${assembly.id} - ${config.tradeName}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Crimson+Pro:wght@400;600;700&display=swap');
          body { font-family: 'Crimson Pro', serif; padding: 40px; line-height: 1.5; color: #1a1a1a; font-size: 11pt; }
          .header { text-align: center; border-bottom: 2px solid #059669; padding-bottom: 10px; margin-bottom: 20px; }
          .header h1 { margin: 0; font-size: 18pt; color: #059669; }
          .section-title { font-weight: 700; margin-top: 20px; margin-bottom: 5px; text-transform: uppercase; color: #065f46; border-bottom: 1px solid #eee; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 9pt; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          .signatures { margin-top: 40px; display: grid; grid-template-columns: 1fr 1fr; gap: 40px; }
          .sig-box { text-align: center; border-top: 1px solid #000; padding-top: 5px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${config.legalName}</h1>
          <p>RUT: ${config.rut} • Acta de Asamblea #${assembly.id}</p>
        </div>
        <p>En la ciudad de Santiago, a <strong>${assembly.date}</strong>, se reúne la asamblea en <strong>${assembly.location}</strong> para tratar: <em>${assembly.description}</em>.</p>
        <p>Quórum registrado: ${assembly.attendees.length} de ${members.length} socios (${quorumPercentage}%). Estado: ${isQuorumReached ? 'RESOLUTIVO' : 'INFORMATIVO'}.</p>
        <div class="section-title">Asistentes y Firmas</div>
        <table><thead><tr><th>#</th><th>Nombre</th><th>RUT</th><th>Firma</th></tr></thead><tbody>${attendeesListHtml}</tbody></table>
        <div class="signatures">
          <div class="sig-box">${president}<br/>Presidente</div>
          <div class="sig-box">${secretary}<br/>Secretario(a)</div>
        </div>
        <script>window.onload = function() { window.print(); window.onafterprint = function() { window.close(); }; }</script>
      </body>
    </html>
  `);
  printWindow.document.close();
};

export const printAttendanceReport = (assembly: Assembly, members: Member[], board: BoardPosition[], config: CommitteeConfig) => {
  const totalPresent = assembly.attendees.length;
  const quorumPercentage = Math.round((totalPresent / members.length) * 100);
  const secretary = board.find(b => b.role === BoardRole.SECRETARY)?.primary.name || '____________________';

  const rowsHtml = members.map((member, idx) => {
    const attended = assembly.attendees.includes(member.rut);
    return `<tr><td>${idx + 1}</td><td>${member.name}</td><td>${member.rut}</td><td>${attended ? 'PRESENTE' : 'AUSENTE'}</td></tr>`;
  }).join('');

  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  printWindow.document.write(`
    <html>
      <head>
        <title>Asistencia - ${config.tradeName}</title>
        <style>
          body { font-family: sans-serif; padding: 30px; }
          .header { text-align: center; border-bottom: 2px solid #333; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; font-size: 10pt; }
          th, td { border: 1px solid #ccc; padding: 8px; }
          th { background: #f4f4f4; }
        </style>
      </head>
      <body>
        <div class="header">
          <h2>${config.legalName}</h2>
          <p>Reporte de Asistencia: ${assembly.description} (${assembly.date})</p>
        </div>
        <p>Participación: ${totalPresent} de ${members.length} socios (${quorumPercentage}%)</p>
        <table><thead><tr><th>#</th><th>Socio</th><th>RUT</th><th>Estado</th></tr></thead><tbody>${rowsHtml}</tbody></table>
        <p style="margin-top: 30px; text-align: right; border-top: 1px solid #333; display: inline-block; float: right;">Firma Responsable: ${secretary}</p>
        <script>window.onload = function() { window.print(); window.onafterprint = function() { window.close(); }; }</script>
      </body>
    </html>
  `);
  printWindow.document.close();
};
