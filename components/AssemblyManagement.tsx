
import React, { useState } from 'react';
import { Assembly, AssemblyType, AssemblyStatus, Member, BoardPosition } from '../types';
import { printAssemblyMinutes } from '../services/printService';

interface AssemblyManagementProps {
  assemblies: Assembly[];
  setAssemblies: React.Dispatch<React.SetStateAction<Assembly[]>>;
  members: Member[];
  board: BoardPosition[];
}

const AssemblyManagement: React.FC<AssemblyManagementProps> = ({ assemblies, setAssemblies, members, board }) => {
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

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      setAssemblies(prev => prev.map(a => a.id === editingId ? { ...a, ...formData } as Assembly : a));
    } else {
      const newAssembly: Assembly = {
        id: `AS-${Date.now().toString().slice(-6)}`,
        attendees: [],
        ...formData
      } as Assembly;
      setAssemblies(prev => [newAssembly, ...prev]);
    }
    closeForm();
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({
      date: new Date().toISOString().split('T')[0],
      summonsTime: '19:30',
      location: '',
      description: '',
      type: AssemblyType.ORDINARY,
      status: AssemblyStatus.SCHEDULED
    });
  };

  const handleEdit = (assembly: Assembly) => {
    setFormData(assembly);
    setEditingId(assembly.id);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('¿Está seguro de eliminar esta asamblea? Se perderán los registros asociados.')) {
      setAssemblies(prev => prev.filter(a => a.id !== id));
    }
  };

  const getStatusBadge = (status: AssemblyStatus) => {
    switch (status) {
      case AssemblyStatus.SCHEDULED: return 'bg-blue-100 text-blue-700 border-blue-200';
      case AssemblyStatus.IN_PROGRESS: return 'bg-emerald-100 text-emerald-700 border-emerald-200 animate-pulse';
      case AssemblyStatus.FINISHED: return 'bg-slate-100 text-slate-700 border-slate-200';
      default: return 'bg-slate-50 text-slate-400';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Programación de Asambleas</h2>
          <p className="text-slate-500">Planifique y gestione los encuentros del comité</p>
        </div>
        <button 
          onClick={() => setShowForm(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-xl font-bold transition shadow-lg shadow-emerald-100"
        >
          Nueva Asamblea
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {assemblies.length > 0 ? assemblies.map(assembly => (
          <div key={assembly.id} className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition group">
            <div className="flex justify-between items-start mb-4">
              <span className={`text-[10px] font-black uppercase px-2 py-1 rounded border ${getStatusBadge(assembly.status)}`}>
                {assembly.status}
              </span>
              <span className="text-[10px] font-bold text-slate-400">ID: {assembly.id}</span>
            </div>
            
            <h3 className="font-bold text-slate-800 text-lg line-clamp-2 min-h-[3.5rem] mb-2">{assembly.description}</h3>
            
            <div className="space-y-3 mb-6">
              <div className="flex items-center text-sm text-slate-600">
                <svg className="w-4 h-4 mr-2 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                {assembly.date} a las {assembly.summonsTime} hrs.
              </div>
              <div className="flex items-center text-sm text-slate-600">
                <svg className="w-4 h-4 mr-2 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                {assembly.location || 'Lugar por definir'}
              </div>
              <div className="flex items-center text-sm text-slate-600">
                <svg className="w-4 h-4 mr-2 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                Asamblea {assembly.type}
              </div>
            </div>

            <div className="flex justify-between items-center pt-4 border-t border-slate-50 group-hover:border-slate-100 transition">
              <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition">
                <button 
                  onClick={() => handleEdit(assembly)}
                  className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                  title="Editar"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                </button>
                <button 
                  onClick={() => handleDelete(assembly.id)}
                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                  title="Eliminar"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>
              {assembly.status === AssemblyStatus.FINISHED && (
                <button 
                  onClick={() => printAssemblyMinutes(assembly, members, board)}
                  className="px-4 py-1.5 bg-emerald-50 text-emerald-700 text-xs font-black rounded-lg hover:bg-emerald-100 transition flex items-center"
                >
                  <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                  IMPRIMIR ACTA
                </button>
              )}
            </div>
          </div>
        )) : (
          <div className="col-span-full py-20 text-center text-slate-400">
            <svg className="w-16 h-16 mx-auto mb-4 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            <p className="text-lg font-medium">No hay asambleas programadas</p>
            <p className="text-sm">Comience creando una nueva asamblea para el comité.</p>
          </div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 backdrop-blur-md">
          <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-emerald-600 p-8 text-white">
               <h3 className="text-2xl font-black">{editingId ? 'Editar' : 'Nueva'} Asamblea</h3>
               <p className="text-emerald-100 text-sm mt-1">Defina los detalles del encuentro oficial.</p>
            </div>
            
            <form onSubmit={handleSave} className="p-8 space-y-5">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Descripción o Motivo</label>
                <input 
                  type="text"
                  required
                  placeholder="Ej: Asamblea Ordinaria de Cierre de Año"
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 font-bold outline-none focus:border-emerald-500"
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Fecha</label>
                  <input 
                    type="date"
                    required
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 font-bold outline-none"
                    value={formData.date}
                    onChange={e => setFormData({...formData, date: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Hora de Citación</label>
                  <input 
                    type="time"
                    required
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 font-bold outline-none"
                    value={formData.summonsTime}
                    onChange={e => setFormData({...formData, summonsTime: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Lugar de Reunión</label>
                <input 
                  type="text"
                  required
                  placeholder="Ej: Sede Social, Plaza, etc."
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 font-bold outline-none focus:border-emerald-500"
                  value={formData.location}
                  onChange={e => setFormData({...formData, location: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Tipo</label>
                  <select 
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 font-bold outline-none"
                    value={formData.type}
                    onChange={e => setFormData({...formData, type: e.target.value as AssemblyType})}
                  >
                    <option value={AssemblyType.ORDINARY}>Ordinaria</option>
                    <option value={AssemblyType.EXTRAORDINARY}>Extraordinaria</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Estado Inicial</label>
                  <select 
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 font-bold outline-none"
                    value={formData.status}
                    onChange={e => setFormData({...formData, status: e.target.value as AssemblyStatus})}
                  >
                    <option value={AssemblyStatus.SCHEDULED}>Programada</option>
                    <option value={AssemblyStatus.IN_PROGRESS}>En Curso</option>
                    <option value={AssemblyStatus.FINISHED}>Finalizada</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-4 pt-6">
                <button 
                  type="button"
                  onClick={closeForm}
                  className="px-6 py-3 text-slate-400 font-bold hover:text-slate-600 transition"
                >Cancelar</button>
                <button 
                  type="submit"
                  className="px-10 py-3 bg-emerald-600 text-white rounded-2xl font-black shadow-xl shadow-emerald-100 hover:bg-emerald-700 transition"
                >
                  {editingId ? 'ACTUALIZAR' : 'GUARDAR ASAMBLEA'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssemblyManagement;
