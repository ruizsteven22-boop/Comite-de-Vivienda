
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Member, MemberStatus, FamilyMember, Assembly, Transaction, BoardPosition, User, BoardRole, CommitteeConfig } from '../types';
import { formatRut } from '../services/utils';
import { Icons, COLORS } from '../constants';
import { printMemberFile } from '../services/printService';
import { CHILE_REGIONS } from '../services/chileData';

interface MemberManagementProps {
  members: Member[];
  setMembers: React.Dispatch<React.SetStateAction<Member[]>>;
  assemblies: Assembly[];
  transactions: Transaction[];
  board: BoardPosition[];
  viewingMemberId: string | null;
  onClearViewingMember: () => void;
  currentUser: User;
  config: CommitteeConfig;
}

const MemberManagement: React.FC<MemberManagementProps> = ({ 
  members, 
  setMembers, 
  assemblies, 
  transactions,
  board,
  viewingMemberId, 
  onClearViewingMember,
  currentUser,
  config
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<MemberStatus | 'ALL'>('ALL');
  const [isEditing, setIsEditing] = useState(false);
  const [isViewing, setIsViewing] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Partial<Member> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [showFamilyForm, setShowFamilyForm] = useState(false);
  const [newFamilyMember, setNewFamilyMember] = useState({ name: '', rut: '', relationship: '' });

  const canEdit = currentUser.role === 'SUPPORT' || 
                  currentUser.role === 'ADMINISTRATOR' || 
                  currentUser.role === BoardRole.PRESIDENT || 
                  currentUser.role === BoardRole.SECRETARY;

  useEffect(() => {
    if (viewingMemberId) {
      const member = members.find(m => m.id === viewingMemberId);
      if (member) {
        setSelectedMember(member);
        setIsViewing(true);
      }
    }
  }, [viewingMemberId, members]);

  /**
   * Función para filtrar socios dinámicamente.
   * Utiliza useMemo para optimizar el rendimiento.
   */
  const filteredMembers = useMemo(() => {
    // Normalizar término de búsqueda: quitar acentos y pasar a minúsculas
    const normalizedSearch = searchTerm
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

    // Limpiar búsqueda para comparación de RUT (solo números y K)
    const cleanSearchRut = searchTerm.replace(/[^0-9kK]/g, "").toLowerCase();

    return members.filter(m => {
      // 1. Filtro por Estado Administrativo
      const matchesStatus = statusFilter === 'ALL' || m.status === statusFilter;
      if (!matchesStatus) return false;

      // 2. Si no hay término de búsqueda, mostrar todos los que pasaron el filtro de estado
      if (!searchTerm.trim()) return true;

      // 3. Normalizar nombre del socio para búsqueda insensible a acentos
      const normalizedName = m.name
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

      // 4. Limpiar RUT del socio para comparación flexible
      const cleanMemberRut = m.rut.replace(/[^0-9kK]/g, "").toLowerCase();

      // Verificar coincidencias en Nombre o RUT
      const matchesName = normalizedName.includes(normalizedSearch);
      const matchesRut = cleanMemberRut.includes(cleanSearchRut);

      return matchesName || matchesRut;
    });
  }, [members, searchTerm, statusFilter]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember || !canEdit) return;

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
    closeModal();
  };

  const handleDeleteMember = (id: string) => {
    if (!canEdit) return;
    if (confirm("¿Está seguro de eliminar a este socio? Esta acción no se puede deshacer y borrará todo su historial.")) {
      setMembers(prev => prev.filter(m => m.id !== id));
      if (selectedMember?.id === id) closeModal();
    }
  };

  const toggleBlockMember = (id: string) => {
    if (!canEdit) return;
    setMembers(prev => prev.map(m => {
      if (m.id === id) {
        const newStatus = m.status === MemberStatus.SUSPENDED ? MemberStatus.ACTIVE : MemberStatus.SUSPENDED;
        return { ...m, status: newStatus };
      }
      return m;
    }));
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

  const handleRemovePhoto = () => {
    setSelectedMember(prev => ({ ...prev, photoUrl: '' }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const openNew = () => {
    if (!canEdit) return;
    const now = new Date();
    setSelectedMember({
      name: '',
      rut: '',
      joinDate: now.toISOString().split('T')[0],
      status: MemberStatus.ACTIVE,
      email: '',
      address: '',
      comuna: '',
      region: '',
      phone: '',
      familyMembers: [],
      photoUrl: ''
    });
    setIsEditing(true);
    setShowFamilyForm(false);
  };

  const handleAddFamilyMember = () => {
    if (!newFamilyMember.name || !newFamilyMember.rut || !newFamilyMember.relationship) return;
    const newItem: FamilyMember = { id: Date.now().toString(), ...newFamilyMember };
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

  const closeModal = () => {
    setIsEditing(false);
    setIsViewing(false);
    setSelectedMember(null);
    setShowFamilyForm(false);
    onClearViewingMember();
  };

  const handlePrint = () => {
    if (selectedMember && selectedMember.id) {
      printMemberFile(selectedMember as Member, transactions, assemblies, board, config);
    }
  };

  const handleExportCSV = () => {
    if (filteredMembers.length === 0) {
      alert("No hay socios para exportar con los filtros actuales.");
      return;
    }
    const headers = ["ID", "RUT", "Nombre", "Fecha Ingreso", "Estado", "Email", "Telefono", "Direccion", "Comuna", "Region"];
    const rows = filteredMembers.map(m => [
      m.id,
      m.rut,
      `"${m.name.replace(/"/g, '""')}"`,
      m.joinDate,
      m.status,
      `"${(m.email || "").replace(/"/g, '""')}"`,
      `"${(m.phone || "").replace(/"/g, '""')}"`,
      `"${(m.address || "").replace(/"/g, '""')}"`,
      `"${(m.comuna || "").replace(/"/g, '""')}"`,
      `"${(m.region || "").replace(/"/g, '""')}"`
    ]);
    const csvContent = [headers.join(","), ...rows.map(row => row.join(","))].join("\n");
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `nomina_socios_te_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const currentRegion = CHILE_REGIONS.find(r => r.name === selectedMember?.region);
  const communes = currentRegion ? currentRegion.communes : [];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tighter">Censo de <span className="text-teal-600">Socios</span></h2>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-2">Gestión administrativa {config.tradeName}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button 
            onClick={handleExportCSV} 
            className="bg-white border-2 border-slate-100 text-slate-700 px-6 py-4 rounded-3xl font-black text-xs uppercase tracking-widest hover:border-teal-500 transition shadow-sm flex items-center group"
          >
            <svg className="w-4 h-4 mr-2 text-slate-400 group-hover:text-teal-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Exportar CSV
          </button>
          {canEdit && (
            <button onClick={openNew} className="bg-gradient-to-r from-teal-500 to-indigo-600 hover:shadow-[0_15px_30px_-5px_rgba(20,184,166,0.3)] text-white px-8 py-4 rounded-3xl font-black transition-all active:scale-95 flex items-center justify-center uppercase text-xs tracking-widest">
              <span className="mr-3 text-xl font-light">+</span> Nuevo Registro
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-[3rem] shadow-sm border border-slate-100 overflow-hidden flex flex-col h-[700px]">
        <div className="p-10 border-b border-slate-50 bg-slate-50/50 space-y-8">
          <div className="relative group">
            <input 
              type="text" 
              placeholder="Buscar por nombre o RUT..." 
              className="w-full px-14 py-5 border-2 border-slate-100 rounded-[2rem] focus:border-teal-500 outline-none transition font-black text-slate-800 placeholder:text-slate-300 text-sm shadow-inner bg-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-teal-500 transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-4">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2">Filtrar por estado:</span>
            <button 
              onClick={() => setStatusFilter('ALL')}
              className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border-2 ${statusFilter === 'ALL' ? 'bg-teal-500 border-teal-500 text-white shadow-[0_10px_20px_-5px_rgba(20,184,166,0.3)]' : 'bg-white border-slate-100 text-slate-400 hover:border-teal-200 hover:text-teal-600'}`}
            >
              Todos
            </button>
            {Object.values(MemberStatus).map(s => (
              <button 
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border-2 ${statusFilter === s ? 'bg-teal-500 border-teal-500 text-white shadow-[0_10px_20px_-5px_rgba(20,184,166,0.3)]' : 'bg-white border-slate-100 text-slate-400 hover:border-teal-200 hover:text-teal-600'}`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/80 backdrop-blur-sm text-slate-400 text-[9px] uppercase tracking-[0.2em] font-black sticky top-0 z-10 border-b border-slate-100">
              <tr>
                <th className="px-10 py-5">Identificación del Socio</th>
                <th className="px-10 py-5">Ingreso</th>
                <th className="px-10 py-5">Estado</th>
                <th className="px-10 py-5 text-right">Gestión Administrativa</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMembers.map(member => (
                <tr key={member.id} className="hover:bg-slate-50/50 transition-all duration-300 group">
                  <td className="px-10 py-6">
                    <div className="flex items-center space-x-6">
                      <img src={member.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=14b8a6&color=fff&bold=true&size=128`} className="w-16 h-16 rounded-[1.5rem] object-cover shadow-lg border-2 border-white transition-transform group-hover:scale-105" />
                      <div>
                        <p className="font-black text-slate-900 text-base leading-tight">{member.name}</p>
                        <p className="text-[10px] text-slate-400 font-mono font-black mt-1 uppercase tracking-widest">{member.rut}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-10 py-6">
                    <p className="text-xs font-black text-slate-500 uppercase tracking-widest">{member.joinDate}</p>
                    <p className="text-[9px] text-slate-300 font-bold mt-1 uppercase">Incorporación</p>
                  </td>
                  <td className="px-10 py-6">
                    <span className={`text-[9px] font-black uppercase px-5 py-2.5 rounded-xl border-2 transition-all duration-500 shadow-sm inline-block ${
                      member.status === MemberStatus.ACTIVE ? 'bg-teal-50 text-teal-700 border-teal-100 shadow-teal-50' : 
                      member.status === MemberStatus.SUSPENDED ? 'bg-rose-50 text-rose-700 border-rose-100 shadow-rose-50' :
                      member.status === MemberStatus.PENDING ? 'bg-amber-50 text-amber-700 border-amber-100 shadow-amber-50' :
                      'bg-slate-100 text-slate-500 border-slate-200'
                    }`}>
                      {member.status}
                    </span>
                  </td>
                  <td className="px-10 py-6 text-right">
                    <div className="flex justify-end space-x-2">
                       <button onClick={() => { setSelectedMember(member); setIsViewing(true); }} className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl hover:bg-indigo-600 hover:text-white transition-all duration-300 shadow-sm" title="Ver Perfil">
                          <Icons.Users />
                       </button>
                       {canEdit && (
                         <>
                           <button onClick={() => toggleBlockMember(member.id)} className={`p-4 rounded-2xl transition-all duration-300 shadow-sm ${member.status === MemberStatus.SUSPENDED ? 'bg-amber-50 text-amber-600 hover:bg-amber-500 hover:text-white' : 'bg-slate-50 text-slate-400 hover:bg-rose-500 hover:text-white'}`} title={member.status === MemberStatus.SUSPENDED ? 'Activar Socio' : 'Bloquear Socio'}>
                             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d={member.status === MemberStatus.SUSPENDED ? "M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" : "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"} /></svg>
                           </button>
                           <button onClick={() => { setSelectedMember(member); setIsEditing(true); }} className="p-4 bg-teal-50 text-teal-600 rounded-2xl hover:bg-teal-600 hover:text-white transition-all duration-300 shadow-sm" title="Editar">
                              <Icons.Pencil />
                           </button>
                           <button onClick={() => handleDeleteMember(member.id)} className="p-4 bg-rose-50 text-rose-500 rounded-2xl hover:bg-rose-600 hover:text-white transition-all duration-300 shadow-sm" title="Eliminar">
                             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                           </button>
                         </>
                       )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredMembers.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-10 py-32 text-center">
                    <div className="w-24 h-24 rounded-[2.5rem] bg-slate-50 flex items-center justify-center mx-auto mb-6 text-slate-200 border-2 border-dashed border-slate-100">
                      <Icons.Users />
                    </div>
                    <p className="text-slate-400 font-black text-sm uppercase tracking-widest">Sin registros encontrados</p>
                    <p className="text-[10px] text-slate-300 font-bold mt-2 italic">Ajuste los filtros o inicie una búsqueda diferente.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        <div className="p-8 bg-slate-50/50 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-6">
           <div className="flex items-center space-x-4">
              <div className="p-4 bg-white rounded-2xl shadow-sm border border-slate-100">
                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">Total Censados</p>
                 <p className="text-xl font-black text-slate-800 leading-none">{filteredMembers.length} <span className="text-xs text-slate-300 font-bold">integrantes</span></p>
              </div>
              <div className="h-10 w-px bg-slate-200 hidden sm:block"></div>
              <div className="text-[10px] font-bold text-slate-400 italic">
                 Mostrando resultados según filtros aplicados
              </div>
           </div>
        </div>
      </div>

      {isEditing && selectedMember && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xl flex items-center justify-center z-[100] p-6 overflow-y-auto">
          <div className="bg-white w-full max-w-4xl rounded-[4rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 relative my-auto">
            <div className="bg-slate-900 p-12 text-white flex justify-between items-center">
              <div>
                <h3 className="text-3xl font-black tracking-tighter">{selectedMember.id ? 'Editar Expediente' : 'Nueva Incorporación'}</h3>
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em] mt-2">Registros de Comunidad {config.tradeName}</p>
              </div>
              <button onClick={closeModal} className="w-12 h-12 rounded-2xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-3xl font-light transition-all">&times;</button>
            </div>

            <form onSubmit={handleSave} className="p-12 space-y-12 max-h-[70vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                <div className="flex flex-col items-center space-y-6">
                   <div className="relative group w-full max-w-[220px]">
                      <img src={selectedMember.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedMember.name || 'S')}&background=f1f5f9&color=94a3b8&size=512`} className="w-full aspect-square rounded-[3rem] object-cover border-8 border-slate-50 shadow-2xl" />
                      <div className="absolute inset-0 bg-black/40 rounded-[3rem] opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all duration-300 backdrop-blur-[2px]">
                         <button type="button" onClick={() => fileInputRef.current?.click()} className="bg-white text-slate-900 p-3 rounded-xl shadow-lg hover:scale-110 transition active:scale-95">
                            <Icons.Pencil />
                         </button>
                      </div>
                      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handlePhotoUpload} />
                   </div>
                   {selectedMember.photoUrl && (
                     <button 
                       type="button" 
                       onClick={handleRemovePhoto}
                       className="text-[10px] font-black text-rose-500 uppercase tracking-widest hover:text-rose-700 transition"
                     >
                       Eliminar Foto
                     </button>
                   )}
                </div>

                <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-2">Nombre Completo</label>
                    <input required className="w-full px-8 py-5 border-2 border-slate-100 rounded-[2rem] focus:border-teal-500 outline-none transition font-black text-slate-900 bg-slate-50/50" value={selectedMember.name} onChange={e => setSelectedMember({...selectedMember, name: e.target.value})} placeholder="Ingrese nombre completo"/>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-2">RUT / Identificador</label>
                    <input required className="w-full px-8 py-5 border-2 border-slate-100 rounded-[2rem] focus:border-teal-500 outline-none transition font-black text-slate-900 bg-slate-50/50 font-mono" value={selectedMember.rut} onChange={e => setSelectedMember({...selectedMember, rut: formatRut(e.target.value)})} placeholder="12.345.678-9"/>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-2">Fecha de Ingreso</label>
                    <input type="date" required className="w-full px-8 py-5 border-2 border-slate-100 rounded-[2rem] focus:border-teal-500 outline-none transition font-black text-slate-900 bg-slate-50/50" value={selectedMember.joinDate} onChange={e => setSelectedMember({...selectedMember, joinDate: e.target.value})}/>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-2">Estado Administrativo</label>
                    <select className="w-full px-8 py-5 border-2 border-slate-100 rounded-[2rem] focus:border-teal-500 outline-none transition font-black text-slate-900 bg-slate-50/50 uppercase text-xs" value={selectedMember.status} onChange={e => setSelectedMember({...selectedMember, status: e.target.value as MemberStatus})}>
                      {Object.values(MemberStatus).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-2">Teléfono Movil</label>
                    <input className="w-full px-8 py-5 border-2 border-slate-100 rounded-[2rem] focus:border-teal-500 outline-none transition font-black text-slate-900 bg-slate-50/50" value={selectedMember.phone} onChange={e => setSelectedMember({...selectedMember, phone: e.target.value})} placeholder="+569..."/>
                  </div>
                </div>
              </div>

              <div className="pt-10 border-t border-slate-100 space-y-8">
                 <h4 className="text-base font-black text-slate-900 uppercase tracking-widest">Contacto y Localización</h4>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="md:col-span-2">
                       <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-2">Correo Electrónico</label>
                       <input type="email" className="w-full px-8 py-5 border-2 border-slate-100 rounded-2rem focus:border-teal-500 outline-none transition font-black text-slate-900 bg-slate-50/50" value={selectedMember.email} onChange={e => setSelectedMember({...selectedMember, email: e.target.value})} placeholder="correo@ejemplo.com"/>
                    </div>
                    <div className="md:col-span-2">
                       <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-2">Dirección Particular</label>
                       <input className="w-full px-8 py-5 border-2 border-slate-100 rounded-[2rem] focus:border-teal-500 outline-none transition font-black text-slate-900 bg-slate-50/50" value={selectedMember.address} onChange={e => setSelectedMember({...selectedMember, address: e.target.value})} placeholder="Ej: Calle Los Alerces #123"/>
                    </div>
                    <div>
                       <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-2">Región</label>
                       <select 
                        required
                        className="w-full px-8 py-5 border-2 border-slate-100 rounded-[2rem] focus:border-teal-500 outline-none transition font-black text-slate-900 bg-slate-50/50 text-xs uppercase" 
                        value={selectedMember.region || ''} 
                        onChange={e => setSelectedMember({...selectedMember, region: e.target.value, comuna: ''})}
                       >
                         <option value="">Seleccione Región...</option>
                         {CHILE_REGIONS.map(r => <option key={r.name} value={r.name}>{r.name}</option>)}
                       </select>
                    </div>
                    <div>
                       <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-2">Comuna</label>
                       <select 
                        required
                        disabled={!selectedMember.region}
                        className="w-full px-8 py-5 border-2 border-slate-100 rounded-[2rem] focus:border-teal-500 outline-none transition font-black text-slate-900 bg-slate-50/50 text-xs uppercase disabled:opacity-50" 
                        value={selectedMember.comuna || ''} 
                        onChange={e => setSelectedMember({...selectedMember, comuna: e.target.value})}
                       >
                         <option value="">{selectedMember.region ? 'Seleccione Comuna...' : 'Primero elija región'}</option>
                         {communes.map(c => <option key={c} value={c}>{c}</option>)}
                       </select>
                    </div>
                 </div>
              </div>

              <div className="pt-10 border-t border-slate-100">
                 <div className="flex justify-between items-center mb-8">
                    <h4 className="text-base font-black text-slate-900 uppercase tracking-widest">Núcleo Familiar Vinculado</h4>
                    <button type="button" onClick={() => setShowFamilyForm(true)} className="px-6 py-3 bg-teal-50 text-teal-700 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-teal-100 transition-all">+ Vincular Integrante</button>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {(selectedMember.familyMembers || []).map(fm => (
                       <div key={fm.id} className="bg-slate-50 p-6 rounded-3xl border border-slate-100 flex justify-between items-center">
                          <div>
                             <p className="text-sm font-black text-slate-800">{fm.name}</p>
                             <p className="text-[9px] text-teal-600 font-black uppercase tracking-widest">{fm.relationship}</p>
                          </div>
                          <button type="button" onClick={() => removeFamilyMember(fm.id)} className="w-10 h-10 rounded-xl bg-white text-rose-500 hover:bg-rose-50 flex items-center justify-center text-xl shadow-sm border border-slate-100">&times;</button>
                       </div>
                    ))}
                 </div>
              </div>

              <div className="flex flex-col md:flex-row justify-between items-center pt-12 border-t border-slate-100">
                {selectedMember.id ? (
                  <button type="button" onClick={() => handleDeleteMember(selectedMember.id!)} className="px-8 py-4 bg-rose-50 text-rose-600 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-rose-600 hover:text-white transition-all mb-4 md:mb-0">Eliminar Socio</button>
                ) : <div></div>}
                <div className="flex space-x-6">
                  <button type="button" onClick={closeModal} className="px-10 py-5 font-black text-slate-400 uppercase tracking-widest text-xs hover:text-slate-600">Descartar</button>
                  <button type="submit" className="px-12 py-5 bg-gradient-to-r from-teal-500 to-indigo-600 text-white rounded-[2rem] font-black shadow-2xl shadow-teal-700/30 hover:shadow-teal-700/50 transition-all uppercase text-xs tracking-widest">Guardar Cambios</button>
                </div>
              </div>
            </form>

            {showFamilyForm && (
              <div className="absolute inset-0 bg-white/95 backdrop-blur-md z-[110] flex items-center justify-center p-12 animate-in fade-in zoom-in-95">
                <div className="w-full max-w-md bg-white rounded-[3rem] shadow-2xl border border-slate-100 p-12 space-y-10">
                  <div className="text-center">
                    <h4 className="text-3xl font-black text-slate-900 tracking-tight">Vincular Familiar</h4>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Añadir integrante al grupo de {selectedMember.name || 'Socio'}</p>
                  </div>
                  <div className="space-y-6">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-2">Nombre del Familiar</label>
                      <input className="w-full px-8 py-5 border-2 border-slate-100 rounded-2xl outline-none focus:border-teal-500 font-bold bg-slate-50" value={newFamilyMember.name} onChange={e => setNewFamilyMember({...newFamilyMember, name: e.target.value})} placeholder="Nombre completo"/>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-2">RUT del Familiar</label>
                      <input className="w-full px-8 py-5 border-2 border-slate-100 rounded-2xl outline-none focus:border-teal-500 font-bold bg-slate-50 font-mono" value={newFamilyMember.rut} onChange={e => setNewFamilyMember({...newFamilyMember, rut: formatRut(e.target.value)})} placeholder="12.345.678-k"/>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-2">Vínculo de Parentesco</label>
                      <select className="w-full px-8 py-5 border-2 border-slate-100 rounded-2xl outline-none focus:border-teal-500 font-black bg-slate-50 uppercase text-xs" value={newFamilyMember.relationship} onChange={e => setNewFamilyMember({...newFamilyMember, relationship: e.target.value})}>
                        <option value="">Seleccionar...</option>
                        <option value="Hijo/a">Hijo/a</option>
                        <option value="Cónyuge">Cónyuge</option>
                        <option value="Pareja/Conviviente">Pareja/Conviviente</option>
                        <option value="Padre/Madre">Padre/Madre</option>
                        <option value="Hermano/a">Hermano/a</option>
                        <option value="Otro">Otro</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex flex-col space-y-4 pt-6">
                    <button type="button" onClick={handleAddFamilyMember} className="w-full py-5 bg-teal-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-teal-700/20 hover:bg-teal-700 transition">Confirmar Vinculación</button>
                    <button type="button" onClick={() => setShowFamilyForm(false)} className="w-full py-5 bg-slate-50 text-slate-400 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-slate-100 transition">Cancelar</button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {isViewing && selectedMember && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xl flex items-center justify-center z-[100] p-6">
          <div className="bg-white w-full max-w-4xl rounded-[4rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
            <div className="bg-teal-600 p-10 text-white flex justify-between items-center">
               <div className="flex items-center space-x-6">
                  <img src={selectedMember.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedMember.name || 'S')}&background=fff&color=14b8a6&bold=true&size=128`} className="w-20 h-20 rounded-[2rem] object-cover shadow-lg border-2 border-white/20" />
                  <div>
                    <h3 className="text-3xl font-black tracking-tighter leading-none">{selectedMember.name}</h3>
                    <p className="text-teal-100 text-[10px] font-black uppercase tracking-widest mt-2">Socio Folio #{selectedMember.id}</p>
                  </div>
               </div>
               <button onClick={closeModal} className="w-12 h-12 rounded-2xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-3xl font-light transition-all">&times;</button>
            </div>

            <div className="flex-1 overflow-y-auto p-12">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-8">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Información de Perfil</h4>
                    <div className="grid grid-cols-2 gap-y-6 gap-x-8 text-sm">
                       <div><p className="text-slate-400 font-bold uppercase text-[9px] mb-1 tracking-widest">RUT / ID</p><p className="font-black text-slate-800">{selectedMember.rut}</p></div>
                       <div><p className="text-slate-400 font-bold uppercase text-[9px] mb-1 tracking-widest">Ingreso</p><p className="font-black text-slate-800">{selectedMember.joinDate}</p></div>
                       <div><p className="text-slate-400 font-bold uppercase text-[9px] mb-1 tracking-widest">Estatus</p><span className="font-black text-teal-600 uppercase tracking-widest text-xs">{selectedMember.status}</span></div>
                       <div><p className="text-slate-400 font-bold uppercase text-[9px] mb-1 tracking-widest">Teléfono</p><p className="font-black text-slate-800">{selectedMember.phone || 'N/A'}</p></div>
                       <div className="col-span-2"><p className="text-slate-400 font-bold uppercase text-[9px] mb-1 tracking-widest">Email Corporativo/Personal</p><p className="font-black text-slate-800">{selectedMember.email || 'No registrado'}</p></div>
                       <div className="col-span-2"><p className="text-slate-400 font-bold uppercase text-[9px] mb-1 tracking-widest">Domicilio Completo</p><p className="font-black text-slate-800 leading-tight">{selectedMember.address || 'Sin dirección'}{selectedMember.comuna ? `, ${selectedMember.comuna}` : ''}{selectedMember.region ? `, ${selectedMember.region}` : ''}</p></div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Núcleo Familiar</h4>
                    <div className="space-y-3">
                       {selectedMember.familyMembers?.map(fm => (
                         <div key={fm.id} className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                           <p className="font-black text-slate-800 text-sm leading-none mb-1.5">{fm.name}</p>
                           <p className="text-[9px] text-teal-600 font-black uppercase tracking-widest">{fm.relationship} • {fm.rut}</p>
                         </div>
                       ))}
                       {(!selectedMember.familyMembers || selectedMember.familyMembers.length === 0) && (
                         <div className="py-10 text-center bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-100">
                           <p className="text-xs text-slate-400 italic font-bold">Sin familiares registrados.</p>
                         </div>
                       )}
                    </div>
                  </div>
               </div>
            </div>

            <div className="p-8 border-t border-slate-100 bg-slate-50/50 flex justify-end space-x-4">
               {canEdit && (
                 <button onClick={() => toggleBlockMember(selectedMember.id!)} className={`px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition shadow-xl ${selectedMember.status === MemberStatus.SUSPENDED ? 'bg-teal-100 text-teal-700 hover:bg-teal-600 hover:text-white' : 'bg-rose-100 text-rose-700 hover:bg-rose-600 hover:text-white'}`}>
                   {selectedMember.status === MemberStatus.SUSPENDED ? 'Activar Socio' : 'Bloquear Socio'}
                 </button>
               )}
               <button onClick={handlePrint} className="px-8 py-3 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-black transition shadow-xl">Imprimir Ficha</button>
               {canEdit && (
                 <button onClick={() => { setIsViewing(false); setIsEditing(true); }} className="px-8 py-3 bg-teal-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-teal-700 transition">Editar Datos</button>
               )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MemberManagement;
