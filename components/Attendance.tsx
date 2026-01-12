
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
  const [selectedAssemblyId, setSelectedAssemblyId] = useState(assemblies[0]?.id || '');
  const [rutInput, setRutInput] = useState('');
  const [feedback, setFeedback] = useState<{msg: string, type: 'success' | 'error'} | null>(null);
  const [sentReminders, setSentReminders] = useState<string[]>([]);

  const canEdit = currentUser.role === 'SUPPORT' || 
                  currentUser.role === 'ADMINISTRATOR' || 
                  currentUser.role === BoardRole.PRESIDENT || 
                  currentUser.role === BoardRole.SECRETARY;

  const selectedAssembly = assemblies.find(a => a.id === selectedAssemblyId);

  const handleMarkAttendance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssembly || !canEdit) return;
    const member = members.find(m => m.rut === rutInput);
    if (!member) { alert("Socio no encontrado"); return; }
    if (selectedAssembly.attendees.includes(member.rut)) return;

    setAssemblies(prev => prev.map(a => a.id === selectedAssemblyId ? { ...a, attendees: [...a.attendees, member.rut] } : a));
    setFeedback({ msg: `Asistencia: ${member.name}`, type: 'success' });
    setRutInput('');
    setTimeout(() => setFeedback(null), 3000);
  };

  const updateAssemblyStatus = (status: AssemblyStatus) => {
    if (!canEdit) return;
    setAssemblies(prev => prev.map(a => a.id === selectedAssemblyId ? { ...a, status } : a));
  };

  return (
    <div className="space-y-8">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Centro de Asistencia</h2>
          <p className="text-slate-500">Registro de asistencia en tiempo real</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-3xl shadow-sm border space-y-6">
          <select 
            className="w-full px-4 py-4 border rounded-2xl bg-slate-50 font-bold"
            value={selectedAssemblyId}
            onChange={e => setSelectedAssemblyId(e.target.value)}
          >
            {assemblies.map(a => <option key={a.id} value={a.id}>{a.date} - {a.description}</option>)}
          </select>

          {selectedAssembly?.status === AssemblyStatus.IN_PROGRESS && canEdit ? (
            <form onSubmit={handleMarkAttendance} className="space-y-4">
              <input className="w-full px-4 py-3 border-2 rounded-xl text-center font-mono" placeholder="RUT del socio..." value={rutInput} onChange={e => setRutInput(formatRut(e.target.value))}/>
              <button className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold">Registrar Entrada</button>
            </form>
          ) : (
            <div className="py-10 text-center text-slate-400 italic">
              {selectedAssembly?.status === AssemblyStatus.FINISHED ? 'Asamblea finalizada' : 'Debe iniciar la asamblea para marcar asistencia'}
            </div>
          )}

          {canEdit && selectedAssembly?.status === AssemblyStatus.SCHEDULED && (
            <button onClick={() => updateAssemblyStatus(AssemblyStatus.IN_PROGRESS)} className="w-full py-5 bg-emerald-600 text-white rounded-2xl font-black">INICIAR SESIÓN</button>
          )}
        </div>

        <div className="bg-white p-8 rounded-3xl shadow-sm border h-[400px] overflow-y-auto">
          <h3 className="font-bold mb-4">Presentes en Sala</h3>
          {selectedAssembly?.attendees.map((rut, i) => (
            <div key={i} className="p-3 bg-slate-50 rounded-xl mb-2 flex justify-between">
              <span className="font-bold">{members.find(m => m.rut === rut)?.name}</span>
              <span className="font-mono text-xs text-slate-400">{rut}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Attendance;
