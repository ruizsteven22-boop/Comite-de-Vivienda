
import React, { useState } from 'react';
import { Assembly, AssemblyType, AssemblyStatus, Member, BoardPosition, User, BoardRole, CommitteeConfig } from '../types';
import { printAssemblyMinutes } from '../services/printService';
import { Icons } from '../constants';

interface AssemblyManagementProps {
  assemblies: Assembly[];
  setAssemblies: React.Dispatch<React.SetStateAction<Assembly[]>>;
  members: Member[];
  board: BoardPosition[];
  currentUser: User;
  config: CommitteeConfig;
}

const INITIAL_FORM_STATE: Partial<Assembly> = {
  date: new Date().toISOString().split('T')[0],
  summonsTime: '19:30',
  location: '',
  description: '',
  type: AssemblyType.ORDINARY,
  status: AssemblyStatus.SCHEDULED,
  agenda: [],
  agreements: [],
  attendees: []
};

const AssemblyManagement: React.FC<AssemblyManagementProps> = ({ assemblies, setAssemblies, members, board, currentUser, config }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<'ALL' | AssemblyType>('ALL');
  const [formData, setFormData] = useState<Partial<Assembly>>(INITIAL_FORM_STATE);
  const [formError, setFormError] = useState<string | null>(null);
  
  // Estados para inputs temporales de agenda/acuerdos
  const [tempAgendaItem, setTempAgendaItem] = useState('');
  const [tempAgreementItem, setTempAgreementItem] = useState('');

  const canEdit = currentUser.role === 'SUPPORT' || 
                  currentUser.role === 'ADMINISTRATOR' || 
                  currentUser.role === BoardRole.PRESIDENT || 
                  currentUser.role === BoardRole.SECRETARY;

  const handleOpenCreate = () => {
    if (!canEdit) return;
    setFormData(INITIAL_FORM_STATE);
    setEditingId(null);
    setFormError(null);
    setShowForm(true);
  };

  const handleEdit = (assembly: Assembly) => {
    if (!canEdit) return;
    setFormData({ ...assembly });
    setEditingId(assembly.id);
    setFormError(null);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData(INITIAL_FORM_STATE);
    setFormError(null);
  };

  const handleAddItem = (type: 'agenda' | 'agreements') => {
    const val = type === 'agenda' ? tempAgendaItem : tempAgreementItem;
    if (!val.trim()) return;
    
    setFormData(prev => ({
      ...prev,
      [type]: [...(prev[type] || []), val.trim()]
    }));
    
    if (type === 'agenda') setTempAgendaItem('');
    else setTempAgreementItem('');
  };

  const removeItem = (type: 'agenda' | 'agreements', index: number) => {
    setFormData(prev => ({
      ...prev,
      [type]: (prev[type] || []).filter((_, i) => i !== index)
    }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) return;

    if (!formData.description?.trim() || !formData.date || !formData.summonsTime) {
      setFormError("La descripción, fecha y hora son campos obligatorios.");
      return;
    }

    if (editingId) {
      setAssemblies(prev => prev.map(a => a.id === editingId ? { ...a, ...formData } as Assembly : a));
    } else {
      const newAssembly: Assembly = { 
        ...INITIAL_FORM_STATE,
        ...formData,
        id: `AS-${Date.now().toString().slice(-6)}`, 
        attendees: formData.attendees || []
      } as Assembly;
      setAssemblies(prev => [newAssembly, ...prev]);
    }
    closeForm();
  };

  const getStatusBadge = (status: AssemblyStatus) => {
    switch (status) {
      case AssemblyStatus.SCHEDULED: return 'bg-blue-50 text-blue-700 border-blue-100';
      case AssemblyStatus.IN_PROGRESS: return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case AssemblyStatus.FINISHED: return 'bg-slate-100 text-slate-600 border-slate-200';
      default: return 'bg-slate-50 text-slate-400';
    }
  };

  const filteredAssemblies = typeFilter === 'ALL' 
    ? assemblies 
    : assemblies.filter(a => a.type === typeFilter);

  return (
    <div className="space-y-10 pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="page-transition">
          <h2 className="text-4xl font-black text-slate-900 tracking-tighter">Gestión de <span className="text-emerald-700">Asambleas</span></h2>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-2">Planificación, Tablas y Actas • {config.tradeName}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative group">
            <select 
              className="appearance-none bg-white border-2 border-slate-100 rounded-2xl px-6 py-4 pr-12 text-[10px] font-black uppercase tracking-widest text-slate-600 outline-none focus:border-emerald-600 shadow-sm transition-all cursor-pointer group-hover:border-slate-200"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
            >
              <option value="ALL">Todas las Asambleas</option>
              <option value={AssemblyType.ORDINARY}>Ordinarias</option>
              <option value={AssemblyType.EXTRAORDINARY}>Extraordinarias</option>
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" /></svg>
            </div>
          </div>
          {canEdit && (
            <button 
              onClick={handleOpenCreate} 
              className="bg-emerald-700 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-emerald-700/30 active:scale-95 transition hover:bg-emerald-800"
            >
              Agendar Sesión
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredAssemblies.map(assembly => (
          <div key={assembly.id} className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-slate-100 hover:shadow-xl transition-all group animate-in fade-in slide-in-from-bottom-6 duration-500">
            <div className="flex justify-between items-start mb-6">
              <span className={`text-[9px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full border-2 ${getStatusBadge(assembly.status)}`}>{assembly.status}</span>
              <p className="text-[10px] font-black text-slate-400 font-mono">#{assembly.id}</p>
            </div>
            <h3 className="font-black text-slate-900 text-2xl tracking-tight leading-tight mb-6 group-hover:text-emerald-700 transition-colors h-14 line-clamp-2">{assembly.description}</h3>
            
            <div className="space-y-4 mb-10 border-b border-slate-50 pb-8">
               <div className="flex items-center text-xs font-bold text-slate-500">
                  <span className="mr-3 p-2 bg-slate-50 rounded-xl text-slate-400"><Icons.Calendar /></span>
                  {assembly.date}
               </div>
               <div className="flex items-center text-xs font-bold text-slate-500">
                  <span className="mr-3 p-2 bg-slate-50 rounded-xl text-slate-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </span>
                  Citación: {assembly.summonsTime} hrs
               </div>
               <div className="flex items-center text-xs font-bold text-slate-500">
                  <span className="mr-3 p-2 bg-slate-50 rounded-xl text-slate-400"><Icons.Location /></span>
                  <span className="truncate">{assembly.location || 'Ubicación pendiente'}</span>
               </div>
            </div>

            <div className="flex justify-between items-center">
              <div className="flex flex-col">
                <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Tipo de Sesión</span>
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">{assembly.type}</span>
              </div>
              <div className="flex items-center space-x-2">
                {canEdit && (
                  <button onClick={() => handleEdit(assembly)} className="p-4 text-slate-300 hover:text-emerald-700 hover:bg-emerald-50 rounded-2xl transition-all" title="Editar detalles">
                    <Icons.Pencil />
                  </button>
                )}
                {assembly.status === AssemblyStatus.FINISHED && (
                  <button onClick={() => printAssemblyMinutes(assembly, members, board, config)} className="px-5 py-3 bg-emerald-700 text-white text-[10px] font-black rounded-xl uppercase tracking-widest hover:bg-emerald-800 transition shadow-lg shadow-emerald-700/10">Bajar Acta</button>
                )}
              </div>
            </div>
          </div>
        ))}
        {filteredAssemblies.length === 0 && (
          <div className="col-span-full py-32 bg-slate-50/50 rounded-[4rem] border-4 border-dashed border-slate-100 flex flex-col items-center justify-center text-slate-400">
             <div className="w-24 h-24 rounded-full bg-white flex items-center justify-center shadow-sm mb-8 text-slate-200">
                <Icons.Calendar />
             </div>
             <p className="font-black text-lg text-slate-500">No hay asambleas registradas</p>
             <p className="text-sm font-bold mt-2 opacity-60">Filtro aplicado: {typeFilter === 'ALL' ? 'Todos los tipos' : typeFilter}</p>
          </div>
        )}
      </div>

      {showForm && canEdit && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-xl flex items-center justify-center z-[110] p-6 overflow-y-auto">
          <div className="bg-white rounded-[4rem] w-full max-w-4xl shadow-2xl overflow-hidden animate-in zoom-in-95 my-auto max-h-[95vh] flex flex-col">
             <div className="bg-slate-900 p-10 text-white flex justify-between items-center shrink-0">
              <div>
                <h3 className="text-3xl font-black tracking-tighter">{editingId ? 'Actualizar Asamblea' : 'Agendar Nueva Sesión'}</h3>
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.4em] mt-3">Sistema de Planificación Institucional</p>
              </div>
              <button onClick={closeForm} className="w-14 h-14 rounded-[1.5rem] bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-4xl font-light transition-all">&times;</button>
            </div>
            
            <form onSubmit={handleSave} className="p-10 space-y-10 overflow-y-auto">
              {formError && (
                <div className="p-5 bg-rose-50 text-rose-600 rounded-3xl border-2 border-rose-100 text-[11px] font-black uppercase tracking-widest text-center">
                  {formError}
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-8">
                   <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-2">Información de Citación</h4>
                   
                   <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-2">Asunto o Título de la Sesión</label>
                    <input type="text" required className="w-full px-8 py-5 border-2 border-slate-100 rounded-[2rem] focus:border-emerald-600 outline-none transition font-black text-slate-900 bg-slate-50/50" placeholder="Ej: Discusión Proyecto Alcantarillado" value={formData.description || ''} onChange={e => setFormData({...formData, description: e.target.value})}/>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-2">Fecha</label>
                      <input type="date" required className="w-full px-8 py-5 border-2 border-slate-100 rounded-[2rem] focus:border-emerald-600 outline-none font-black bg-slate-50/50" value={formData.date || ''} onChange={e => setFormData({...formData, date: e.target.value})}/>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-2">Hora 1° Citación</label>
                      <input type="time" required className="w-full px-8 py-5 border-2 border-slate-100 rounded-[2rem] focus:border-emerald-600 outline-none font-black bg-slate-50/50" value={formData.summonsTime || ''} onChange={e => setFormData({...formData, summonsTime: e.target.value})}/>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-2">Lugar de Reunión</label>
                    <input type="text" className="w-full px-8 py-5 border-2 border-slate-100 rounded-[2rem] focus:border-emerald-600 outline-none font-black bg-slate-50/50" placeholder="Ej: Sede Social o Plataforma Zoom" value={formData.location || ''} onChange={e => setFormData({...formData, location: e.target.value})}/>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-2">Tipo de Asamblea</label>
                        <select className="w-full px-8 py-5 border-2 border-slate-100 rounded-[2rem] focus:border-emerald-600 outline-none font-black text-[11px] uppercase bg-slate-50/50" value={formData.type || AssemblyType.ORDINARY} onChange={e => setFormData({...formData, type: e.target.value as AssemblyType})}>
                          <option value={AssemblyType.ORDINARY}>Ordinaria</option>
                          <option value={AssemblyType.EXTRAORDINARY}>Extraordinaria</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-2">Estado Inicial</label>
                        <select className="w-full px-8 py-5 border-2 border-slate-100 rounded-[2rem] focus:border-emerald-600 outline-none font-black text-[11px] uppercase bg-slate-50/50" value={formData.status || AssemblyStatus.SCHEDULED} onChange={e => setFormData({...formData, status: e.target.value as AssemblyStatus})}>
                          <option value={AssemblyStatus.SCHEDULED}>Programada</option>
                          <option value={AssemblyStatus.IN_PROGRESS}>En Curso</option>
                          <option value={AssemblyStatus.FINISHED}>Finalizada</option>
                        </select>
                    </div>
                  </div>
                </div>

                <div className="space-y-8 bg-slate-50/50 p-8 rounded-[3rem] border border-slate-100">
                   <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Tabla y Acuerdos</h4>
                   
                   {/* GESTIÓN DE AGENDA */}
                   <div>
                     <label className="block text-[10px] font-black text-slate-600 uppercase tracking-widest mb-3 ml-2">Puntos de la Agenda</label>
                     <div className="flex gap-2 mb-4">
                        <input type="text" className="flex-1 px-6 py-4 border-2 border-white rounded-2xl outline-none focus:border-emerald-600 font-bold text-xs" placeholder="Añadir punto..." value={tempAgendaItem} onChange={e => setTempAgendaItem(e.target.value)} onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), handleAddItem('agenda'))}/>
                        <button type="button" onClick={() => handleAddItem('agenda')} className="p-4 bg-emerald-600 text-white rounded-2xl hover:bg-emerald-700 transition">+</button>
                     </div>
                     <div className="space-y-2 max-h-40 overflow-y-auto">
                        {(formData.agenda || []).map((item, i) => (
                           <div key={i} className="flex justify-between items-center bg-white px-4 py-2.5 rounded-xl border border-slate-100 text-xs font-bold text-slate-600 group">
                              <span className="truncate">{i + 1}. {item}</span>
                              <button type="button" onClick={() => removeItem('agenda', i)} className="text-rose-300 hover:text-rose-600 p-1 opacity-0 group-hover:opacity-100 transition">&times;</button>
                           </div>
                        ))}
                     </div>
                   </div>

                   {/* GESTIÓN DE ACUERDOS (SOLO SI FINALIZADA) */}
                   <div>
                     <label className="block text-[10px] font-black text-slate-600 uppercase tracking-widest mb-3 ml-2">Acuerdos Tomados</label>
                     <div className="flex gap-2 mb-4">
                        <input type="text" className="flex-1 px-6 py-4 border-2 border-white rounded-2xl outline-none focus:border-emerald-600 font-bold text-xs" placeholder="Registrar acuerdo..." value={tempAgreementItem} onChange={e => setTempAgreementItem(e.target.value)} onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), handleAddItem('agreements'))}/>
                        <button type="button" onClick={() => handleAddItem('agreements')} className="p-4 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 transition">+</button>
                     </div>
                     <div className="space-y-2 max-h-40 overflow-y-auto">
                        {(formData.agreements || []).map((item, i) => (
                           <div key={i} className="flex justify-between items-center bg-white px-4 py-2.5 rounded-xl border border-slate-100 text-xs font-bold text-slate-600 group">
                              <span className="truncate text-indigo-700">• {item}</span>
                              <button type="button" onClick={() => removeItem('agreements', i)} className="text-rose-300 hover:text-rose-600 p-1 opacity-0 group-hover:opacity-100 transition">&times;</button>
                           </div>
                        ))}
                     </div>
                   </div>
                </div>
              </div>

              <div className="flex justify-end space-x-6 pt-10 border-t border-slate-100 shrink-0">
                <button type="button" onClick={closeForm} className="px-8 py-4 font-black text-slate-400 uppercase tracking-[0.2em] text-[10px] hover:text-slate-600 transition">Descartar</button>
                <button type="submit" className="px-12 py-5 bg-emerald-700 text-white rounded-[2rem] font-black shadow-2xl shadow-emerald-700/30 uppercase text-[10px] tracking-[0.2em] hover:bg-emerald-800 transition">Confirmar y Guardar Sesión</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssemblyManagement;
