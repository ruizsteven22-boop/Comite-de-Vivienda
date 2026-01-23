
import React, { useState, useEffect } from 'react';
import { Assembly, Member, AssemblyStatus, AssemblyType, BoardPosition, BoardRole, User } from '../types';
import { Icons } from '../constants';
import { generateAssemblyReminderText, generateMassNotificationDraft } from '../services/geminiService';
import { printAssemblyMinutes, printAttendanceReport } from '../services/printService';
import { formatRut } from '../services/utils';

interface AttendanceProps {
  members: Member[];
  assemblies: Assembly[];
  setAssemblies: React.Dispatch<React.SetStateAction<Assembly[]>>;
  board: BoardPosition[];
  currentUser: User;
}

const Attendance: React.FC<AttendanceProps> = ({ members, assemblies, setAssemblies, board, currentUser }) => {
  const [selectedAssemblyId, setSelectedAssemblyId] = useState('');
  const [rutInput, setRutInput] = useState('');
  const [feedback, setFeedback] = useState<{msg: string, type: 'success' | 'error'} | null>(null);

  useEffect(() => {
    if (assemblies.length > 0 && !selectedAssemblyId) {
      // Intentar seleccionar la asamblea más reciente que no esté finalizada, o la primera de la lista
      const active = assemblies.find(a => a.status === AssemblyStatus.IN_PROGRESS);
      const scheduled = assemblies.find(a => a.status === AssemblyStatus.SCHEDULED);
      setSelectedAssemblyId(active?.id || scheduled?.id || assemblies[0].id);
    }
  }, [assemblies, selectedAssemblyId]);

  const canEdit = currentUser.role === 'SUPPORT' || 
                  currentUser.role === 'ADMINISTRATOR' || 
                  currentUser.role === BoardRole.PRESIDENT || 
                  currentUser.role === BoardRole.SECRETARY;

  const selectedAssembly = assemblies.find(a => a.id === selectedAssemblyId);

  const handleMarkAttendance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssembly || !canEdit) return;
    const member = members.find(m => m.rut === rutInput);
    if (!member) { 
      setFeedback({ msg: "Socio no encontrado", type: 'error' });
      setTimeout(() => setFeedback(null), 3000);
      return; 
    }
    if (selectedAssembly.attendees.includes(member.rut)) {
      setFeedback({ msg: `${member.name} ya registrado`, type: 'error' });
      setRutInput('');
      setTimeout(() => setFeedback(null), 3000);
      return;
    }

    setAssemblies(prev => prev.map(a => a.id === selectedAssemblyId ? { ...a, attendees: [...a.attendees, member.rut] } : a));
    setFeedback({ msg: `Asistencia: ${member.name}`, type: 'success' });
    setRutInput('');
    setTimeout(() => setFeedback(null), 3000);
  };

  const updateAssemblyStatus = (status: AssemblyStatus) => {
    if (!canEdit) return;
    setAssemblies(prev => prev.map(a => a.id === selectedAssemblyId ? { ...a, status } : a));
  };

  const quorum = selectedAssembly ? Math.round((selectedAssembly.attendees.length / members.length) * 100) : 0;

  return (
    <div className="space-y-10">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tighter">Control de <span className="text-emerald-700">Asistencia</span></h2>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-2">Registro Biométrico / Manual de Sesiones</p>
        </div>
        <div className="flex bg-white px-6 py-4 rounded-3xl shadow-sm border border-slate-100 items-center space-x-6">
           <div className="text-center">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total Socios</p>
              <p className="text-xl font-black text-slate-800">{members.length}</p>
           </div>
           <div className="w-px h-8 bg-slate-100"></div>
           <div className="text-center">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Presentes</p>
              <p className="text-xl font-black text-emerald-600">{selectedAssembly?.attendees.length || 0}</p>
           </div>
           <div className="w-px h-8 bg-slate-100"></div>
           <div className="text-center">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Quórum</p>
              <p className={`text-xl font-black ${quorum >= 50 ? 'text-emerald-600' : 'text-amber-500'}`}>{quorum}%</p>
           </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-8">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-2">Seleccionar Asamblea Activa</label>
              <select 
                className="w-full px-6 py-4 border-2 border-slate-100 rounded-2xl bg-slate-50 font-black text-sm outline-none focus:border-emerald-600"
                value={selectedAssemblyId}
                onChange={e => setSelectedAssemblyId(e.target.value)}
              >
                {assemblies.length === 0 && <option value="">No hay asambleas</option>}
                {assemblies.map(a => <option key={a.id} value={a.id}>{a.date} - {a.description}</option>)}
              </select>
            </div>

            {selectedAssembly?.status === AssemblyStatus.IN_PROGRESS && canEdit ? (
              <form onSubmit={handleMarkAttendance} className="space-y-6 animate-in fade-in zoom-in-95">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-2">Identificar Socio (RUT)</label>
                  <input 
                    className="w-full px-6 py-5 border-2 border-emerald-100 rounded-2xl text-center font-mono text-xl font-black text-emerald-900 bg-emerald-50 focus:border-emerald-600 outline-none transition" 
                    placeholder="12.345.678-9" 
                    autoFocus
                    value={rutInput} 
                    onChange={e => setRutInput(formatRut(e.target.value))}
                  />
                </div>
                <button type="submit" className="w-full py-5 bg-emerald-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-emerald-900/20 hover:bg-emerald-800 transition">Registrar Presente</button>
                
                {feedback && (
                  <div className={`p-4 rounded-xl text-center text-xs font-black uppercase tracking-widest animate-in slide-in-from-top-4 ${feedback.type === 'success' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                    {feedback.msg}
                  </div>
                )}
              </form>
            ) : (
              <div className="py-12 text-center bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-100">
                <p className="text-slate-400 font-bold italic text-sm px-6">
                  {selectedAssembly?.status === AssemblyStatus.FINISHED ? 'Esta asamblea ha sido finalizada y el acta ya está disponible.' : 'La asamblea debe estar en estado "En Curso" para habilitar el registro de asistencia.'}
                </p>
              </div>
            )}

            {canEdit && selectedAssembly?.status === AssemblyStatus.SCHEDULED && (
              <button onClick={() => updateAssemblyStatus(AssemblyStatus.IN_PROGRESS)} className="w-full py-6 bg-emerald-700 text-white rounded-3xl font-black text-sm uppercase tracking-[0.2em] shadow-2xl shadow-emerald-900/30 active:scale-95 transition">ABRIR SESIÓN</button>
            )}

            {canEdit && selectedAssembly?.status === AssemblyStatus.IN_PROGRESS && (
              <button onClick={() => updateAssemblyStatus(AssemblyStatus.FINISHED)} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black transition">FINALIZAR ASAMBLEA</button>
            )}
          </div>

          {selectedAssembly?.status === AssemblyStatus.FINISHED && (
            <div className="bg-slate-900 text-white p-8 rounded-[2rem] space-y-4">
               <h4 className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Documentación Generada</h4>
               <p className="text-xs text-slate-300">El registro de asistencia para esta asamblea está cerrado. Puede imprimir el reporte oficial o el acta de la sesión.</p>
               <div className="flex space-x-2">
                 <button onClick={() => printAttendanceReport(selectedAssembly, members, board)} className="flex-1 py-3 bg-white/10 hover:bg-white/20 rounded-xl font-bold text-[10px] uppercase tracking-widest transition">Reporte</button>
                 <button onClick={() => printAssemblyMinutes(selectedAssembly, members, board)} className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 rounded-xl font-bold text-[10px] uppercase tracking-widest transition">Acta PDF</button>
               </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-2 bg-white rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col overflow-hidden">
          <div className="p-8 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Lista de Presentes</h3>
            <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">{selectedAssembly?.attendees.length || 0} de {members.length}</span>
          </div>
          <div className="flex-1 overflow-y-auto p-8 grid grid-cols-1 md:grid-cols-2 gap-4 content-start max-h-[600px]">
            {selectedAssembly?.attendees.length ? [...selectedAssembly.attendees].reverse().map((rut, i) => {
              const member = members.find(m => m.rut === rut);
              return (
                <div key={i} className="flex items-center space-x-4 p-4 bg-slate-50 border border-slate-100 rounded-2xl animate-in slide-in-from-left-4 duration-300" style={{ animationDelay: `${i * 50}ms` }}>
                  <img src={member?.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(member?.name || 'S')}&background=cbd5e1&color=fff`} className="w-10 h-10 rounded-xl object-cover" />
                  <div className="flex-1 overflow-hidden">
                    <p className="font-black text-slate-800 text-sm truncate">{member?.name || 'Socio Desconocido'}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">{rut}</p>
                  </div>
                  <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
                </div>
              );
            }) : (
              <div className="col-span-full py-20 text-center flex flex-col items-center justify-center space-y-4">
                 <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center text-slate-200">
                   <Icons.Clipboard />
                 </div>
                 <p className="text-slate-400 font-bold italic text-sm">Aún no se registran asistentes para esta sesión.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Attendance;
