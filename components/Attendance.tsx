
import React, { useState, useEffect } from 'react';
import { Assembly, Member, AssemblyStatus, AssemblyType, BoardPosition, BoardRole, User, CommitteeConfig } from '../types';
import { Icons } from '../constants';
import { printAssemblyMinutes, printAttendanceReport } from '../services/printService';
import { formatRut } from '../services/utils';

interface AttendanceProps {
  members: Member[];
  assemblies: Assembly[];
  setAssemblies: React.Dispatch<React.SetStateAction<Assembly[]>>;
  board: BoardPosition[];
  currentUser: User;
  config: CommitteeConfig;
}

const Attendance: React.FC<AttendanceProps> = ({ members, assemblies, setAssemblies, board, currentUser, config }) => {
  const [selectedAssemblyId, setSelectedAssemblyId] = useState('');
  const [rutInput, setRutInput] = useState('');
  const [listSearch, setListSearch] = useState('');
  const [feedback, setFeedback] = useState<{msg: string, type: 'success' | 'error'} | null>(null);

  useEffect(() => {
    if (assemblies.length > 0 && !selectedAssemblyId) {
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
  const isFinished = selectedAssembly?.status === AssemblyStatus.FINISHED;
  
  const attendanceData = members
    .filter(m => m.name.toLowerCase().includes(listSearch.toLowerCase()) || m.rut.includes(listSearch))
    .map(member => ({
      ...member,
      isPresent: selectedAssembly?.attendees.includes(member.rut) || false
    }));

  const attendeesOnly = selectedAssembly?.attendees
    .map(rut => members.find(m => m.rut === rut))
    .filter(Boolean) as Member[];

  return (
    <div className="space-y-10 pb-12">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="page-transition">
          <h2 className="text-4xl font-black text-slate-900 tracking-tighter">Control de <span className="text-emerald-700">Asistencia</span></h2>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-2">Registro de Sesiones {config.tradeName}</p>
        </div>
        <div className="flex bg-white px-8 py-5 rounded-[2rem] shadow-sm border border-slate-100 items-center space-x-8">
           <div className="text-center">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Socios</p>
              <p className="text-2xl font-black text-slate-800 leading-none">{members.length}</p>
           </div>
           <div className="w-px h-10 bg-slate-100"></div>
           <div className="text-center">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Presentes</p>
              <p className="text-2xl font-black text-emerald-600 leading-none">{selectedAssembly?.attendees.length || 0}</p>
           </div>
           <div className="w-px h-10 bg-slate-100"></div>
           <div className="text-center">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Quórum Final</p>
              <p className={`text-2xl font-black leading-none ${quorum >= 50 ? 'text-emerald-600' : 'text-amber-500'}`}>{quorum}%</p>
           </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-8 h-fit">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-2">Asamblea a Gestionar</label>
              <div className="relative">
                <select 
                  className="w-full px-6 py-4 border-2 border-slate-100 rounded-2xl bg-slate-50 font-black text-sm outline-none focus:border-emerald-600 appearance-none transition-all"
                  value={selectedAssemblyId}
                  onChange={e => setSelectedAssemblyId(e.target.value)}
                >
                  {assemblies.length === 0 && <option value="">No hay asambleas registradas</option>}
                  {assemblies.map(a => <option key={a.id} value={a.id}>{a.date} - {a.description}</option>)}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" /></svg>
                </div>
              </div>
            </div>

            {selectedAssembly?.status === AssemblyStatus.IN_PROGRESS && canEdit ? (
              <form onSubmit={handleMarkAttendance} className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
                <div className="p-6 bg-emerald-50 rounded-[2rem] border-2 border-emerald-100">
                  <label className="block text-[10px] font-black text-emerald-700 uppercase tracking-widest mb-3 text-center">Escanear o Ingresar RUT</label>
                  <input 
                    className="w-full px-4 py-5 border-2 border-white rounded-2xl text-center font-mono text-2xl font-black text-emerald-900 bg-white shadow-inner focus:ring-4 focus:ring-emerald-100 outline-none transition uppercase" 
                    placeholder="12.345.678-9" 
                    autoFocus
                    value={rutInput} 
                    onChange={e => setRutInput(formatRut(e.target.value))}
                  />
                </div>
                <button type="submit" className="w-full py-5 bg-emerald-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-emerald-900/20 hover:bg-emerald-800 transition active:scale-95">Registrar Asistencia</button>
                
                {feedback && (
                  <div className={`p-4 rounded-xl text-center text-xs font-black uppercase tracking-widest animate-in slide-in-from-top-4 ${feedback.type === 'success' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                    {feedback.msg}
                  </div>
                )}
              </form>
            ) : (
              <div className="py-12 text-center bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-100">
                <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center mx-auto mb-4 text-slate-200 shadow-sm">
                  <Icons.Clipboard />
                </div>
                <p className="text-slate-400 font-bold italic text-xs px-6">
                  {selectedAssembly?.status === AssemblyStatus.FINISHED 
                    ? 'Esta sesión ha concluido. El registro de asistencia está cerrado.' 
                    : 'La asamblea debe estar "En Curso" para habilitar el registro en tiempo real.'}
                </p>
              </div>
            )}

            <div className="pt-6 border-t border-slate-50 space-y-3">
              {canEdit && selectedAssembly?.status === AssemblyStatus.SCHEDULED && (
                <button onClick={() => updateAssemblyStatus(AssemblyStatus.IN_PROGRESS)} className="w-full py-5 bg-emerald-700 text-white rounded-3xl font-black text-sm uppercase tracking-[0.2em] shadow-2xl shadow-emerald-900/30 active:scale-95 transition">ABRIR SESIÓN</button>
              )}

              {canEdit && selectedAssembly?.status === AssemblyStatus.IN_PROGRESS && (
                <button onClick={() => updateAssemblyStatus(AssemblyStatus.FINISHED)} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-black transition">CERRAR REGISTRO Y FINALIZAR</button>
              )}
            </div>
          </div>

          {selectedAssembly?.status === AssemblyStatus.FINISHED && (
            <div className="bg-slate-900 text-white p-10 rounded-[2.5rem] space-y-6 shadow-2xl animate-in fade-in slide-in-from-left-4">
               <div className="flex items-center space-x-4">
                 <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-xl"><Icons.Shield /></div>
                 <h4 className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Expediente de Sesión</h4>
               </div>
               <p className="text-xs text-slate-400 leading-relaxed font-medium">El quórum final del <strong>{quorum}%</strong> es {quorum >= 50 ? 'válido para la toma de decisiones' : 'insuficiente para acuerdos resolutivos'} según estatutos vigentes.</p>
               <div className="flex flex-col space-y-3 pt-4 border-t border-white/5">
                 <button onClick={() => printAttendanceReport(selectedAssembly, members, board, config)} className="w-full py-4 bg-white/10 hover:bg-white/20 rounded-2xl font-black text-[10px] uppercase tracking-widest transition flex items-center justify-center">
                   <span className="mr-2 text-lg">📄</span> Reporte de Asistencia
                 </button>
                 <button onClick={() => printAssemblyMinutes(selectedAssembly, members, board, config)} className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 rounded-2xl font-black text-[10px] uppercase tracking-widest transition flex items-center justify-center shadow-lg shadow-emerald-900/40">
                   <span className="mr-2 text-lg">⚖️</span> Generar Acta PDF
                 </button>
               </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-2 bg-white rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col overflow-hidden h-[750px]">
          <div className="p-8 border-b border-slate-50 bg-slate-50/50 flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{isFinished ? 'Nómina Auditoría de Asistencia' : 'Registro de Presentes'}</h3>
              <p className="text-sm font-black text-slate-900 mt-1">{isFinished ? 'Visión completa de cumplimiento' : 'Seguimiento en tiempo real'}</p>
            </div>
            <div className="relative w-full md:w-64">
              <input 
                type="text" 
                placeholder="Filtrar socio..." 
                className="w-full pl-10 pr-4 py-2 bg-white border-2 border-slate-100 rounded-xl text-xs font-bold outline-none focus:border-emerald-600 transition-all"
                value={listSearch}
                onChange={e => setListSearch(e.target.value)}
              />
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </div>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-8 grid grid-cols-1 md:grid-cols-2 gap-4 content-start bg-slate-50/30">
            {isFinished ? (
              // Vista detallada de Asistencia (Finalizada)
              attendanceData.map((item, i) => (
                <div key={item.id} className={`flex items-center space-x-4 p-5 rounded-[1.5rem] border-2 transition-all ${
                  item.isPresent 
                    ? 'bg-white border-emerald-50 shadow-sm' 
                    : 'bg-slate-100/50 border-slate-100 opacity-60 grayscale-[0.5]'
                }`}>
                  <img src={item.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(item.name)}&background=${item.isPresent ? '10b981' : 'cbd5e1'}&color=fff`} className="w-12 h-12 rounded-2xl object-cover shadow-sm" />
                  <div className="flex-1 overflow-hidden">
                    <p className={`font-black text-sm truncate ${item.isPresent ? 'text-slate-900' : 'text-slate-500'}`}>{item.name}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">{item.rut}</p>
                  </div>
                  <div className={`text-[8px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg ${
                    item.isPresent ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'
                  }`}>
                    {item.isPresent ? 'Presente' : 'Ausente'}
                  </div>
                </div>
              ))
            ) : attendeesOnly.length ? (
              // Vista de tiempo real (Solo presentes)
              attendeesOnly.slice().reverse().map((member, i) => (
                <div key={member.id} className="flex items-center space-x-4 p-5 bg-white border-2 border-emerald-50 rounded-[1.5rem] shadow-sm animate-in slide-in-from-left-4 duration-300">
                  <img src={member.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=10b981&color=fff`} className="w-12 h-12 rounded-2xl object-cover" />
                  <div className="flex-1 overflow-hidden">
                    <p className="font-black text-slate-900 text-sm truncate">{member.name}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">{member.rut}</p>
                  </div>
                  <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.6)] animate-pulse"></div>
                </div>
              ))
            ) : (
              // Empty State
              <div className="col-span-full py-32 text-center flex flex-col items-center justify-center space-y-6">
                 <div className="w-24 h-24 rounded-full bg-white flex items-center justify-center text-slate-200 shadow-sm border border-slate-50">
                   <Icons.Clipboard />
                 </div>
                 <div className="max-w-xs">
                    <p className="text-slate-900 font-black text-lg">No hay registros aún</p>
                    <p className="text-slate-400 font-medium text-xs mt-2 italic leading-relaxed">
                      {selectedAssembly?.status === AssemblyStatus.SCHEDULED 
                        ? 'La lista se poblará automáticamente una vez que inicie la sesión.' 
                        : 'Comience a ingresar los RUT de los socios para ver la lista en tiempo real.'}
                    </p>
                 </div>
              </div>
            )}
          </div>
          
          <div className="p-6 bg-slate-50 border-t border-slate-100 text-center">
             <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Registro Digital Segurizado • Sistema Tierra Esperanza 2024</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Attendance;
