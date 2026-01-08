
import React, { useState, useRef, useEffect } from 'react';
import { Member, MemberStatus, FamilyMember, Assembly, AssemblyStatus } from '../types';
import { formatRut } from '../services/utils';

interface MemberManagementProps {
  members: Member[];
  setMembers: React.Dispatch<React.SetStateAction<Member[]>>;
  assemblies: Assembly[];
  viewingMemberId: string | null;
  onClearViewingMember: () => void;
}

const MemberManagement: React.FC<MemberManagementProps> = ({ members, setMembers, assemblies, viewingMemberId, onClearViewingMember }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<MemberStatus | 'ALL'>('ALL');
  const [isEditing, setIsEditing] = useState(false);
  const [isViewing, setIsViewing] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Partial<Member> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Estados para el nuevo integrante familiar
  const [showFamilyForm, setShowFamilyForm] = useState(false);
  const [newFamilyMember, setNewFamilyMember] = useState({ name: '', rut: '', relationship: '' });

  // Efecto para manejar la visualización directa desde otros módulos
  useEffect(() => {
    if (viewingMemberId) {
      const member = members.find(m => m.id === viewingMemberId);
      if (member) {
        setSelectedMember(member);
        setIsViewing(true);
      }
    }
  }, [viewingMemberId, members]);

  const filteredMembers = members.filter(m => {
    const matchesSearch = m.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         m.rut.includes(searchTerm);
    const matchesStatus = statusFilter === 'ALL' || m.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember) return;

    if (selectedMember.id) {
      setMembers(prev => prev.map(m => m.id === selectedMember.id ? selectedMember as Member : m));
    } else {
      const newMember = { 
        ...selectedMember, 
        id: Date.now().toString(), 
        familyMembers: selectedMember.familyMembers || [] 
      } as Member;
      setMembers(prev => [...prev, newMember]);
    }
    setIsEditing(false);
    setSelectedMember(null);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedMember(prev => ({ ...prev, photoUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const openNew = () => {
    setSelectedMember({
      name: '',
      rut: '',
      joinDate: new Date().toISOString().split('T')[0],
      status: MemberStatus.ACTIVE,
      email: '',
      address: '',
      phone: '',
      familyMembers: [],
      photoUrl: ''
    });
    setIsEditing(true);
    setShowFamilyForm(false);
  };

  const handleAddFamilyMember = () => {
    if (!newFamilyMember.name || !newFamilyMember.rut || !newFamilyMember.relationship) {
      alert("Por favor complete todos los campos del integrante.");
      return;
    }

    const newItem: FamilyMember = {
      id: Date.now().toString(),
      ...newFamilyMember
    };

    setSelectedMember(prev => ({
      ...prev,
      familyMembers: [...(prev?.familyMembers || []), newItem]
    }));

    setNewFamilyMember({ name: '', rut: '', relationship: '' });
    setShowFamilyForm(false);
  };

  const removeFamilyMember = (id: string) => {
    setSelectedMember(prev => ({
      ...prev,
      familyMembers: (prev?.familyMembers || []).filter(fm => fm.id !== id)
    }));
  };

  const handlePrintMemberFile = (member: Member) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const familyHtml = member.familyMembers.length > 0 
      ? member.familyMembers.map(fm => `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${fm.name}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${fm.rut}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${fm.relationship}</td>
        </tr>
      `).join('')
      : '<tr><td colspan="3" style="padding: 8px; text-align: center; color: #666;">Sin cargas familiares registradas</td></tr>';

    const photoHtml = member.photoUrl 
      ? `<img src="${member.photoUrl}" style="width: 100px; height: 120px; object-fit: cover; border: 1px solid #ccc; padding: 2px;">`
      : `<div style="width: 100px; height: 120px; border: 1px dashed #ccc; display: flex; align-items: center; justify-content: center; font-size: 10px; color: #999; text-align: center;">SIN FOTO<br />TIPO CARNET</div>`;

    printWindow.document.write(`
      <html>
        <head>
          <title>Ficha de Socio - ${member.name}</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #333; }
            .header { border-bottom: 3px solid #059669; padding-bottom: 10px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: center; }
            .header h1 { margin: 0; color: #059669; font-size: 24px; }
            .header p { margin: 5px 0; color: #666; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; }
            .section { margin-bottom: 25px; }
            .section-title { background: #f0fdf4; padding: 8px 15px; font-weight: bold; color: #065f46; border-left: 4px solid #059669; margin-bottom: 15px; text-transform: uppercase; font-size: 12px; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
            .field { margin-bottom: 10px; }
            .label { font-size: 11px; color: #666; font-weight: bold; text-transform: uppercase; display: block; }
            .value { font-size: 15px; border-bottom: 1px solid #eee; padding-bottom: 2px; display: block; margin-top: 3px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 14px; }
            th { text-align: left; background: #f9fafb; padding: 8px; color: #666; font-size: 11px; text-transform: uppercase; }
            .signature-area { margin-top: 80px; display: flex; justify-content: space-around; }
            .signature-box { text-align: center; width: 200px; border-top: 1px solid #333; padding-top: 10px; font-size: 12px; }
            .photo-box { text-align: right; }
            @media print {
              .no-print { display: none; }
              body { padding: 20px; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h1>Comité Tierra Esperanza</h1>
              <p>Ficha Oficial de Incorporación de Socio</p>
            </div>
            <div class="photo-box">
              ${photoHtml}
            </div>
          </div>

          <div style="text-align: right; font-size: 10px; color: #666; margin-bottom: 10px;">
            Folio: #S${member.id} | Fecha Impresión: ${new Date().toLocaleDateString()}
          </div>

          <div class="section">
            <div class="section-title">Datos Personales del Socio</div>
            <div class="grid">
              <div class="field"><span class="label">Nombre Completo</span><span class="value">${member.name}</span></div>
              <div class="field"><span class="label">RUT</span><span class="value">${member.rut}</span></div>
              <div class="field"><span class="label">Fecha de Ingreso</span><span class="value">${member.joinDate}</span></div>
              <div class="field"><span class="label">Condición de Socio</span><span class="value">${member.status}</span></div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Información de Contacto y Vivienda</div>
            <div class="grid">
              <div class="field"><span class="label">Correo Electrónico</span><span class="value">${member.email}</span></div>
              <div class="field"><span class="label">Celular / WhatsApp</span><span class="value">${member.phone}</span></div>
              <div class="field" style="grid-column: span 2;"><span class="label">Dirección Particular</span><span class="value">${member.address}</span></div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Núcleo Familiar Registrado</div>
            <table>
              <thead>
                <tr>
                  <th>Nombre Completo</th>
                  <th>RUT</th>
                  <th>Parentesco / Relación</th>
                </tr>
              </thead>
              <tbody>
                ${familyHtml}
              </tbody>
            </table>
          </div>

          <div class="section" style="margin-top: 40px; font-size: 11px; color: #666; line-height: 1.5;">
            <p><strong>Declaración Jurada:</strong> Declaro bajo juramento que los datos proporcionados en este documento son fidedignos y me comprometo a cumplir con los estatutos y reglamentos internos del Comité de Vivienda Tierra Esperanza.</p>
          </div>

          <div class="signature-area">
            <div class="signature-box">Firma del Socio</div>
            <div class="signature-box">Firma y Timbre Directiva</div>
          </div>

          <script>
            window.onload = function() { window.print(); window.onafterprint = function() { window.close(); }; }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const getAttendanceHistory = (memberRut: string) => {
    return assemblies
      .filter(a => a.status === AssemblyStatus.FINISHED)
      .map(a => ({
        id: a.id,
        date: a.date,
        description: a.description,
        attended: a.attendees.includes(memberRut)
      }));
  };

  const handleViewFile = (member: Member) => {
    setSelectedMember(member);
    setIsViewing(true);
  };

  const closeViewing = () => {
    setIsViewing(false);
    onClearViewingMember();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Socios del Comité</h2>
          <p className="text-slate-500">Gestión de integrantes y sus grupos familiares</p>
        </div>
        <button 
          onClick={openNew}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-xl font-semibold transition shadow-md flex items-center justify-center"
        >
          <span className="mr-2">+</span> Nuevo Socio
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input 
              type="text" 
              placeholder="Buscar por nombre o RUT..." 
              className="w-full max-w-md px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(formatRut(e.target.value))}
            />
          </div>
          <div className="w-full md:w-auto">
            <select 
              className="w-full md:w-48 px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white font-medium text-slate-700"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as MemberStatus | 'ALL')}
            >
              <option value="ALL">Todos los estados</option>
              {Object.values(MemberStatus).map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider font-semibold">
              <tr>
                <th className="px-6 py-4">Socio</th>
                <th className="px-6 py-4">RUT</th>
                <th className="px-6 py-4">Ingreso</th>
                <th className="px-6 py-4">Estado</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMembers.map(member => (
                <tr key={member.id} className="hover:bg-slate-50/50 transition group">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <img 
                        src={member.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=10b981&color=fff`} 
                        alt={member.name} 
                        className="w-10 h-10 rounded-full border border-slate-200 object-cover" 
                      />
                      <div>
                        <p className="font-semibold text-slate-800">{member.name}</p>
                        <p className="text-xs text-slate-400">{member.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-600 text-sm font-mono">{member.rut}</td>
                  <td className="px-6 py-4 text-slate-600 text-sm">{member.joinDate}</td>
                  <td className="px-6 py-4">
                    <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full ${
                      member.status === MemberStatus.ACTIVE ? 'bg-emerald-100 text-emerald-700' : 
                      member.status === MemberStatus.INACTIVE ? 'bg-slate-100 text-slate-600' : 
                      member.status === MemberStatus.PENDING ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {member.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end space-x-2 opacity-0 group-hover:opacity-100 transition">
                      <button 
                        onClick={() => handleViewFile(member)}
                        className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                        title="Ver Ficha en Pantalla"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                      </button>
                      <button 
                        onClick={() => handlePrintMemberFile(member)}
                        className="p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
                        title="Imprimir Ficha"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                      </button>
                      <button 
                        onClick={() => { setSelectedMember(member); setIsEditing(true); setShowFamilyForm(false); }}
                        className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                        title="Editar Socio"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredMembers.length === 0 && (
            <div className="py-20 text-center text-slate-400">
              <p>No se encontraron socios que coincidan con la búsqueda o el filtro.</p>
            </div>
          )}
        </div>
      </div>

      {/* MODAL: Visualización de Ficha de Socio */}
      {isViewing && selectedMember && (
        <div className="fixed inset-0 bg-slate-900/70 flex items-center justify-center p-4 z-[60] backdrop-blur-md">
          <div className="bg-slate-50 rounded-[40px] shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col border border-white animate-in zoom-in-95 duration-200">
            {/* Cabecera Modal */}
            <div className="bg-emerald-800 p-8 text-white flex justify-between items-start">
              <div className="flex items-center space-x-6">
                <div className="w-24 h-32 bg-white rounded-xl shadow-lg border-2 border-emerald-600 overflow-hidden flex-shrink-0">
                  {selectedMember.photoUrl ? (
                    <img src={selectedMember.photoUrl} alt={selectedMember.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-emerald-100 text-emerald-800 font-bold text-xs text-center">SIN FOTO</div>
                  )}
                </div>
                <div>
                  <h3 className="text-3xl font-black tracking-tight">{selectedMember.name}</h3>
                  <div className="flex items-center space-x-4 mt-2">
                    <span className="text-emerald-200 font-mono text-lg">{selectedMember.rut}</span>
                    <span className="px-3 py-1 bg-emerald-700/50 rounded-full text-xs font-bold uppercase tracking-wider border border-emerald-600">ID: #{selectedMember.id}</span>
                  </div>
                </div>
              </div>
              <button onClick={closeViewing} className="bg-white/10 hover:bg-white/20 p-2 rounded-full transition">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            {/* Cuerpo Modal Scrollable */}
            <div className="flex-1 overflow-y-auto p-10 space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                {/* Sección Datos Principales */}
                <div className="space-y-6">
                  <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                    Información Personal
                  </h4>
                  <div className="space-y-4">
                    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Condición de Socio</p>
                      <p className="text-lg font-bold text-slate-800">{selectedMember.status}</p>
                    </div>
                    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Fecha de Incorporación</p>
                      <p className="text-lg font-bold text-slate-800">{selectedMember.joinDate}</p>
                    </div>
                  </div>
                </div>

                {/* Sección Contacto */}
                <div className="space-y-6">
                  <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                    Contacto y Ubicación
                  </h4>
                  <div className="space-y-4">
                    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Correo Electrónico</p>
                      <p className="text-lg font-bold text-slate-800">{selectedMember.email}</p>
                    </div>
                    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Teléfono / Celular</p>
                      <p className="text-lg font-bold text-slate-800">{selectedMember.phone}</p>
                    </div>
                    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm md:col-span-2">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Dirección Registrada</p>
                      <p className="text-lg font-bold text-slate-800">{selectedMember.address}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sección Núcleo Familiar */}
              <div className="space-y-6">
                <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                  Núcleo Familiar Registrado
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {selectedMember.familyMembers && selectedMember.familyMembers.length > 0 ? (
                    selectedMember.familyMembers.map(fm => (
                      <div key={fm.id} className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm hover:border-emerald-200 transition">
                        <p className="font-bold text-slate-800">{fm.name}</p>
                        <p className="text-xs text-slate-500 font-mono mt-1">{fm.rut}</p>
                        <p className="mt-2 text-[10px] font-black bg-slate-100 text-slate-600 px-2 py-0.5 rounded uppercase w-fit">{fm.relationship}</p>
                      </div>
                    ))
                  ) : (
                    <div className="col-span-full py-6 text-center bg-slate-100 rounded-3xl border-2 border-dashed border-slate-200">
                      <p className="text-slate-400 font-medium">No registra cargas familiares habilitadas.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Sección Historial Asistencia */}
              <div className="space-y-6">
                <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
                  Historial de Asistencias a Asambleas
                </h4>
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                   {getAttendanceHistory(selectedMember.rut || '').length > 0 ? (
                     <div className="divide-y divide-slate-100">
                        {getAttendanceHistory(selectedMember.rut || '').map(history => (
                          <div key={history.id} className="p-4 flex justify-between items-center hover:bg-slate-50 transition">
                            <div>
                              <p className="font-bold text-slate-800 text-sm">{history.description}</p>
                              <p className="text-[10px] text-slate-400 uppercase">{history.date}</p>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${history.attended ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                              {history.attended ? 'Presente' : 'Ausente'}
                            </span>
                          </div>
                        ))}
                     </div>
                   ) : (
                    <div className="p-8 text-center text-slate-400 text-sm italic">Sin registros de asambleas finalizadas.</div>
                   )}
                </div>
              </div>
            </div>

            {/* Pie Modal Acciones */}
            <div className="p-8 bg-white border-t border-slate-200 flex justify-between items-center">
              <div className="flex space-x-3">
                <button 
                  onClick={() => handlePrintMemberFile(selectedMember as Member)}
                  className="bg-slate-800 text-white px-6 py-3 rounded-2xl font-bold flex items-center transition hover:bg-slate-700"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                  Imprimir Ficha
                </button>
                <button 
                   onClick={() => { setIsViewing(false); setIsEditing(true); }}
                   className="bg-emerald-100 text-emerald-700 px-6 py-3 rounded-2xl font-bold transition hover:bg-emerald-200"
                >Modificar Datos</button>
              </div>
              <button 
                onClick={closeViewing}
                className="text-slate-400 font-bold hover:text-slate-600"
              >Cerrar Vista</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Edición/Creación */}
      {isEditing && selectedMember && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-8">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center space-x-4">
                  <h3 className="text-2xl font-bold text-slate-800">{selectedMember.id ? 'Perfil del Socio' : 'Nuevo Socio'}</h3>
                  {selectedMember.id && (
                    <button 
                      type="button"
                      onClick={() => handlePrintMemberFile(selectedMember as Member)}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center transition"
                    >
                      <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                      Imprimir Ficha
                    </button>
                  )}
                </div>
                <button onClick={() => setIsEditing(false)} className="text-slate-400 hover:text-slate-600 text-2xl">&times;</button>
              </div>
              
              <form onSubmit={handleSave} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  {/* Foto tipo carnet section */}
                  <div className="md:col-span-1 flex flex-col items-center space-y-4">
                    <label className="block text-sm font-medium text-slate-700">Foto Socio (Carnet)</label>
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="w-32 h-40 bg-slate-100 rounded-lg border-2 border-dashed border-slate-300 flex flex-col items-center justify-center cursor-pointer hover:border-emerald-500 transition overflow-hidden relative group"
                    >
                      {selectedMember.photoUrl ? (
                        <>
                          <img src={selectedMember.photoUrl} alt="Socio" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                            <span className="text-white text-xs font-bold">Cambiar Foto</span>
                          </div>
                        </>
                      ) : (
                        <div className="text-center p-2">
                          <svg className="w-8 h-8 mx-auto text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                          <span className="text-[10px] text-slate-400 mt-2 block">Clic para subir<br />(2x2 / Carnet)</span>
                        </div>
                      )}
                    </div>
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      ref={fileInputRef}
                      onChange={handlePhotoUpload}
                    />
                  </div>

                  {/* Resto de campos */}
                  <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Nombre Completo</label>
                      <input 
                        required
                        type="text" 
                        className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-bold"
                        value={selectedMember.name}
                        onChange={e => setSelectedMember({...selectedMember, name: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">RUT</label>
                      <input 
                        required
                        type="text" 
                        placeholder="12.345.678-9"
                        className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-mono font-bold"
                        value={selectedMember.rut}
                        onChange={e => setSelectedMember({...selectedMember, rut: formatRut(e.target.value)})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Correo Electrónico</label>
                      <input 
                        required
                        type="email" 
                        className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                        value={selectedMember.email}
                        onChange={e => setSelectedMember({...selectedMember, email: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Celular</label>
                      <input 
                        required
                        type="tel" 
                        placeholder="+569..."
                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                        value={selectedMember.phone}
                        onChange={e => setSelectedMember({...selectedMember, phone: e.target.value})}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-slate-700 mb-1">Dirección</label>
                      <input 
                        required
                        type="text" 
                        className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                        value={selectedMember.address}
                        onChange={e => setSelectedMember({...selectedMember, address: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Estado</label>
                      <select 
                        className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                        value={selectedMember.status}
                        onChange={e => setSelectedMember({...selectedMember, status: e.target.value as MemberStatus})}
                      >
                        {Object.values(MemberStatus).map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Fecha Ingreso</label>
                      <input 
                        type="date" 
                        className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                        value={selectedMember.joinDate}
                        onChange={e => setSelectedMember({...selectedMember, joinDate: e.target.value})}
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Sección Núcleo Familiar */}
                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 h-fit">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="text-lg font-black text-slate-700 uppercase tracking-tight">Núcleo Familiar</h4>
                      {!showFamilyForm && (
                        <button 
                          type="button"
                          onClick={() => setShowFamilyForm(true)}
                          className="text-emerald-600 hover:text-emerald-700 font-bold text-xs bg-white px-3 py-1.5 rounded-lg border border-slate-200"
                        >+ Agregar</button>
                      )}
                    </div>
                    
                    <div className="space-y-3">
                      {showFamilyForm && (
                        <div className="bg-white p-4 rounded-xl border border-emerald-200 shadow-sm space-y-4 animate-in fade-in slide-in-from-top-2">
                          <input 
                            placeholder="Nombre Completo"
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none"
                            value={newFamilyMember.name}
                            onChange={e => setNewFamilyMember({...newFamilyMember, name: e.target.value})}
                          />
                          <div className="grid grid-cols-2 gap-2">
                            <input 
                              placeholder="RUT"
                              className="px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono outline-none"
                              value={newFamilyMember.rut}
                              onChange={e => setNewFamilyMember({...newFamilyMember, rut: formatRut(e.target.value)})}
                            />
                            <input 
                              placeholder="Parentesco"
                              className="px-3 py-2 border border-slate-200 rounded-lg text-sm outline-none"
                              value={newFamilyMember.relationship}
                              onChange={e => setNewFamilyMember({...newFamilyMember, relationship: e.target.value})}
                            />
                          </div>
                          <div className="flex justify-end space-x-2">
                            <button type="button" onClick={() => setShowFamilyForm(false)} className="text-xs text-slate-400 font-bold">Cancelar</button>
                            <button type="button" onClick={handleAddFamilyMember} className="bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold">Añadir</button>
                          </div>
                        </div>
                      )}

                      {selectedMember.familyMembers && selectedMember.familyMembers.length > 0 ? (
                        selectedMember.familyMembers.map((fm) => (
                          <div key={fm.id} className="flex justify-between items-center bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                            <div>
                              <p className="font-bold text-slate-700 text-sm">{fm.name}</p>
                              <p className="text-[10px] text-slate-400">{fm.relationship} • <span className="font-mono">{fm.rut}</span></p>
                            </div>
                            <button type="button" onClick={() => removeFamilyMember(fm.id)} className="text-red-400 hover:text-red-600 font-bold text-xs p-2">&times;</button>
                          </div>
                        ))
                      ) : (
                        !showFamilyForm && <p className="text-slate-400 text-xs text-center py-4">Sin cargas familiares.</p>
                      )}
                    </div>
                  </div>

                  {/* NUEVA SECCIÓN: Historial de Asistencias */}
                  <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 flex flex-col h-fit">
                    <h4 className="text-lg font-black text-emerald-400 uppercase tracking-tight mb-4">Historial de Asistencias</h4>
                    
                    <div className="space-y-3">
                      {selectedMember.rut ? (
                        getAttendanceHistory(selectedMember.rut).length > 0 ? (
                          getAttendanceHistory(selectedMember.rut).map((history) => (
                            <div key={history.id} className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex justify-between items-start">
                              <div className="space-y-1">
                                <p className="text-white font-bold text-sm leading-tight">{history.description}</p>
                                <p className="text-[10px] text-slate-400 uppercase tracking-wider">{history.date}</p>
                                {!history.attended && (
                                  <p className="text-[10px] font-black text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 w-fit mt-1 italic">
                                    ⚠️ Observación: Multa por Inasistencia a Asamblea
                                  </p>
                                )}
                              </div>
                              <div className="flex flex-col items-end">
                                <span className={`text-[10px] font-black px-2 py-1 rounded-md border ${
                                  history.attended 
                                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                                    : 'bg-red-500/10 text-red-400 border-red-500/30'
                                }`}>
                                  {history.attended ? 'PRESENTE' : 'AUSENTE'}
                                </span>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="py-10 text-center border-2 border-dashed border-slate-800 rounded-2xl">
                             <p className="text-slate-500 text-xs font-medium">No hay registros de asambleas finalizadas.</p>
                          </div>
                        )
                      ) : (
                        <p className="text-slate-500 text-xs text-center py-4 italic">Ingrese el RUT para calcular el historial.</p>
                      )}
                    </div>

                    {selectedMember.rut && getAttendanceHistory(selectedMember.rut).some(h => !h.attended) && (
                      <div className="mt-6 p-4 bg-amber-900/20 rounded-xl border border-amber-900/30">
                        <p className="text-amber-500 text-xs font-bold flex items-start">
                           <span className="mr-2">💡</span>
                           Aviso de Administración: Este socio registra deudas por inasistencia. Favor regularizar en Tesorería.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-end space-x-4 pt-6">
                  <button 
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-6 py-2 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition font-medium"
                  >Cancelar</button>
                  <button 
                    type="submit"
                    className="px-10 py-3 bg-emerald-600 text-white rounded-2xl font-black shadow-xl shadow-emerald-600/20 hover:bg-emerald-700 transition"
                  >
                    {selectedMember.id ? 'GUARDAR CAMBIOS' : 'CREAR SOCIO'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MemberManagement;
