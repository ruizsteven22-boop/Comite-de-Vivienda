
import React, { useState, useRef, useEffect } from 'react';
import { Member, MemberStatus, FamilyMember, Assembly, Transaction, BoardPosition } from '../types';
import { formatRut } from '../services/utils';
import { Icons } from '../constants';
import { printMemberFile } from '../services/printService';

interface MemberManagementProps {
  members: Member[];
  setMembers: React.Dispatch<React.SetStateAction<Member[]>>;
  assemblies: Assembly[];
  transactions: Transaction[];
  board: BoardPosition[];
  viewingMemberId: string | null;
  onClearViewingMember: () => void;
}

const MemberManagement: React.FC<MemberManagementProps> = ({ 
  members, 
  setMembers, 
  assemblies, 
  transactions,
  board,
  viewingMemberId, 
  onClearViewingMember 
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
      alert("Complete todos los campos del integrante.");
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

  const closeModal = () => {
    setIsEditing(false);
    setIsViewing(false);
    setSelectedMember(null);
    onClearViewingMember();
  };

  const handlePrintMember = (member: Member) => {
    printMemberFile(member, transactions, assemblies, board);
  };

  const memberPayments = transactions.filter(t => t.memberId === selectedMember?.id);
  const memberAttendance = assemblies.map(a => ({
    ...a,
    present: a.attendees.includes(selectedMember?.rut || '')
  })).filter(a => a.status === 'Finalizada');

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Comunidad de Socios</h2>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-1">Gestión y Expedientes Históricos</p>
        </div>
        <button 
          onClick={openNew}
          className="bg-emerald-700 hover:bg-emerald-800 text-white px-8 py-3.5 rounded-2xl font-black transition-all shadow-xl shadow-emerald-700/20 active:scale-95 flex items-center justify-center uppercase text-xs tracking-widest"
        >
          <span className="mr-2 text-xl font-light">+</span> Nuevo Socio
        </button>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-8 border-b border-slate-100 flex flex-col md:flex-row gap-4 bg-slate-50/50">
          <div className="flex-1 relative">
            <input 
              type="text" 
              placeholder="Buscar por nombre o RUT..." 
              className="w-full px-6 py-4 border-2 border-slate-200 rounded-2xl focus:border-emerald-600 outline-none transition font-bold text-slate-800 placeholder:text-slate-400 text-sm shadow-inner"
              value={searchTerm}
              onChange={(e) => setSearchTerm(formatRut(e.target.value))}
            />
          </div>
          <div className="w-full md:w-auto">
            <select 
              className="w-full md:w-64 px-6 py-4 border-2 border-slate-200 rounded-2xl focus:border-emerald-600 outline-none bg-white font-black text-slate-600 uppercase text-[10px] tracking-widest shadow-inner"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as MemberStatus | 'ALL')}
            >
              <option value="ALL">Todos los Estados</option>
              {Object.values(MemberStatus).map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50 text-slate-400 text-[9px] uppercase tracking-[0.2em] font-black border-b border-slate-100">
              <tr>
                <th className="px-10 py-5">Socio Identificado</th>
                <th className="px-10 py-5">Medios de Contacto</th>
                <th className="px-10 py-5">Fecha Ingreso</th>
                <th className="px-10 py-5">Estado</th>
                <th className="px-10 py-5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredMembers.map(member => (
                <tr key={member.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-10 py-5">
                    <div className="flex items-center space-x-5">
                      <div className="relative">
                        <img 
                          src={member.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=047857&color=fff&bold=true&rounded=true&size=128`} 
                          alt={member.name} 
                          className="w-12 h-12 rounded-2xl border-2 border-white object-cover shadow-lg" 
                        />
                        <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${member.status === MemberStatus.ACTIVE ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
                      </div>
                      <div>
                        <p className="font-black text-slate-900 text-sm leading-tight">{member.name}</p>
                        <p className="text-[10px] text-slate-400 font-mono mt-1 font-bold">{member.rut}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-10 py-5">
                    <p className="text-xs text-slate-700 font-black">{member.email || 'Sin Correo'}</p>
                    <p className="text-[10px] text-emerald-700 font-black mt-1 uppercase tracking-widest">{member.phone || 'Sin Fono'}</p>
                  </td>
                  <td className="px-10 py-5">
                    <span className="text-xs text-slate-600 font-black">{member.joinDate}</span>
                  </td>
                  <td className="px-10 py-5">
                    <span className={`text-[9px] font-black uppercase px-3 py-1.5 rounded-xl border-2 ${
                      member.status === MemberStatus.ACTIVE ? 'bg-emerald-50 text-emerald-800 border-emerald-100' : 
                      'bg-slate-100 text-slate-500 border-slate-200'
                    }`}>
                      {member.status}
                    </span>
                  </td>
                  <td className="px-10 py-5 text-right">
                    <div className="flex justify-end space-x-3">
                      <button 
                        onClick={() => handlePrintMember(member)}
                        className="p-3 text-slate-300 hover:text-emerald-700 hover:bg-emerald-50 rounded-2xl transition-all"
                        title="Imprimir Ficha"
                      >
                         <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                      </button>
                      <button 
                        onClick={() => { setSelectedMember(member); setIsViewing(true); }}
                        className="p-3 text-slate-300 hover:text-indigo-700 hover:bg-indigo-50 rounded-2xl transition-all"
                        title="Ver Perfil"
                      >
                        <Icons.Users />
                      </button>
                      <button 
                        onClick={() => { setSelectedMember(member); setIsEditing(true); }}
                        className="p-3 text-slate-300 hover:text-amber-600 hover:bg-amber-50 rounded-2xl transition-all"
                        title="Editar"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredMembers.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-10 py-20 text-center text-slate-400 font-bold italic">
                    No se encontraron socios con los criterios de búsqueda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Viewing Modal (Compact & Elegant) */}
      {isViewing && selectedMember && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xl flex items-center justify-center z-[100] p-6 overflow-y-auto">
          <div className="bg-white w-full max-w-5xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
             {/* Header Section */}
             <div className="relative h-64 bg-gradient-to-br from-[#064e3b] to-[#1e1b4b] p-12 flex items-end">
                <button onClick={closeModal} className="absolute top-8 right-8 w-12 h-12 rounded-2xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-3xl font-light transition-all duration-300">&times;</button>
                <div className="flex items-center space-x-10 translate-y-20 relative z-10">
                   <div className="p-2 bg-white rounded-[2.5rem] shadow-2xl">
                      <img 
                        src={selectedMember.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedMember.name || 'S')}&background=047857&color=fff&size=256`} 
                        className="w-40 h-40 rounded-[2rem] object-cover" 
                        alt="Perfil Socio"
                      />
                   </div>
                   <div className="pb-4">
                      <h3 className="text-4xl font-black text-white tracking-tighter">{selectedMember.name}</h3>
                      <div className="flex items-center space-x-3 mt-3">
                         <span className="px-4 py-1.5 bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg">Socio Activo</span>
                         <span className="text-emerald-400 font-mono text-sm font-bold tracking-widest">{selectedMember.rut}</span>
                      </div>
                   </div>
                </div>
             </div>
             
             {/* Main Content Modal */}
             <div className="pt-28 px-12 pb-12 overflow-y-auto flex-1">
                <nav className="flex space-x-10 border-b border-slate-100 mb-10">
                  {[
                    { id: 'perfil', label: 'Datos de Socio' },
                    { id: 'familia', label: 'Núcleo Familiar' },
                    { id: 'historial', label: 'Historial Integral' }
                  ].map(tab => (
                    <button 
                      key={tab.id}
                      onClick={() => setViewTab(tab.id as any)}
                      className={`pb-5 text-[11px] font-black uppercase tracking-[0.2em] transition-all relative ${
                        viewTab === tab.id ? 'text-emerald-700' : 'text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      {tab.label}
                      {viewTab === tab.id && <div className="absolute bottom-0 left-0 w-full h-1.5 bg-emerald-700 rounded-full animate-in slide-in-from-left-4"></div>}
                    </button>
                  ))}
                </nav>

                <div className="min-h-[400px]">
                  {viewTab === 'perfil' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 animate-in fade-in slide-in-from-bottom-6">
                      <div className="space-y-8">
                        <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100">
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Información Básica</p>
                           <div className="grid grid-cols-1 gap-6">
                              <div className="flex items-center space-x-5">
                                 <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-slate-400 shadow-sm"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg></div>
                                 <div>
                                    <p className="text-[9px] font-black text-slate-400 uppercase">Email</p>
                                    <p className="text-sm font-black text-slate-800">{selectedMember.email || 'No registrado'}</p>
                                 </div>
                              </div>
                              <div className="flex items-center space-x-5">
                                 <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-slate-400 shadow-sm"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg></div>
                                 <div>
                                    <p className="text-[9px] font-black text-slate-400 uppercase">Teléfono</p>
                                    <p className="text-sm font-black text-slate-800">{selectedMember.phone || 'No registrado'}</p>
                                 </div>
                              </div>
                              <div className="flex items-start space-x-5">
                                 <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-slate-400 shadow-sm shrink-0"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg></div>
                                 <div>
                                    <p className="text-[9px] font-black text-slate-400 uppercase">Domicilio Declarado</p>
                                    <p className="text-sm font-black text-slate-800 leading-tight">{selectedMember.address || 'No registrado'}</p>
                                 </div>
                              </div>
                           </div>
                        </div>
                      </div>

                      <div className="space-y-8">
                         <div className="bg-emerald-50/50 p-8 rounded-[2.5rem] border-2 border-dashed border-emerald-200 flex justify-between items-center shadow-inner">
                            <div>
                               <p className="text-[10px] font-black text-emerald-700 uppercase tracking-widest mb-1">Incorporación</p>
                               <p className="text-3xl font-black text-emerald-900 tracking-tighter">{selectedMember.joinDate}</p>
                            </div>
                            <div className="text-right">
                               <p className="text-[10px] font-black text-emerald-700 uppercase tracking-widest mb-1">Estado Administrativo</p>
                               <p className="text-sm font-black text-emerald-800 uppercase">{selectedMember.status}</p>
                            </div>
                         </div>
                         <div className="p-8 bg-slate-900 rounded-[2.5rem] text-white relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-10"><Icons.Dashboard /></div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4">Membresía</p>
                            <p className="text-sm font-medium leading-relaxed opacity-80">Socio acreditado ante el Comité Tierra Esperanza. Con derecho a voto en asambleas ordinarias y extraordinarias según estatutos vigentes.</p>
                         </div>
                      </div>
                    </div>
                  )}

                  {viewTab === 'familia' && (
                    <div className="animate-in fade-in slide-in-from-right-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                       {(selectedMember.familyMembers || []).map(fm => (
                         <div key={fm.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-lg transition-all">
                            <p className="font-black text-slate-800 text-lg leading-tight">{fm.name}</p>
                            <div className="flex items-center space-x-3 mt-3">
                               <span className="text-[10px] font-black text-emerald-700 uppercase bg-emerald-50 px-3 py-1 rounded-lg">{fm.relationship}</span>
                               <span className="text-[10px] text-slate-400 font-mono font-bold">{fm.rut}</span>
                            </div>
                         </div>
                       ))}
                       {(!selectedMember.familyMembers || selectedMember.familyMembers.length === 0) && (
                         <div className="col-span-full py-20 text-center bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200">
                            <p className="text-slate-400 font-bold italic">No se registra núcleo familiar para este socio.</p>
                         </div>
                       )}
                    </div>
                  )}

                  {viewTab === 'historial' && (
                    <div className="animate-in fade-in slide-in-from-left-6 grid grid-cols-1 lg:grid-cols-2 gap-10">
                       <section>
                          <div className="flex items-center justify-between mb-6">
                             <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center">
                               <Icons.Wallet /> <span className="ml-3">Transacciones Recientes</span>
                             </h4>
                             <span className="text-[9px] font-black bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full">{memberPayments.length} Registros</span>
                          </div>
                          <div className="bg-slate-50 rounded-[2rem] overflow-hidden border border-slate-100">
                             <table className="w-full text-left text-[11px]">
                                <tbody className="divide-y divide-slate-100">
                                   {memberPayments.map(t => (
                                     <tr key={t.id} className="hover:bg-white transition-colors">
                                        <td className="px-6 py-5">
                                           <p className="font-black text-slate-800">{t.description}</p>
                                           <p className="text-slate-400 font-bold uppercase mt-1 text-[9px]">{t.date}</p>
                                        </td>
                                        <td className="px-6 py-5 text-right">
                                           <span className="font-black text-emerald-700 text-sm">${t.amount.toLocaleString('es-CL')}</span>
                                        </td>
                                     </tr>
                                   ))}
                                   {memberPayments.length === 0 && <tr><td className="px-6 py-10 text-center text-slate-400 font-bold italic">Sin movimientos financieros.</td></tr>}
                                </tbody>
                             </table>
                          </div>
                       </section>

                       <section>
                          <div className="flex items-center justify-between mb-6">
                             <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center">
                               <Icons.Clipboard /> <span className="ml-3">Participación Histórica</span>
                             </h4>
                             <span className="text-[9px] font-black bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full">{memberAttendance.length} Sesiones</span>
                          </div>
                          <div className="space-y-3">
                             {memberAttendance.map(a => (
                               <div key={a.id} className="bg-white p-5 rounded-2xl border border-slate-100 flex items-center justify-between shadow-sm hover:shadow-md transition-all">
                                  <div>
                                     <p className="text-xs font-black text-slate-800 leading-tight">{a.description}</p>
                                     <p className="text-[10px] text-slate-400 mt-1 font-bold">{a.date} • {a.type}</p>
                                  </div>
                                  <span className={`text-[10px] font-black px-4 py-1.5 rounded-full border-2 ${a.present ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-100'}`}>
                                     {a.present ? 'PRESENTE' : 'AUSENTE'}
                                  </span>
                               </div>
                             ))}
                             {memberAttendance.length === 0 && <div className="py-20 text-center bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200"><p className="text-slate-400 font-bold italic">Sin historial de asistencia disponible.</p></div>}
                          </div>
                       </section>
                    </div>
                  )}
                </div>

                <div className="mt-16 pt-8 border-t border-slate-100 flex justify-center space-x-6">
                   <button 
                    onClick={() => handlePrintMember(selectedMember as Member)}
                    className="px-10 py-4 bg-emerald-700 text-white rounded-[1.5rem] font-black uppercase tracking-widest text-xs hover:bg-emerald-800 transition-all shadow-xl shadow-emerald-700/20"
                   >Imprimir Ficha Maestra</button>
                   <button 
                    onClick={closeModal}
                    className="px-10 py-4 bg-slate-100 text-slate-600 rounded-[1.5rem] font-black uppercase tracking-widest text-xs hover:bg-slate-200 transition-all"
                   >Cerrar Visor</button>
                </div>
             </div>
          </div>
        </div>
      )}

      {/* Editing/Creation Modal */}
      {isEditing && selectedMember && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xl flex items-center justify-center z-[100] p-6 overflow-y-auto">
          <div className="bg-white w-full max-w-4xl rounded-[3.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="bg-slate-900 p-10 text-white flex justify-between items-center">
              <div>
                <h3 className="text-3xl font-black tracking-tighter">{selectedMember.id ? 'Modificar Expediente' : 'Nueva Incorporación'}</h3>
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em] mt-2">Registros de Comunidad Tierra Esperanza</p>
              </div>
              <button onClick={closeModal} className="w-12 h-12 rounded-2xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-3xl font-light transition-all">&times;</button>
            </div>

            <form onSubmit={handleSave} className="p-10">
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
                <div className="lg:col-span-1 flex flex-col items-center">
                   <div className="relative group w-full max-w-[200px]">
                      <img 
                        src={selectedMember.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedMember.name || 'S')}&background=f1f5f9&color=94a3b8&size=512`} 
                        className="w-full aspect-square rounded-[2.5rem] object-cover border-8 border-slate-50 shadow-2xl"
                        alt="Foto de Perfil"
                      />
                      <button 
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute inset-0 bg-black/60 rounded-[2.5rem] opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-all duration-300 backdrop-blur-sm"
                      >
                        <svg className="w-8 h-8 text-white mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                        <span className="text-white text-[9px] font-black uppercase tracking-widest">Cargar Imagen</span>
                      </button>
                      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handlePhotoUpload} />
                   </div>
                   <div className="mt-8 w-full">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-2">Condición del Socio</label>
                      <select 
                        className="w-full px-6 py-4 border-2 border-slate-100 rounded-2xl focus:border-emerald-600 outline-none transition font-black text-slate-700 bg-slate-50/50 uppercase text-[11px] tracking-wider shadow-inner"
                        value={selectedMember.status}
                        onChange={e => setSelectedMember({...selectedMember, status: e.target.value as MemberStatus})}
                      >
                        {Object.values(MemberStatus).map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                   </div>
                </div>

                <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-8">
                   <div className="md:col-span-2">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-2">Nombres y Apellidos</label>
                      <input 
                        required
                        className="w-full px-6 py-4 border-2 border-slate-100 rounded-2xl focus:border-emerald-600 outline-none transition font-black text-slate-900 bg-slate-50/30 text-lg placeholder:text-slate-300"
                        value={selectedMember.name}
                        placeholder="Ingrese nombre completo"
                        onChange={e => setSelectedMember({...selectedMember, name: e.target.value})}
                      />
                   </div>
                   <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-2">RUT / Identificador</label>
                      <input 
                        required
                        className="w-full px-6 py-4 border-2 border-slate-100 rounded-2xl focus:border-emerald-600 outline-none transition font-black text-slate-900 bg-slate-50/30 font-mono tracking-wider"
                        value={selectedMember.rut}
                        placeholder="12.345.678-9"
                        onChange={e => setSelectedMember({...selectedMember, rut: formatRut(e.target.value)})}
                      />
                   </div>
                   <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-2">Fecha Oficial Ingreso</label>
                      <input 
                        type="date"
                        required
                        className="w-full px-6 py-4 border-2 border-slate-100 rounded-2xl focus:border-emerald-600 outline-none transition font-black text-slate-900 bg-slate-50/30"
                        value={selectedMember.joinDate}
                        onChange={e => setSelectedMember({...selectedMember, joinDate: e.target.value})}
                      />
                   </div>
                   <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-2">Número Telefónico</label>
                      <input 
                        className="w-full px-6 py-4 border-2 border-slate-100 rounded-2xl focus:border-emerald-600 outline-none transition font-black text-slate-900 bg-slate-50/30"
                        value={selectedMember.phone}
                        placeholder="+56 9 XXXX XXXX"
                        onChange={e => setSelectedMember({...selectedMember, phone: e.target.value})}
                      />
                   </div>
                   <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-2">Correo Electrónico</label>
                      <input 
                        type="email"
                        className="w-full px-6 py-4 border-2 border-slate-100 rounded-2xl focus:border-emerald-600 outline-none transition font-black text-slate-900 bg-slate-50/30"
                        value={selectedMember.email}
                        placeholder="socio@email.com"
                        onChange={e => setSelectedMember({...selectedMember, email: e.target.value})}
                      />
                   </div>
                   <div className="md:col-span-2">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-2">Dirección en el Conjunto</label>
                      <input 
                        className="w-full px-6 py-4 border-2 border-slate-100 rounded-2xl focus:border-emerald-600 outline-none transition font-black text-slate-900 bg-slate-50/30"
                        value={selectedMember.address}
                        placeholder="Block, Depto, Casa..."
                        onChange={e => setSelectedMember({...selectedMember, address: e.target.value})}
                      />
                   </div>
                </div>
              </div>

              {/* Family Section */}
              <div className="mt-12 pt-10 border-t border-slate-100">
                 <div className="flex justify-between items-center mb-6">
                    <h4 className="text-sm font-black text-slate-900 uppercase tracking-[0.2em]">Cargas Familiares</h4>
                    <button type="button" onClick={() => setShowFamilyForm(true)} className="px-6 py-2 bg-emerald-100 text-emerald-700 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-200 transition-all">+ Vincular Integrante</button>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {(selectedMember.familyMembers || []).map(fm => (
                       <div key={fm.id} className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex justify-between items-center shadow-sm">
                          <div className="overflow-hidden">
                             <p className="text-xs font-black text-slate-800 truncate">{fm.name}</p>
                             <p className="text-[9px] text-emerald-600 font-black uppercase">{fm.relationship}</p>
                          </div>
                          <button type="button" onClick={() => removeFamilyMember(fm.id)} className="w-8 h-8 rounded-xl bg-white text-rose-400 hover:text-rose-600 flex items-center justify-center text-xl shadow-sm border border-slate-100 transition-all">&times;</button>
                       </div>
                    ))}
                    {(!selectedMember.familyMembers || selectedMember.familyMembers.length === 0) && (
                      <p className="col-span-full py-6 text-center text-slate-400 font-bold text-[11px] italic">No hay familiares vinculados.</p>
                    )}
                 </div>
              </div>

              <div className="flex justify-end space-x-6 mt-12 pt-8 border-t border-slate-100">
                <button type="button" onClick={closeModal} className="px-8 py-4 font-black text-slate-400 uppercase tracking-widest text-xs hover:text-slate-600">Descartar</button>
                <button type="submit" className="px-12 py-4 bg-emerald-700 text-white rounded-[1.5rem] font-black shadow-2xl shadow-emerald-700/30 hover:bg-emerald-800 transition-all uppercase text-xs tracking-[0.2em]">Guardar Expediente</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Mini Modal for adding family member */}
      {showFamilyForm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[110] p-6">
          <div className="bg-white w-full max-w-sm rounded-[3rem] p-10 shadow-2xl animate-in zoom-in-95">
            <h4 className="text-2xl font-black text-slate-900 tracking-tighter mb-8 text-center">Nuevo Integrante</h4>
            <div className="space-y-5">
               <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Nombre</label>
                  <input className="w-full px-5 py-3.5 border-2 border-slate-100 rounded-2xl outline-none focus:border-emerald-600 font-black bg-slate-50 text-sm" value={newFamilyMember.name} onChange={e => setNewFamilyMember({...newFamilyMember, name: e.target.value})}/>
               </div>
               <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">RUT</label>
                  <input className="w-full px-5 py-3.5 border-2 border-slate-100 rounded-2xl outline-none focus:border-emerald-600 font-black bg-slate-50 font-mono text-sm" value={newFamilyMember.rut} onChange={e => setNewFamilyMember({...newFamilyMember, rut: formatRut(e.target.value)})}/>
               </div>
               <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Parentesco</label>
                  <input className="w-full px-5 py-3.5 border-2 border-slate-100 rounded-2xl outline-none focus:border-emerald-600 font-black bg-slate-50 text-sm" value={newFamilyMember.relationship} onChange={e => setNewFamilyMember({...newFamilyMember, relationship: e.target.value})}/>
               </div>
               <div className="flex space-x-4 pt-6">
                  <button type="button" onClick={() => setShowFamilyForm(false)} className="flex-1 py-4 font-black text-slate-400 text-[10px] uppercase tracking-widest">Cerrar</button>
                  <button type="button" onClick={handleAddFamilyMember} className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-slate-900/20">Vincular</button>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MemberManagement;
