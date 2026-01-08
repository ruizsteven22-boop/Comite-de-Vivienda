
import React, { useState, useEffect } from 'react';
import { Assembly, Member, AssemblyStatus, AssemblyType, BoardPosition, BoardRole } from '../types';
import { Icons } from '../constants';
import { generateAssemblyReminderText, generateMassNotificationDraft } from '../services/geminiService';
import { printAssemblyMinutes, printAttendanceReport } from '../services/printService';
import { formatRut } from '../services/utils';

interface AttendanceProps {
  members: Member[];
  assemblies: Assembly[];
  setAssemblies: React.Dispatch<React.SetStateAction<Assembly[]>>;
  board: BoardPosition[];
}

const Attendance: React.FC<AttendanceProps> = ({ members, assemblies, setAssemblies, board }) => {
  const [selectedAssemblyId, setSelectedAssemblyId] = useState(assemblies[0]?.id || '');
  const [rutInput, setRutInput] = useState('');
  const [feedback, setFeedback] = useState<{msg: string, type: 'success' | 'error'} | null>(null);
  const [inlineError, setInlineError] = useState<string | null>(null);
  
  // Estados para notificaciones
  const [sentReminders, setSentReminders] = useState<string[]>([]);
  const [showNotificationCenter, setShowNotificationCenter] = useState(false);
  const [notificationMode, setNotificationMode] = useState<'whatsapp' | 'email' | 'sms'>('whatsapp');
  const [isSendingMass, setIsSendingMass] = useState(false);
  const [massDraft, setMassDraft] = useState('');
  const [sendingProgress, setSendingProgress] = useState(0);

  // Estado para el modal de Acta
  const [showMinutesModal, setShowMinutesModal] = useState(false);
  const [minutesData, setMinutesData] = useState({
    agenda: [] as string[],
    agreements: [] as string[],
    observations: ''
  });

  const selectedAssembly = assemblies.find(a => a.id === selectedAssemblyId);
  const quorumPercentage = selectedAssembly ? Math.round((selectedAssembly.attendees.length / members.length) * 100) : 0;
  const isQuorumReached = quorumPercentage >= 50;

  useEffect(() => {
    if (showNotificationCenter && selectedAssembly && (notificationMode === 'email' || notificationMode === 'sms')) {
      const loadDraft = async () => {
        setMassDraft('Generando borrador inteligente...');
        const draft = await generateMassNotificationDraft(selectedAssembly, notificationMode);
        setMassDraft(draft);
      };
      loadDraft();
    }
  }, [showNotificationCenter, notificationMode, selectedAssemblyId]);

  const handleMarkAttendance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssembly) return;

    setInlineError(null);
    const normalizedInput = rutInput.replace(/\./g, '').replace('-', '').toLowerCase();
    const member = members.find(m => m.rut.replace(/\./g, '').replace('-', '').toLowerCase() === normalizedInput);

    if (!member) {
      setInlineError("RUT no encontrado en la base de socios.");
      return;
    }

    if (selectedAssembly.attendees.includes(member.rut)) {
      setInlineError(`${member.name} ya registró su asistencia.`);
      return;
    }

    setAssemblies(prev => prev.map(a => 
      a.id === selectedAssemblyId 
        ? { ...a, attendees: [...a.attendees, member.rut] } 
        : a
    ));

    setFeedback({ msg: `Asistencia registrada: ${member.name}`, type: 'success' });
    setRutInput('');
    
    setTimeout(() => setFeedback(null), 3000);
  };

  const updateAssemblyStatus = (status: AssemblyStatus) => {
    setAssemblies(prev => prev.map(a => 
      a.id === selectedAssemblyId ? { ...a, status, startTime: status === AssemblyStatus.IN_PROGRESS ? new Date().toLocaleTimeString() : a.startTime } : a
    ));
  };

  const updateAssemblyType = (type: AssemblyType) => {
    setAssemblies(prev => prev.map(a => 
      a.id === selectedAssemblyId ? { ...a, type } : a
    ));
  };

  const handleSendIndividualWhatsApp = (member: Member) => {
    if (!selectedAssembly) return;
    const message = generateAssemblyReminderText(member, selectedAssembly);
    const url = `https://wa.me/${member.phone.replace('+', '')}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
    setSentReminders(prev => [...prev, `${member.id}-whatsapp`]);
  };

  const handleMassSend = async () => {
    if (!selectedAssembly) return;
    setIsSendingMass(true);
    setSendingProgress(0);

    for (let i = 0; i < members.length; i++) {
      const member = members[i];
      await new Promise(resolve => setTimeout(resolve, 300));
      setSentReminders(prev => [...prev, `${member.id}-${notificationMode}`]);
      setSendingProgress(Math.round(((i + 1) / members.length) * 100));
    }

    setIsSendingMass(false);
    setFeedback({ msg: `Envío masivo por ${notificationMode.toUpperCase()} completado con éxito.`, type: 'success' });
    setTimeout(() => setFeedback(null), 5000);
  };

  const openMinutesEditor = () => {
    if (!selectedAssembly) return;
    setMinutesData({
      agenda: selectedAssembly.agenda || [],
      agreements: selectedAssembly.agreements || [],
      observations: selectedAssembly.observations || ''
    });
    setShowMinutesModal(true);
  };

  const saveMinutes = () => {
    setAssemblies(prev => prev.map(a => 
      a.id === selectedAssemblyId 
        ? { ...a, ...minutesData } 
        : a
    ));
    setFeedback({ msg: "Acta guardada correctamente en el registro.", type: 'success' });
    setTimeout(() => setFeedback(null), 3000);
    setShowMinutesModal(false);
  };

  const handlePrint = () => {
    if (!selectedAssembly) return;
    const updatedAssembly = { ...selectedAssembly, ...minutesData };
    printAssemblyMinutes(updatedAssembly, members, board);
  };

  const handlePrintAttendanceDetailed = () => {
    if (!selectedAssembly) return;
    printAttendanceReport(selectedAssembly, members, board);
  };

  if (selectedAssembly?.status === AssemblyStatus.IN_PROGRESS) {
    return (
      <div className="space-y-6">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="w-3 h-3 bg-red-500 rounded-full animate-ping"></span>
              <h2 className="text-2xl font-bold text-slate-800">Sesión en Curso</h2>
            </div>
            <p className="text-slate-500">{selectedAssembly.description} • 📍 {selectedAssembly.location}</p>
          </div>
          <div className="flex space-x-3">
            <button 
              onClick={openMinutesEditor}
              className="bg-white border-2 border-emerald-600 text-emerald-700 px-6 py-2 rounded-xl font-bold hover:bg-emerald-50 transition flex items-center"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
              Elaborar Acta
            </button>
            <button 
              onClick={() => updateAssemblyStatus(AssemblyStatus.FINISHED)}
              className="bg-slate-800 text-white px-6 py-2 rounded-xl font-bold hover:bg-slate-700 transition"
            >
              Finalizar Asamblea
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-emerald-100 ring-4 ring-emerald-50">
              <h3 className="font-bold text-slate-700 mb-4 uppercase text-xs tracking-widest">Tipo de Asamblea</h3>
              <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={() => updateAssemblyType(AssemblyType.ORDINARY)}
                  className={`py-3 rounded-xl font-bold transition ${selectedAssembly.type === AssemblyType.ORDINARY ? 'bg-emerald-600 text-white shadow-lg' : 'bg-slate-100 text-slate-400'}`}
                >Ordinaria</button>
                <button 
                  onClick={() => updateAssemblyType(AssemblyType.EXTRAORDINARY)}
                  className={`py-3 rounded-xl font-bold transition ${selectedAssembly.type === AssemblyType.EXTRAORDINARY ? 'bg-amber-600 text-white shadow-lg' : 'bg-slate-100 text-slate-400'}`}
                >Extraord.</button>
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
              <h3 className="font-bold text-slate-700 mb-2 uppercase text-xs tracking-widest text-center">Estado del Quórum</h3>
              <div className="flex flex-col items-center">
                <div className="relative w-32 h-32 flex items-center justify-center">
                   <svg className="w-full h-full transform -rotate-90">
                      <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-100" />
                      <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray={364.4} strokeDashoffset={364.4 - (364.4 * quorumPercentage / 100)} className={`${isQuorumReached ? 'text-emerald-500' : 'text-amber-500'} transition-all duration-1000`} />
                   </svg>
                   <span className="absolute text-2xl font-black">{quorumPercentage}%</span>
                </div>
                <p className={`mt-4 font-bold text-sm ${isQuorumReached ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {isQuorumReached ? '✓ Quórum Alcanzado' : '⚠️ Esperando Quórum (50%)'}
                </p>
                <p className="text-xs text-slate-400 mt-1">{selectedAssembly.attendees.length} de {members.length} socios</p>
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
               <h3 className="font-bold text-slate-700 mb-4 uppercase text-xs tracking-widest">Registrar Asistencia</h3>
               <form onSubmit={handleMarkAttendance} className="space-y-3">
                  {inlineError && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-xl text-xs font-bold flex justify-between items-center animate-in slide-in-from-bottom-2">
                      <span>{inlineError}</span>
                      <button type="button" onClick={() => setInlineError(null)} className="text-red-400 hover:text-red-600 text-base">&times;</button>
                    </div>
                  )}
                  <input 
                    type="text"
                    placeholder="RUT del socio..."
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl font-bold text-center font-mono focus:border-emerald-500 outline-none"
                    value={rutInput}
                    onChange={e => {
                      setRutInput(formatRut(e.target.value));
                      if (inlineError) setInlineError(null);
                    }}
                  />
                  <button type="submit" className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold shadow-md hover:bg-emerald-700 transition">Registrar Entrada</button>
               </form>
            </div>
          </div>

          <div className="lg:col-span-2 bg-slate-900 rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[600px]">
            <div className="p-6 border-b border-slate-800 flex justify-between items-center">
              <h3 className="text-white font-bold text-lg">Socios en Sala</h3>
              <span className="bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border border-emerald-500/20">Oficial</span>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-thin scrollbar-thumb-slate-700">
              {selectedAssembly.attendees.map((rut, idx) => {
                const member = members.find(m => m.rut === rut);
                return (
                  <div key={idx} className="bg-slate-800/50 p-4 rounded-2xl flex items-center justify-between border border-slate-700">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center font-bold text-emerald-400">{idx + 1}</div>
                      <div>
                        <p className="text-white font-semibold">{member?.name}</p>
                        <p className="text-xs text-slate-500 font-mono">{rut}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Modal editor de Actas */}
        {showMinutesModal && (
          <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
            <div className="bg-white w-full max-w-3xl rounded-[32px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
              <div className="bg-emerald-600 p-6 text-white flex justify-between items-center">
                <h3 className="text-xl font-black">Elaboración de Acta Oficial</h3>
                <button onClick={() => setShowMinutesModal(false)} className="text-2xl hover:text-emerald-200">&times;</button>
              </div>
              <div className="flex-1 overflow-y-auto p-8 space-y-6 text-center py-20">
                  <p className="text-slate-400 italic">Módulo de redacción en vivo habilitado para la directiva.</p>
              </div>
              <div className="p-8 border-t border-slate-100 flex justify-end space-x-4">
                  <button onClick={saveMinutes} className="px-6 py-3 border border-slate-200 rounded-2xl font-bold">Guardar</button>
                  <button onClick={() => {saveMinutes(); handlePrint();}} className="px-10 py-3 bg-emerald-600 text-white rounded-2xl font-black">Imprimir Acta</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Centro de Asistencia y Reportes</h2>
          <p className="text-slate-500">Gestione la convocatoria y obtenga informes detallados</p>
        </div>
        <div className="flex space-x-2">
           {selectedAssembly?.status === AssemblyStatus.FINISHED && (
             <>
               <button 
                onClick={handlePrintAttendanceDetailed}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-5 py-2.5 rounded-xl font-bold transition flex items-center border border-slate-200 shadow-sm"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2a2 2 0 00-2-2H5a2 2 0 00-2 2v2m2-4h10a2 2 0 012 2v2M9 7h6m0 10v-3m-3 3h.01M9 17h.01" /></svg>
                Reporte de Asistencia
              </button>
              <button 
                onClick={handlePrint}
                className="bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-emerald-700 transition flex items-center shadow-lg shadow-emerald-100"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                Imprimir Acta
              </button>
             </>
           )}
        </div>
      </header>

      {feedback && (
        <div className={`p-4 rounded-xl text-sm font-bold animate-in fade-in slide-in-from-top-2 ${feedback.type === 'success' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
          {feedback.msg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-3xl shadow-lg border border-slate-100 flex flex-col justify-between h-fit">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Seleccionar Sesión para Revisión</label>
              <select 
                className="w-full px-4 py-4 border-2 border-slate-100 rounded-2xl bg-slate-50 font-bold text-slate-700 focus:border-emerald-500 transition outline-none"
                value={selectedAssemblyId}
                onChange={e => setSelectedAssemblyId(e.target.value)}
              >
                {assemblies.map(a => <option key={a.id} value={a.id}>{a.date} - {a.description} ({a.status})</option>)}
              </select>
            </div>

            <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100">
              <h4 className="text-emerald-800 font-bold text-sm uppercase tracking-wider mb-4">Información de la Sesión</h4>
              <div className="grid grid-cols-2 gap-4">
                 <div className="bg-white p-4 rounded-xl border border-emerald-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase">Socios convocados</p>
                    <p className="text-2xl font-black text-emerald-600">{members.length}</p>
                 </div>
                 <div className="bg-white p-4 rounded-xl border border-emerald-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase">Asistentes finales</p>
                    <p className="text-2xl font-black text-emerald-600">{selectedAssembly?.attendees.length || 0}</p>
                 </div>
              </div>
              {selectedAssembly && (
                <div className="mt-4 pt-4 border-t border-emerald-100 text-xs text-emerald-700 font-medium">
                  ⏰ Hora Citación: {selectedAssembly.summonsTime} hrs. | 📍 Sede: {selectedAssembly.location}
                </div>
              )}
            </div>
          </div>

          <div className="mt-8 space-y-3">
            {selectedAssembly?.status !== AssemblyStatus.FINISHED ? (
              <button 
                onClick={() => updateAssemblyStatus(AssemblyStatus.IN_PROGRESS)}
                className="w-full py-5 bg-emerald-600 text-white rounded-2xl font-black text-xl hover:bg-emerald-700 transition shadow-xl shadow-emerald-200"
              >ABRIR REGISTRO DE ENTRADA</button>
            ) : (
              <div className="bg-slate-50 p-4 rounded-2xl text-center border-2 border-dashed border-slate-200">
                 <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">Sesión Finalizada y Archiva</p>
              </div>
            )}
            <button 
              onClick={() => setShowNotificationCenter(true)}
              className="w-full py-3 bg-slate-800 text-white rounded-2xl font-bold hover:bg-slate-700 transition"
            >ENVIAR RECORDATORIOS MASIVOS</button>
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl shadow-lg border border-slate-100 flex flex-col h-[600px]">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-slate-800">Estado de Convocatoria</h3>
            <span className="text-[10px] font-bold bg-green-100 text-green-700 px-2 py-1 rounded uppercase tracking-widest">Notificaciones</span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-slate-200">
            {members.map(member => (
              <div key={member.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-emerald-200 transition group">
                <div className="flex items-center space-x-3">
                  <div className={`w-2 h-2 rounded-full ${sentReminders.includes(`${member.id}-whatsapp`) ? 'bg-green-500' : 'bg-slate-300'}`}></div>
                  <p className="text-sm font-bold text-slate-800">{member.name}</p>
                </div>
                <button 
                  onClick={() => handleSendIndividualWhatsApp(member)}
                  className={`p-2 rounded-xl transition ${sentReminders.includes(`${member.id}-whatsapp`) ? 'bg-green-50 text-green-600' : 'bg-white text-emerald-600 shadow-sm border border-slate-200'}`}
                >{sentReminders.includes(`${member.id}-whatsapp`) ? 'NOTIFICADO' : 'NOTIFICAR'}</button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* MODAL: Centro de Notificaciones Avanzado */}
      {showNotificationCenter && selectedAssembly && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center z-[70] p-4">
          <div className="bg-white w-full max-w-4xl rounded-[40px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="bg-emerald-600 p-10 text-white relative">
              <button onClick={() => setShowNotificationCenter(false)} className="absolute top-8 right-8 text-3xl hover:scale-110 transition">&times;</button>
              <h3 className="text-3xl font-black tracking-tight">Gestión de Comunicaciones</h3>
              <p className="text-emerald-100 mt-2 font-medium">Asamblea: {selectedAssembly.description}</p>
            </div>

            <div className="flex flex-1 min-h-0">
              <div className="w-64 bg-slate-50 border-r border-slate-200 p-6 space-y-2">
                <button onClick={() => setNotificationMode('whatsapp')} className={`w-full text-left px-4 py-3 rounded-xl font-bold text-sm transition ${notificationMode === 'whatsapp' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:bg-slate-200'}`}>WhatsApp</button>
                <button onClick={() => setNotificationMode('email')} className={`w-full text-left px-4 py-3 rounded-xl font-bold text-sm transition ${notificationMode === 'email' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:bg-slate-200'}`}>Email IA</button>
                <button onClick={() => setNotificationMode('sms')} className={`w-full text-left px-4 py-3 rounded-xl font-bold text-sm transition ${notificationMode === 'sms' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:bg-slate-200'}`}>SMS IA</button>
              </div>

              <div className="flex-1 p-10 flex flex-col overflow-y-auto">
                <div className="flex-1 space-y-6">
                  <div className="space-y-4">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Borrador Comunicado</label>
                    <textarea 
                      className="w-full h-48 p-6 bg-slate-50 border-2 border-slate-100 rounded-3xl outline-none focus:border-emerald-500 font-medium text-slate-700 leading-relaxed transition shadow-inner"
                      value={massDraft}
                      onChange={e => setMassDraft(e.target.value)}
                    />
                  </div>
                </div>

                <div className="mt-10 pt-8 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-sm text-slate-500">Total socios: <strong>{members.length}</strong></span>
                  <button 
                    disabled={isSendingMass || (notificationMode !== 'whatsapp' && massDraft.includes('Generando'))}
                    onClick={handleMassSend}
                    className="bg-emerald-600 text-white px-10 py-4 rounded-2xl font-black text-lg shadow-2xl shadow-emerald-200 hover:bg-emerald-700 transition disabled:opacity-50 flex items-center"
                  >
                    {isSendingMass ? `PROCESANDO ${sendingProgress}%` : `INICIAR ENVÍO MASIVO`}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Attendance;
