
import React, { useState, useRef, useEffect } from 'react';
import { Member, MemberStatus, FamilyMember, Assembly, Transaction, BoardPosition, User, BoardRole, CommitteeConfig } from '../types';
import { formatRut } from '../services/utils';
import { Icons } from '../constants';
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
  const [viewTab, setViewTab] = useState<'perfil' | 'familia' | 'historial'>('perfil');
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
        setViewTab('perfil');
      }
    }
  }, [viewingMemberId, members]);

  const filteredMembers = members.filter(m => {
    const searchLower = searchTerm.toLowerCase();
    const cleanSearch = searchTerm.replace(/[^0-9kK]/g, '').toLowerCase();
    const cleanMemberRut = m.rut.replace(/[^0-9kK]/g, '').toLowerCase();

    return (m.name.toLowerCase().includes(searchLower) || m.rut.toLowerCase().includes(searchLower) || (cleanSearch.length > 0 && cleanMemberRut.includes(cleanSearch))) && (statusFilter === 'ALL' || m.status === statusFilter);
  });

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
    if (confirm("¿Está seguro de eliminar a este socio? Esta acción no se puede deshacer.")) {
      setMembers(prev => prev.filter(m => m.id !== id));
      closeModal();
    }
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
    if (!canEdit) return;
    setSelectedMember({
      name: '',
      rut: '',
      joinDate: new Date().toISOString().split('T')[0],
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

  const currentRegion = CHILE_REGIONS.find(r => r.name === selectedMember?.region);
  const communes = currentRegion ? currentRegion.communes : [];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Censo de Socios</h2>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-1">Gestión administrativa {config.tradeName}</p>
        </div>
        {canEdit && (
          <button onClick={openNew} className="bg-emerald-700 hover:bg-emerald-800 text-white px-8 py-4 rounded-3xl font-black transition-all shadow-xl shadow-emerald-900/20 active:scale-95 flex items-center justify-center uppercase text-xs tracking-widest">
            <span className="mr-3 text-xl font-light">+</span> Nuevo Registro
          </button>
        )}
      </div>

      <div className="bg-white rounded-[3rem] shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row gap-4 bg-slate-50/50">
          <input 
            type="text" 
            placeholder="Buscar por nombre o RUT..." 
            className="flex-1 px-8 py-4 border-2 border-slate-200 rounded-2xl focus:border-emerald-600 outline-none transition font-bold text-slate-800 placeholder:text-slate-400 text-sm shadow-inner"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <select 
            className="w-full md:w-64 px-6 py-4 border-2 border-slate-200 rounded-2xl focus:border-emerald-600 outline-none bg-white font-black text-slate-600 uppercase text-[10px] tracking-widest shadow-inner"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
          >
            <option value="ALL">Todos los Estados</option>
            {Object.values(MemberStatus).map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-400 text-[9px] uppercase tracking-[0.2em] font-black">
              <tr>
                <th className="px-10 py-5">Identificación del Socio</th>
                <th className="px-10 py-5">Ingreso</th>
                <th className="px-10 py-5">Estado</th>
                <th className="px-10 py-5 text-right">Gestión</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMembers.map(member => (
                <tr key={member.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-10 py-6">
                    <div className="flex items-center space-x-6">
                      <img src={member.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=047857&color=fff&bold=true&size=128`} className="w-14 h-14 rounded-2xl object-cover shadow-lg border-2 border-white" />
                      <div>
                        <p className="font-black text-slate-900 text-base">{member.name}</p>
                        <p className="text-[10px] text-slate-400 font-mono font-bold mt-0.5">{member.rut}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-10 py-6">
                    <span className="text-sm font-black text-slate-600">{member.joinDate}</span>
                  </td>
                  <td className="px-10 py-6">
                    <span className={`text-[9px] font-black uppercase px-4 py-2 rounded-xl border-2 ${member.status === MemberStatus.ACTIVE ? 'bg-emerald-50 text-emerald-800 border-emerald-100' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                      {member.status}
                    </span>
                  </td>
                  <td className="px-10 py-6 text-right">
                    <div className="flex justify-end space-x-2">
                       <button onClick={() => { setSelectedMember(member); setIsViewing(true); }} className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl hover:bg-indigo-100 transition shadow-sm"><Icons.Users /></button>
                       {canEdit && (
                         <button onClick={() => { setSelectedMember(member); setIsEditing(true); }} className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl hover:bg-emerald-100 transition shadow-sm"><Icons.Pencil /></button>
                       )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Edición */}
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
                <div className="flex flex-col items-center">
                   <div className="relative group w-full max-w-[220px]">
                      <img src={selectedMember.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedMember.name || 'S')}&background=f1f5f9&color=94a3b8&size=512`} className="w-full aspect-square rounded-[3rem] object-cover border-8 border-slate-50 shadow-2xl" />
                      <button type="button" onClick={() => fileInputRef.current?.click()} className="absolute inset-0 bg-black/60 rounded-[3rem] opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-all duration-300 backdrop-blur-sm">
                        <span className="text-white text-[9px] font-black uppercase tracking-widest text-center px-4">Cambiar Foto de Perfil</span>
                      </button>
                      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handlePhotoUpload} />
                   </div>
                </div>

                <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-2">Nombre Completo</label>
                    <input required className="w-full px-8 py-5 border-2 border-slate-100 rounded-[2rem] focus:border-emerald-600 outline-none transition font-black text-slate-900 bg-slate-50/50" value={selectedMember.name} onChange={e => setSelectedMember({...selectedMember, name: e.target.value})} placeholder="Ingrese nombre completo"/>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-2">RUT / Identificador</label>
                    <input required className="w-full px-8 py-5 border-2 border-slate-100 rounded-[2rem] focus:border-emerald-600 outline-none transition font-black text-slate-900 bg-slate-50/50 font-mono" value={selectedMember.rut} onChange={e => setSelectedMember({...selectedMember, rut: formatRut(e.target.value)})} placeholder="12.345.678-9"/>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-2">Fecha de Ingreso</label>
                    <input type="date" required className="w-full px-8 py-5 border-2 border-slate-100 rounded-[2rem] focus:border-emerald-600 outline-none transition font-black text-slate-900 bg-slate-50/50" value={selectedMember.joinDate} onChange={e => setSelectedMember({...selectedMember, joinDate: e.target.value})}/>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-2">Estado</label>
                    <select className="w-full px-8 py-5 border-2 border-slate-100 rounded-[2rem] focus:border-emerald-600 outline-none transition font-black text-slate-900 bg-slate-50/50 uppercase text-xs" value={selectedMember.status} onChange={e => setSelectedMember({...selectedMember, status: e.target.value as MemberStatus})}>
                      {Object.values(MemberStatus).map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-2">Teléfono</label>
                    <input className="w-full px-8 py-5 border-2 border-slate-100 rounded-[2rem] focus:border-emerald-600 outline-none transition font-black text-slate-900 bg-slate-50/50" value={selectedMember.phone} onChange={e => setSelectedMember({...selectedMember, phone: e.target.value})} placeholder="+569..."/>
                  </div>
                </div>
              </div>

              <div className="pt-10 border-t border-slate-100 space-y-8">
                 <h4 className="text-base font-black text-slate-900 uppercase tracking-widest">Contacto y Localización</h4>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="md:col-span-2">
                       <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-2">Correo Electrónico</label>
                       <input type="email" className="w-full px-8 py-5 border-2 border-slate-100 rounded-[2rem] focus:border-emerald-600 outline-none transition font-black text-slate-900 bg-slate-50/50" value={selectedMember.email} onChange={e => setSelectedMember({...selectedMember, email: e.target.value})} placeholder="correo@ejemplo.com"/>
                    </div>
                    <div className="md:col-span-2">
                       <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-2">Dirección Particular</label>
                       <input className="w-full px-8 py-5 border-2 border-slate-100 rounded-[2rem] focus:border-emerald-600 outline-none transition font-black text-slate-900 bg-slate-50/50" value={selectedMember.address} onChange={e => setSelectedMember({...selectedMember, address: e.target.value})} placeholder="Ej: Calle Los Alerces #123"/>
                    </div>
                    <div>
                       <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-2">Región</label>
                       <select 
                        required
                        className="w-full px-8 py-5 border-2 border-slate-100 rounded-[2rem] focus:border-emerald-600 outline-none transition font-black text-slate-900 bg-slate-50/50 text-xs uppercase" 
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
                        className="w-full px-8 py-5 border-2 border-slate-100 rounded-[2rem] focus:border-emerald-600 outline-none transition font-black text-slate-900 bg-slate-50/50 text-xs uppercase disabled:opacity-50" 
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
                    <button type="button" onClick={() => setShowFamilyForm(true)} className="px-6 py-3 bg-emerald-100 text-emerald-700 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-200 transition-all">+ Vincular Integrante</button>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {(selectedMember.familyMembers || []).map(fm => (
                       <div key={fm.id} className="bg-slate-50 p-6 rounded-3xl border border-slate-100 flex justify-between items-center">
                          <div>
                             <p className="text-sm font-black text-slate-800">{fm.name}</p>
                             <p className="text-[9px] text-emerald-600 font-black uppercase tracking-widest">{fm.relationship}</p>
                          </div>
                          <button type="button" onClick={() => removeFamilyMember(fm.id)} className="w-10 h-10 rounded-xl bg-white text-rose-500 hover:bg-rose-50 flex items-center justify-center text-xl shadow-sm border border-slate-100">&times;</button>
                       </div>
                    ))}
                    {(selectedMember.familyMembers || []).length === 0 && (
                      <div className="col-span-full py-12 text-center text-slate-400 font-bold italic bg-slate-50/50 rounded-[2rem] border-2 border-dashed border-slate-100">
                        No hay familiares vinculados. Haga clic en "+ Vincular Integrante" para agregar.
                      </div>
                    )}
                 </div>
              </div>

              <div className="flex flex-col md:flex-row justify-between items-center pt-12 border-t border-slate-100">
                {selectedMember.id ? (
                  <button type="button" onClick={() => handleDeleteMember(selectedMember.id!)} className="px-8 py-4 bg-rose-50 text-rose-600 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-rose-600 hover:text-white transition-all mb-4 md:mb-0">Eliminar Socio</button>
                ) : <div></div>}
                <div className="flex space-x-6">
                  <button type="button" onClick={closeModal} className="px-10 py-5 font-black text-slate-400 uppercase tracking-widest text-xs hover:text-slate-600">Descartar</button>
                  <button type="submit" className="px-12 py-5 bg-emerald-700 text-white rounded-[2rem] font-black shadow-2xl shadow-emerald-700/30 hover:bg-emerald-800 transition-all uppercase text-xs tracking-widest">Guardar Cambios</button>
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
                      <input className="w-full px-8 py-5 border-2 border-slate-100 rounded-2xl outline-none focus:border-emerald-600 font-bold bg-slate-50" value={newFamilyMember.name} onChange={e => setNewFamilyMember({...newFamilyMember, name: e.target.value})} placeholder="Nombre completo"/>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-2">RUT del Familiar</label>
                      <input className="w-full px-8 py-5 border-2 border-slate-100 rounded-2xl outline-none focus:border-emerald-600 font-bold bg-slate-50 font-mono" value={newFamilyMember.rut} onChange={e => setNewFamilyMember({...newFamilyMember, rut: formatRut(e.target.value)})} placeholder="12.345.678-k"/>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-2">Vínculo de Parentesco</label>
                      <select className="w-full px-8 py-5 border-2 border-slate-100 rounded-2xl outline-none focus:border-emerald-600 font-black bg-slate-50 uppercase text-xs" value={newFamilyMember.relationship} onChange={e => setNewFamilyMember({...newFamilyMember, relationship: e.target.value})}>
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
                    <button type="button" onClick={handleAddFamilyMember} className="w-full py-5 bg-emerald-700 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-emerald-700/20 hover:bg-emerald-800 transition">Confirmar Vinculación</button>
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
            <div className="bg-emerald-700 p-10 text-white flex justify-between items-center">
               <div className="flex items-center space-x-6">
                  <img src={selectedMember.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedMember.name || 'S')}&background=fff&color=047857&bold=true&size=128`} className="w-16 h-16 rounded-2xl object-cover shadow-lg border-2 border-white/20" />
                  <div>
                    <h3 className="text-2xl font-black tracking-tight">{selectedMember.name}</h3>
                    <p className="text-emerald-100 text-[10px] font-black uppercase tracking-widest">Socio Folio #{selectedMember.id}</p>
                  </div>
               </div>
               <button onClick={closeModal} className="w-12 h-12 rounded-2xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-3xl font-light">&times;</button>
            </div>

            <div className="flex-1 overflow-y-auto p-12">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-8">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Información de Perfil</h4>
                    <div className="grid grid-cols-2 gap-y-4 gap-x-6 text-sm">
                       <div><p className="text-slate-500 font-bold uppercase text-[9px] mb-1">RUT</p><p className="font-black text-slate-800">{selectedMember.rut}</p></div>
                       <div><p className="text-slate-500 font-bold uppercase text-[9px] mb-1">Ingreso</p><p className="font-black text-slate-800">{selectedMember.joinDate}</p></div>
                       <div><p className="text-slate-500 font-bold uppercase text-[9px] mb-1">Estado</p><span className="font-black text-emerald-600">{selectedMember.status}</span></div>
                       <div><p className="text-slate-500 font-bold uppercase text-[9px] mb-1">Teléfono</p><p className="font-black text-slate-800">{selectedMember.phone || 'N/A'}</p></div>
                       <div className="col-span-2"><p className="text-slate-500 font-bold uppercase text-[9px] mb-1">Email</p><p className="font-black text-slate-800">{selectedMember.email || 'No registrado'}</p></div>
                       <div className="col-span-2"><p className="text-slate-500 font-bold uppercase text-[9px] mb-1">Domicilio</p><p className="font-black text-slate-800 leading-tight">{selectedMember.address || 'Sin dirección'}{selectedMember.comuna ? `, ${selectedMember.comuna}` : ''}{selectedMember.region ? `, ${selectedMember.region}` : ''}</p></div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Núcleo Familiar</h4>
                    <div className="space-y-3">
                       {selectedMember.familyMembers?.map(fm => (
                         <div key={fm.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                           <p className="font-black text-slate-800 text-xs">{fm.name}</p>
                           <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{fm.relationship} • {fm.rut}</p>
                         </div>
                       ))}
                       {(!selectedMember.familyMembers || selectedMember.familyMembers.length === 0) && (
                         <p className="text-xs text-slate-400 italic">Sin familiares registrados.</p>
                       )}
                    </div>
                  </div>
               </div>
            </div>

            <div className="p-8 border-t border-slate-100 bg-slate-50 flex justify-end space-x-4">
               <button onClick={handlePrint} className="px-8 py-3 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-black transition shadow-xl">Imprimir Ficha</button>
               {canEdit && (
                 <button onClick={() => { setIsViewing(false); setIsEditing(true); }} className="px-8 py-3 bg-emerald-100 text-emerald-800 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-200 transition">Editar Datos</button>
               )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MemberManagement;
