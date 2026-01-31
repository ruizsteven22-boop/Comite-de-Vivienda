
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

const AssemblyManagement: React.FC<AssemblyManagementProps> = ({ assemblies, setAssemblies, members, board, currentUser, config }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Assembly>>({
    date: new Date().toISOString().split('T')[0],
    summonsTime: '19:30',
    location: '',
    description: '',
    type: AssemblyType.ORDINARY,
    status: AssemblyStatus.SCHEDULED
  });

  const canEdit = currentUser.role === 'SUPPORT' || 
                  currentUser.role === 'ADMINISTRATOR' || 
                  currentUser.role === BoardRole.PRESIDENT || 
                  currentUser.role === BoardRole.SECRETARY;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) return;
    if (editingId) {
      setAssemblies(prev => prev.map(a => a.id === editingId ? { ...a, ...formData } as Assembly : a));
    } else {
      const newAssembly: Assembly = { id: `AS-${Date.now().toString().slice(-6)}`, attendees: [], ...formData } as Assembly;
      setAssemblies(prev => [newAssembly, ...prev]);
    }
    closeForm();
  };

  const closeForm = () => { setShowForm(false); setEditingId(null); };

  const handleEdit = (assembly: Assembly) => { setFormData(assembly); setEditingId(assembly.id); setShowForm(true); };

  const getStatusBadge = (status: AssemblyStatus) => {
    switch (status) {
      case AssemblyStatus.SCHEDULED: return 'bg-blue-50 text-blue-700 border-blue-100';
      case AssemblyStatus.IN_PROGRESS: return 'bg-emerald-50 text-emerald-700 border-emerald-100';
      case AssemblyStatus.FINISHED: return 'bg-slate-100 text-slate-600 border-slate-200';
      default: return 'bg-slate-50 text-slate-400';
    }
  };

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tighter">Gestión de <span className="text-emerald-700">Asambleas</span></h2>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-2">Planificación y Toma de Decisiones {config.tradeName}</p>
        </div>
        {canEdit && (
          <button 
            onClick={() => setShowForm(true)} 
            className="bg-emerald-700 text-white px-8 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-emerald-700/20 active:scale-95 transition"
          >
            Nueva Asamblea
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {assemblies.map(assembly => (
          <div key={assembly.id} className="bg-white rounded-[2.5rem] p-10 shadow-sm border border-slate-100 hover:shadow-xl transition-all group">
            <div className="flex justify-between items-start mb-6">
              <span className={`text-[9px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full border-2 ${getStatusBadge(assembly.status)}`}>{assembly.status}</span>
              <p className="text-[10px] font-black text-slate-400 font-mono">#{assembly.id}</p>
            </div>
            <h3 className="font-black text-slate-900 text-2xl tracking-tight leading-tight mb-4 group-hover:text-emerald-700 transition-colors">{assembly.description}</h3>
            
            <div className="space-y-3 mb-8">
               <div className="flex items-center text-xs font-bold text-slate-500">
                  <span className="mr-3 opacity-60"><Icons.Calendar /></span>
                  {assembly.date}
               </div>
               <div className="flex items-center text-xs font-bold text-slate-500">
                  <span className="mr-3 opacity-60"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></span>
                  Citación: {assembly.summonsTime} hrs
               </div>
               <div className="flex items-center text-xs font-bold text-slate-500">
                  <span className="mr-3 opacity-60"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/></svg></span>
                  {assembly.location || 'Lugar pendiente'}
               </div>
            </div>

            <div className="flex justify-between items-center pt-6 border-t border-slate-50">
              <span className="text-[10px] font-black bg-slate-50 px-3 py-1 rounded-lg text-slate-400 uppercase tracking-widest">{assembly.type}</span>
              <div className="flex items-center space-x-2">
                {canEdit && (
                  <button onClick={() => handleEdit(assembly)} className="p-3 text-slate-300 hover:text-emerald-700 hover:bg-emerald-50 rounded-2xl transition-all">
                    <Icons.Pencil />
                  </button>
                )}
                {assembly.status === AssemblyStatus.FINISHED && (
                  <button onClick={() => printAssemblyMinutes(assembly, members, board, config)} className="px-4 py-2 bg-emerald-700 text-white text-[10px] font-black rounded-xl uppercase tracking-widest hover:bg-emerald-800 transition shadow-lg shadow-emerald-700/10">Acta PDF</button>
                )}
              </div>
            </div>
          </div>
        ))}
        {assemblies.length === 0 && (
          <div className="col-span-full py-20 bg-slate-100/50 rounded-[3rem] border-4 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400">
             <Icons.Calendar />
             <p className="font-bold mt-4 italic">No hay asambleas programadas en el sistema.</p>
          </div>
        )}
      </div>

      {showForm && canEdit && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xl flex items-center justify-center z-[100] p-6 overflow-y-auto">
          <div className="bg-white rounded-[3rem] w-full max-w-xl shadow-2xl overflow-hidden animate-in zoom-in-95">
             <div className="bg-slate-900 p-10 text-white flex justify-between items-center">
              <div>
                <h3 className="text-3xl font-black tracking-tighter">{editingId ? 'Editar Asamblea' : 'Agendar Asamblea'}</h3>
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em] mt-2">Calendario {config.tradeName}</p>
              </div>
              <button onClick={closeForm} className="w-12 h-12 rounded-2xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-3xl font-light transition-all">&times;</button>
            </div>
            <form onSubmit={handleSave} className="p-10 space-y-6">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-2">Motivo o Descripción de la Sesión</label>
                <input type="text" required className="w-full px-6 py-4 border-2 border-slate-100 rounded-2xl focus:border-emerald-600 outline-none transition font-black text-slate-900 bg-slate-50/50" placeholder="Ej: Elección de nueva directiva" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}/>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-2">Fecha</label>
                  <input type="date" required className="w-full px-6 py-4 border-2 border-slate-100 rounded-2xl focus:border-emerald-600 outline-none font-black bg-slate-50/50" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})}/>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-2">Hora de Citación</label>
                  <input type="time" required className="w-full px-6 py-4 border-2 border-slate-100 rounded-2xl focus:border-emerald-600 outline-none font-black bg-slate-50/50" value={formData.summonsTime} onChange={e => setFormData({...formData, summonsTime: e.target.value})}/>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-2">Ubicación / Plataforma</label>
                <input type="text" className="w-full px-6 py-4 border-2 border-slate-100 rounded-2xl focus:border-emerald-600 outline-none font-black bg-slate-50/50" placeholder="Ej: Sede Social o Zoom" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})}/>
              </div>
              <div className="grid grid-cols-2 gap-6">
                 <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-2">Tipo</label>
                    <select className="w-full px-6 py-4 border-2 border-slate-100 rounded-2xl focus:border-emerald-600 outline-none font-black text-[11px] uppercase bg-slate-50/50" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as AssemblyType})}>
                      <option value={AssemblyType.ORDINARY}>Ordinaria</option>
                      <option value={AssemblyType.EXTRAORDINARY}>Extraordinaria</option>
                    </select>
                 </div>
                 <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-2">Estado</label>
                    <select className="w-full px-6 py-4 border-2 border-slate-100 rounded-2xl focus:border-emerald-600 outline-none font-black text-[11px] uppercase bg-slate-50/50" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as AssemblyStatus})}>
                      <option value={AssemblyStatus.SCHEDULED}>Programada</option>
                      <option value={AssemblyStatus.IN_PROGRESS}>En Curso</option>
                      <option value={AssemblyStatus.FINISHED}>Finalizada</option>
                    </select>
                 </div>
              </div>
              <div className="flex justify-end space-x-6 pt-6 border-t border-slate-50">
                <button type="button" onClick={closeForm} className="px-6 py-3 font-black text-slate-400 uppercase tracking-widest text-xs">Descartar</button>
                <button type="submit" className="px-10 py-4 bg-emerald-700 text-white rounded-[1.5rem] font-black shadow-2xl shadow-emerald-700/30 uppercase text-xs tracking-widest">Confirmar Asamblea</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssemblyManagement;
