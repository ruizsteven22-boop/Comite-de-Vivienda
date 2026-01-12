
import React, { useState } from 'react';
import { Assembly, AssemblyType, AssemblyStatus, Member, BoardPosition, User, BoardRole } from '../types';
import { printAssemblyMinutes } from '../services/printService';
// Fix: Import Icons from constants to allow access to Icons.Dashboard
import { Icons } from '../constants';

interface AssemblyManagementProps {
  assemblies: Assembly[];
  setAssemblies: React.Dispatch<React.SetStateAction<Assembly[]>>;
  members: Member[];
  board: BoardPosition[];
  currentUser: User;
}

const AssemblyManagement: React.FC<AssemblyManagementProps> = ({ assemblies, setAssemblies, members, board, currentUser }) => {
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
      case AssemblyStatus.SCHEDULED: return 'bg-blue-100 text-blue-700 border-blue-200';
      case AssemblyStatus.IN_PROGRESS: return 'bg-emerald-100 text-emerald-700 border-emerald-200';
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
        {canEdit && (
          <button onClick={() => setShowForm(true)} className="bg-emerald-600 text-white px-6 py-2 rounded-xl font-bold">Nueva Asamblea</button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {assemblies.map(assembly => (
          <div key={assembly.id} className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
            <div className="flex justify-between items-start mb-4">
              <span className={`text-[10px] font-black uppercase px-2 py-1 rounded border ${getStatusBadge(assembly.status)}`}>{assembly.status}</span>
            </div>
            <h3 className="font-bold text-slate-800 text-lg mb-2">{assembly.description}</h3>
            <p className="text-sm text-slate-500">📅 {assembly.date} • ⏰ {assembly.summonsTime}</p>
            <div className="flex justify-end space-x-2 mt-4">
              {canEdit && <button onClick={() => handleEdit(assembly)} className="p-2 text-slate-400 hover:text-emerald-600"><Icons.Dashboard /></button>}
              {assembly.status === AssemblyStatus.FINISHED && (
                <button onClick={() => printAssemblyMinutes(assembly, members, board)} className="px-4 py-1.5 bg-emerald-50 text-emerald-700 text-xs font-black rounded-lg">IMPRIMIR ACTA</button>
              )}
            </div>
          </div>
        ))}
      </div>

      {showForm && canEdit && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-[32px] w-full max-w-lg p-8">
            <h3 className="text-2xl font-black mb-6">Gestionar Asamblea</h3>
            <form onSubmit={handleSave} className="space-y-4">
              <input type="text" required className="w-full px-4 py-3 border rounded-xl" placeholder="Motivo" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}/>
              <div className="grid grid-cols-2 gap-4">
                <input type="date" className="w-full px-4 py-3 border rounded-xl" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})}/>
                <input type="time" className="w-full px-4 py-3 border rounded-xl" value={formData.summonsTime} onChange={e => setFormData({...formData, summonsTime: e.target.value})}/>
              </div>
              <div className="flex justify-end space-x-4 pt-6">
                <button type="button" onClick={closeForm} className="px-6 py-3 text-slate-400">Cancelar</button>
                <button type="submit" className="px-10 py-3 bg-emerald-600 text-white rounded-2xl font-black">GUARDAR</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssemblyManagement;
