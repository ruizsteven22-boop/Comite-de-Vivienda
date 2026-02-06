
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
      setSelectedAssemblyId(active?.id || scheduled?.id || assemblies[0]?.id || '');
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
    
    const cleanInput = rutInput.replace(/[^0-9kK]/g, '').toLowerCase();
    const member = members.find(m => m.rut.replace(/[^0-9kK]/g, '').toLowerCase() === cleanInput);
    
    if (!member) { 
      setFeedback({ msg: "Socio no encontrado", type: 'error' });
      setTimeout(() => setFeedback(null), 3000);
      return; 
    }
    
    if (selectedAssembly.attendees.includes(member.rut)) {
      setFeedback({ msg: `${member.name} ya está registrado`, type: 'error' });
      setRutInput('');
      setTimeout(() => setFeedback(null), 3000);
      return;
    }

    setAssemblies(prev => prev.map(a => a.id === selectedAssemblyId ? { ...a, attendees: [...a.attendees, member.rut] } : a));
    setFeedback({ msg: `Presente: ${member.name}`, type: 'success' });
    setRutInput('');
    setTimeout(() => setFeedback(null), 3000);
  };

  const updateAssemblyStatus = (status: AssemblyStatus) => {
    if (!canEdit) return;
    setAssemblies(prev => prev.map(a => a.id === selectedAssemblyId ? { ...a, status, startTime: status === AssemblyStatus.IN_PROGRESS ? new Date().toLocaleTimeString() : a.startTime } : a));
  };

  const totalMembers = members.length;
  const presentCount = selectedAssembly?.attendees.length || 0;
  const quorumValue = totalMembers > 0 ? Math.round((presentCount / totalMembers) * 100) : 0;
  const isQuorumValid = quorumValue >= 50;

  const filteredMembers = members.filter(m => 
    m.name.toLowerCase().includes(listSearch.toLowerCase()) || 
    m.rut.toLowerCase().includes(listSearch.toLowerCase())
  );

  return (
    <div className="space-y-10 pb-12">
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div className="page-transition">
          <h2 className="text-4xl font-black text-slate-900 tracking-tighter">Control de <span className="text-emerald-700">Asistencia</span></h2>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-2">Gestión de Quórum y Participación • {config.tradeName}</p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 flex-1 lg:max-w-2xl">
           <div className="px-4">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Socios Comité</p>
              <p className="text-2xl font-black text-slate-800">{totalMembers}</p>
           </div>
           <div className="px-4 border-l border-slate-100">
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Presentes</p>
              <p className="text-2xl font-black text-emerald-600">{presentCount}</p>
           </div>
           <div className="px-4 border-l border-slate-100 col-span-2 md:col-span-1 pt-4 md:pt-0">
              <div className="flex justify-between items-center mb-1">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Quórum {quorumValue}%</p>
                <span className={`text-[8px] font-black px-2 py-0.5 rounded-md ${isQuorumValid ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-600'}`}>
                  {isQuorumValid ? 'VÁLIDO' : 'INSUFICIENTE'}
                </span>
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                 <div className={`h-full transition-all duration-1000 ${isQuorumValid ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${Math.min(quorumValue, 100)}%` }}></div>
              </div>
           </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-8 h-fit">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-2">Seleccionar Asamblea</label>
              <div className="relative">
                <select 
                  className="w-full px-6 py-4 border-2 border-slate-100 rounded-2xl bg-slate-50 font-black text-sm outline-none focus:border-emerald-600 appearance-none transition-all cursor-pointer"
                  value={selectedAssemblyId}
                  onChange={e => setSelectedAssemblyId(e.target.value)}
                >
                  {assemblies.length === 0 && <option value="">No hay asambleas registradas</option>}
                  {assemblies.map(a => (
                    <option key={a.id} value={a.id}>
                      {a.date} - {a.description.length > 25 ? a.description.slice(0, 25) + '...' : a.description}
                    </option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" /></svg>
                </div>
              </div>
            </div>

            {selectedAssembly?.status === AssemblyStatus.IN_PROGRESS && canEdit ? (
              <form onSubmit={handleMarkAttendance} className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
                <div className="p-8 bg-emerald-50 rounded-[2.5rem] border-2 border-emerald-100 shadow-inner">
                  <label className="block text-[10px] font-black text-emerald-800 uppercase tracking-[0.2em] mb-4 text-center">Registro Rápido (RUT)</label>
                  <input 
                    className="w-full px-4 py-6 border-2 border-white rounded-2xl text-center font-mono text-3xl font-black text-emerald-900 bg-white shadow-lg focus:ring-8 focus:ring-emerald-200/50 outline-none transition-all uppercase placeholder:text-emerald-100" 
                    placeholder="12.345.678-9" 
                    autoFocus
                    value={rutInput} 
                    onChange={e => setRutInput(formatRut(e.target.value))}
                  />
                </div>
                <button type="submit" className="w-full py-5 bg-emerald-700 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-emerald-900/30 hover:bg-emerald-800 transition active:scale-95">Registrar Socio</button>
                
                {feedback && (
                  <div className={`p-4 rounded-2xl text-center text-[10px] font-black uppercase tracking-widest border-2 animate-in zoom-in-95 ${
                    feedback.type === 'success' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-rose-100 text-rose-800 border-rose-200'
                  }`}>
                    {feedback.msg}
                  </div>
                )}
              </form>
            ) : (
              <div className="py-16 text-center bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200">
                <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center mx-auto mb-6 text-slate-300 shadow-sm">
                  <Icons.Clipboard />
                </div>
                <p className="text-slate-400 font-bold italic text-xs px-10 leading-relaxed">
                  {selectedAssembly?.status === AssemblyStatus.FINISHED 
                    ? 'Registro cerrado. El acta final ya ha sido generada.' 
                    : 'La asamblea debe estar marcada como "En Curso" para habilitar el registro.'}
                </p>
              </div>
            )}

            <div className="pt-8 border-t border-slate-50 space-y-4">
              {canEdit && selectedAssembly?.status === AssemblyStatus.SCHEDULED && (
                <button onClick={() => updateAssemblyStatus(AssemblyStatus.IN_PROGRESS)} className="w-full py-5 bg-slate-900 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-black transition active:scale-95">Iniciar Asamblea</button>
              )}

              {canEdit && selectedAssembly?.status === AssemblyStatus.IN_PROGRESS && (
                <button onClick={() => updateAssemblyStatus(AssemblyStatus.FINISHED)} className="w-full py-5 bg-slate-900 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] hover:bg-black transition shadow-xl">Finalizar y Cerrar Acta</button>
              )}
              
              {selectedAssembly?.status === AssemblyStatus.FINISHED && (
                 <button onClick={() => printAssemblyMinutes(selectedAssembly, members, board, config)} className="w-full py-5 bg-emerald-700 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-emerald-800 transition">Descargar Acta Oficial</button>
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 bg-white rounded-[3rem] shadow-sm border border-slate-100 flex flex-col overflow-hidden h-[800px]">
          <div className="p-10 border-b border-slate-50 bg-slate-50/50 flex flex-col md:flex-row justify-between items-center gap-6">
            <div>
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Panel de Auditoría</h3>
              <p className="text-xl font-black text-slate-900 mt-1">{selectedAssembly?.status === AssemblyStatus.FINISHED ? 'Resumen Final de Asistencia' : 'Socios en Tiempo Real'}</p>
            </div>
            <div className="relative w-full md:w-80">
              <input 
                type="text" 
                placeholder="Filtrar integrantes..." 
                className="w-full pl-12 pr-6 py-4 bg-white border-2 border-slate-100 rounded-2xl text-xs font-bold outline-none focus:border-emerald-600 shadow-inner transition-all"
                value={listSearch}
                onChange={e => setListSearch(e.target.value)}
              />
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </div>
            </div>
          </div>
          
          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-400 text-[9px] uppercase tracking-[0.2em] font-black sticky top-0 z-10">
                <tr>
                  <th className="px-10 py-5">Socio Identificado</th>
                  <th className="px-10 py-5">RUT / Identificador</th>
                  <th className="px-10 py-5 text-right">Estatus</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredMembers.map(member => {
                  const isPresent = selectedAssembly?.attendees.includes(member.rut);
                  
                  // En modo "En Curso", podemos resaltar a los que acaban de llegar
                  // o simplemente mostrar a todos con su estado.
                  
                  return (
                    <tr key={member.id} className={`hover:bg-slate-50 transition-colors group ${!isPresent && selectedAssembly?.status === AssemblyStatus.FINISHED ? 'opacity-40 grayscale-[0.5]' : ''}`}>
                      <td className="px-10 py-5">
                        <div className="flex items-center space-x-4">
                          <img 
                            src={member.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=f1f5f9&color=94a3b8&bold=true&size=128`} 
                            className={`w-12 h-12 rounded-2xl object-cover shadow-sm border-2 ${isPresent ? 'border-emerald-200' : 'border-slate-100'}`} 
                          />
                          <div>
                            <p className={`font-black text-sm leading-tight ${isPresent ? 'text-slate-900' : 'text-slate-500'}`}>{member.name}</p>
                            <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Socio Activo</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-10 py-5">
                        <p className="font-mono text-[10px] font-bold text-slate-400 tracking-tighter">{member.rut}</p>
                      </td>
                      <td className="px-10 py-5 text-right">
                        <div className="flex flex-col items-end">
                          <span className={`text-[8px] font-black uppercase px-3 py-1.5 rounded-xl border-2 transition-all ${
                            isPresent 
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-100 shadow-sm shadow-emerald-100/50' 
                              : 'bg-slate-50 text-slate-400 border-slate-100'
                          }`}>
                            {isPresent ? 'Presente en Sala' : 'Pendiente / Ausente'}
                          </span>
                          {isPresent && selectedAssembly?.status === AssemblyStatus.IN_PROGRESS && (
                            <div className="flex items-center mt-2 space-x-1.5">
                              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                              <span className="text-[7px] font-black text-emerald-400 uppercase tracking-widest">Sincronizado</span>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredMembers.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-10 py-20 text-center">
                      <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-4 text-slate-200">
                        <Icons.Users />
                      </div>
                      <p className="text-slate-400 font-bold italic text-xs">No se encontraron socios con este filtro.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          <div className="p-8 bg-slate-50/50 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
             <div className="flex items-center space-x-3">
                <div className="flex -space-x-3">
                  {members.slice(0, 3).map(m => (
                    <img key={m.id} src={m.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(m.name)}&size=32`} className="w-8 h-8 rounded-full border-2 border-white object-cover" />
                  ))}
                  {members.length > 3 && <div className="w-8 h-8 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-[10px] font-black text-slate-500">+{members.length - 3}</div>}
                </div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Validación de Quórum en Línea</p>
             </div>
             {selectedAssembly && (
               <button 
                 onClick={() => printAttendanceReport(selectedAssembly, members, board, config)} 
                 className="px-6 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-slate-50 transition shadow-sm active:scale-95"
               >
                 Exportar Nómina de Firmas
               </button>
             )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Attendance;
