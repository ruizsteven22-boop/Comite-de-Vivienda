
import React, { useState, useMemo } from 'react';
import { Document, DocumentType, DocumentStatus, CommitteeConfig, BoardPosition, BoardRole, User, DocumentLog } from '../types';
import { Icons } from '../constants';
import { draftSecretariatDocument, refineSecretariatText, RefineAction } from '../services/geminiService';
import { printOfficialDocument } from '../services/printService';

interface SecretariatProps {
  documents: Document[];
  setDocuments: React.Dispatch<React.SetStateAction<Document[]>>;
  config: CommitteeConfig;
  board: BoardPosition[];
  currentUser: User;
}

const Secretariat: React.FC<SecretariatProps> = ({ documents, setDocuments, config, board, currentUser }) => {
  const [showForm, setShowForm] = useState(false);
  const [showHistory, setShowHistory] = useState<string | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isDraftingAI, setIsDraftingAI] = useState(false);
  const [isRefiningAI, setIsRefiningAI] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | DocumentType>('ALL');

  const [formData, setFormData] = useState<Partial<Document>>({
    type: DocumentType.OFFICE,
    title: '',
    date: new Date().toISOString().split('T')[0],
    addressee: '',
    subject: '',
    content: '',
    status: DocumentStatus.DRAFT,
    history: []
  });

  const canEdit = currentUser.role === 'SUPPORT' || 
                  currentUser.role === 'ADMINISTRATOR' || 
                  currentUser.role === BoardRole.SECRETARY ||
                  currentUser.role === BoardRole.PRESIDENT;

  const filteredDocs = useMemo(() => {
    return documents.filter(doc => {
      const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          doc.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          doc.addressee.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filterType === 'ALL' || doc.type === filterType;
      return matchesSearch && matchesType;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [documents, searchTerm, filterType]);

  const getNextFolio = (type: DocumentType, year: number) => {
    const sameTypeAndYearDocs = documents.filter(d => d.type === type && d.year === year);
    const maxFolio = sameTypeAndYearDocs.reduce((max, d) => Math.max(max, d.folioNumber || 0), 0);
    return maxFolio + 1;
  };

  const addLog = (doc: Document, action: string, newStatus: DocumentStatus): Document => {
    const log: DocumentLog = {
      editorName: currentUser.name,
      timestamp: new Date().toISOString(),
      action,
      statusAtTime: newStatus
    };
    return {
      ...doc,
      status: newStatus,
      lastUpdate: new Date().toISOString(),
      history: [...(doc.history || []), log]
    };
  };

  const handleOpenCreate = () => {
    setFormData({
      type: DocumentType.OFFICE,
      title: '',
      date: new Date().toISOString().split('T')[0],
      addressee: '',
      subject: '',
      content: '',
      status: DocumentStatus.DRAFT,
      history: []
    });
    setEditingId(null);
    setShowForm(true);
  };

  const handleEdit = (doc: Document) => {
    setFormData({ ...doc });
    setEditingId(doc.id);
    setShowForm(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    
    const docDate = new Date(formData.date || '');
    const docYear = docDate.getFullYear();
    
    let finalFolio = formData.folioNumber || 0;
    let finalYear = formData.year || docYear;

    if (!editingId) {
      finalFolio = getNextFolio(formData.type as DocumentType, docYear);
      finalYear = docYear;
    }

    const log: DocumentLog = {
      editorName: currentUser.name,
      timestamp: new Date().toISOString(),
      action: editingId ? 'Modificación de contenido' : 'Creación inicial',
      statusAtTime: formData.status as DocumentStatus
    };

    const newDoc = {
      ...formData,
      folioNumber: finalFolio,
      year: finalYear,
      id: editingId || `DOC-${Date.now().toString().slice(-6)}`,
      lastUpdate: new Date().toISOString(),
      history: [...(formData.history || []), log]
    } as Document;

    if (editingId) {
      setDocuments(prev => prev.map(d => d.id === editingId ? newDoc : d));
    } else {
      setDocuments(prev => [newDoc, ...prev]);
    }
    setShowForm(false);
  };

  const handleDelete = (id: string) => {
    if (window.confirm("¿Está seguro de eliminar este registro permanentemente? Esta acción no se puede deshacer.")) {
      setDocuments(prev => prev.filter(d => d.id !== id));
      if (previewId === id) setPreviewId(null);
    }
  };

  const handleSign = (doc: Document) => {
    if (doc.status !== DocumentStatus.DRAFT) return;
    const updated = addLog(doc, 'Documento firmado digitalmente', DocumentStatus.SIGNED);
    setDocuments(prev => prev.map(d => d.id === doc.id ? updated : d));
  };

  const handlePrint = (doc: Document) => {
    printOfficialDocument(doc, board, config);
  };

  const handleSend = (doc: Document, channel: 'whatsapp' | 'email') => {
    // Cambiar estado a Enviado si no lo estaba
    if (doc.status !== DocumentStatus.SENT) {
      const updated = addLog(doc, `Documento enviado vía ${channel}`, DocumentStatus.SENT);
      setDocuments(prev => prev.map(d => d.id === doc.id ? updated : d));
    }

    const message = `Hola, adjunto envío de ${doc.type} N° ${doc.folioNumber} - ${doc.year}\nAsunto: ${doc.subject}\nGenerado por: ${config.tradeName}`;
    
    if (channel === 'whatsapp') {
      window.open(`https://wa.me/?text=${encodeURIComponent(message + "\n(Para ver el PDF, solicite la descarga oficial al comité)")}`, '_blank');
    } else {
      window.location.href = `mailto:?subject=${encodeURIComponent(doc.title)}&body=${encodeURIComponent(message)}`;
    }
  };

  const previewDoc = documents.find(d => d.id === previewId);
  const historyDoc = documents.find(d => d.id === showHistory);

  return (
    <div className="space-y-12 animate-in fade-in duration-500 pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div className="space-y-2">
          <h2 className="text-5xl font-black text-slate-900 tracking-tighter leading-none">
            Secretaría <span className="text-indigo-600">General</span>
          </h2>
          <div className="flex items-center space-x-3">
             <span className="h-1.5 w-12 bg-indigo-600 rounded-full"></span>
             <p className="text-slate-400 font-black uppercase tracking-[0.3em] text-[10px]">Gestión Documental e Institucional</p>
          </div>
        </div>
        <div className="flex shrink-0">
          {canEdit && (
            <button 
              onClick={handleOpenCreate} 
              className="bg-slate-900 hover:bg-black text-white px-10 py-5 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-slate-200 transition-all active:scale-95 flex items-center group"
            >
              <span className="mr-3 text-xl font-light group-hover:rotate-90 transition-transform">+</span> 
              Redactar Documento
            </button>
          )}
        </div>
      </header>

      {/* Barra de Filtros */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center bg-white/50 backdrop-blur-xl p-4 rounded-[2.5rem] border border-white shadow-sm">
        <div className="lg:col-span-3">
          <select 
            className="w-full bg-white border-2 border-slate-100 rounded-2xl px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-600 outline-none focus:border-indigo-600"
            value={filterType}
            onChange={e => setFilterType(e.target.value as any)}
          >
            <option value="ALL">Todos los tipos</option>
            {Object.values(DocumentType).map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div className="lg:col-span-9">
          <input 
            type="text" 
            placeholder="Buscar por título, asunto o destinatario..." 
            className="w-full pl-6 pr-6 py-4 bg-white border-2 border-slate-100 rounded-2xl text-xs font-bold outline-none focus:border-indigo-600"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-[3.5rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50/50 text-slate-400 text-[9px] uppercase tracking-[0.2em] font-black border-b border-slate-100">
              <tr>
                <th className="px-10 py-6">Folio / Clasificación</th>
                <th className="px-10 py-6">Documento</th>
                <th className="px-10 py-6">Estatus</th>
                <th className="px-10 py-6 text-right">Gestión</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredDocs.map(doc => {
                const lastLog = doc.history && doc.history.length > 0 ? doc.history[doc.history.length - 1] : null;
                return (
                  <tr key={doc.id} className="hover:bg-slate-50/30 transition-all group">
                    <td className="px-10 py-8">
                      <div className="flex flex-col">
                        <span className="text-xl font-black text-slate-900 leading-none">N° {doc.folioNumber}</span>
                        <span className="text-[9px] font-black text-indigo-600 uppercase tracking-[0.15em] mt-2 bg-indigo-50 px-2 py-1 rounded-md self-start">{doc.type}</span>
                        <span className="text-[8px] font-bold text-slate-300 mt-2">{doc.year}</span>
                      </div>
                    </td>
                    <td className="px-10 py-8">
                      <p className="font-black text-slate-800 text-base leading-tight">{doc.title}</p>
                      <p className="text-[11px] text-slate-400 font-medium mt-1">Para: {doc.addressee}</p>
                    </td>
                    <td className="px-10 py-8">
                      <div className="flex flex-col space-y-2">
                        <span className={`text-[9px] font-black uppercase px-4 py-1.5 rounded-xl border-2 self-start ${
                          doc.status === DocumentStatus.DRAFT ? 'bg-amber-50 text-amber-700 border-amber-100' :
                          doc.status === DocumentStatus.SIGNED ? 'bg-indigo-50 text-indigo-700 border-indigo-100' :
                          doc.status === DocumentStatus.SENT ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                          'bg-slate-100 text-slate-500 border-slate-200'
                        }`}>
                          {doc.status}
                        </span>
                        {lastLog && (
                          <button onClick={() => setShowHistory(doc.id)} className="text-[8px] text-slate-300 font-bold hover:text-indigo-600 transition-all text-left uppercase tracking-widest">
                            Edición: {lastLog.editorName.split(' ')[0]}
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-10 py-8 text-right">
                      <div className="flex justify-end items-center space-x-2">
                        <button 
                          onClick={() => setPreviewId(doc.id)} 
                          className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:bg-slate-900 hover:text-white transition-all shadow-sm" 
                          title="Vista Previa"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                        </button>
                        
                        <div className="h-6 w-px bg-slate-100 mx-1"></div>

                        {canEdit && (
                          <>
                            <button 
                              onClick={() => handleEdit(doc)} 
                              className="p-3 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all" 
                              title="Editar"
                            >
                              <Icons.Pencil />
                            </button>
                            <button 
                              onClick={() => handleDelete(doc.id)} 
                              className="p-3 bg-rose-50 text-rose-500 rounded-xl hover:bg-rose-600 hover:text-white transition-all" 
                              title="Borrar"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL FORMULARIO */}
      {showForm && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xl flex items-center justify-center z-[110] p-6 overflow-y-auto">
          <div className="bg-white rounded-[4rem] w-full max-w-6xl shadow-2xl overflow-hidden animate-in zoom-in-95 my-auto max-h-[95vh] flex flex-col">
            <div className="bg-slate-900 p-12 text-white flex justify-between items-center shrink-0">
              <div>
                <h3 className="text-3xl font-black tracking-tighter">{editingId ? 'Actualizar Documento' : 'Nueva Redacción'}</h3>
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em] mt-2">Secretaría Institucional</p>
              </div>
              <button onClick={() => setShowForm(false)} className="w-14 h-14 rounded-[1.5rem] bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-4xl font-light transition-all">&times;</button>
            </div>
            
            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-12 space-y-12">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                <div className="lg:col-span-4 space-y-8">
                  <div className="p-8 bg-slate-50 rounded-[3rem] border border-slate-100 space-y-8">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-200 pb-3">Parámetros</h4>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-2">Tipo</label>
                      <select className="w-full px-6 py-4 border-2 border-slate-200 rounded-[2rem] font-black text-xs uppercase bg-white focus:border-indigo-600 outline-none" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as DocumentType})}>
                        {Object.values(DocumentType).map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-2">Estado</label>
                      <select className="w-full px-6 py-4 border-2 border-slate-200 rounded-[2rem] font-black text-xs uppercase bg-white focus:border-indigo-600 outline-none" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as DocumentStatus})}>
                        {Object.values(DocumentStatus).map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-2">Fecha</label>
                      <input type="date" className="w-full px-6 py-4 border-2 border-slate-200 rounded-[2rem] font-black text-xs bg-white focus:border-indigo-600 outline-none" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})}/>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-8 space-y-8">
                    <input required className="w-full px-8 py-5 border-2 border-slate-100 rounded-[2.5rem] focus:border-indigo-600 outline-none font-black text-slate-800 bg-slate-50/50 text-lg" placeholder="Título del Documento" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})}/>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <input required className="w-full px-8 py-4 border-2 border-slate-100 rounded-[2rem] focus:border-indigo-600 outline-none font-bold text-slate-700 bg-slate-50/50" placeholder="Destinatario" value={formData.addressee} onChange={e => setFormData({...formData, addressee: e.target.value})}/>
                      <input required className="w-full px-8 py-4 border-2 border-slate-100 rounded-[2rem] focus:border-indigo-600 outline-none font-bold text-slate-700 bg-slate-50/50" placeholder="Asunto" value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})}/>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between items-center ml-2">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Contenido Editorial</label>
                        <button type="button" onClick={async () => {
                           setIsDraftingAI(true);
                           const res = await draftSecretariatDocument(formData.type!, formData.subject!, formData.content || '');
                           setFormData({...formData, content: res});
                           setIsDraftingAI(false);
                        }} className="text-[9px] font-black text-indigo-600 uppercase tracking-widest hover:underline disabled:opacity-50" disabled={isDraftingAI}>
                          {isDraftingAI ? 'Borrando...' : 'Asistente IA ✨'}
                        </button>
                      </div>
                      <textarea required className="w-full px-10 py-10 border-2 border-slate-100 rounded-[3rem] focus:border-indigo-600 outline-none font-medium text-slate-800 bg-slate-50/50 min-h-[400px] leading-relaxed" placeholder="Redacte aquí el contenido..." value={formData.content} onChange={e => setFormData({...formData, content: e.target.value})}></textarea>
                    </div>
                </div>
              </div>

              <div className="flex justify-end space-x-6 pt-12 border-t border-slate-100 shrink-0">
                <button type="button" onClick={() => setShowForm(false)} className="px-10 py-5 font-black text-slate-400 uppercase tracking-widest text-xs">Descartar</button>
                <button type="submit" className="px-14 py-5 bg-indigo-600 text-white rounded-[2rem] font-black shadow-2xl shadow-indigo-200 uppercase text-xs tracking-widest active:scale-95 transition-all">Guardar Registro</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL VISTA PREVIA Y ENVÍO */}
      {previewId && previewDoc && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-2xl flex items-center justify-center z-[130] p-6">
          <div className="bg-white rounded-[4rem] w-full max-w-5xl shadow-2xl overflow-hidden animate-in zoom-in-95 my-auto max-h-[90vh] flex flex-col">
            <div className="bg-slate-50 p-10 border-b border-slate-100 flex justify-between items-center shrink-0">
              <div>
                <h4 className="text-2xl font-black text-slate-800 uppercase tracking-tighter leading-none">Vista de Documento Oficial</h4>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Folio {previewDoc.folioNumber} • {previewDoc.type}</p>
              </div>
              <button onClick={() => setPreviewId(null)} className="w-12 h-12 rounded-2xl bg-white text-slate-400 hover:text-slate-600 flex items-center justify-center shadow-sm border border-slate-100 text-3xl font-light transition-all">&times;</button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-12 bg-slate-100/30">
               {/* Simulación del papel oficial */}
               <div className="bg-white mx-auto max-w-3xl shadow-lg p-16 min-h-[800px] border border-slate-200 relative">
                  <div className="flex justify-between border-b-2 border-slate-900 pb-6 mb-8">
                    <div>
                      <p className="font-black text-slate-900 text-sm">{config.legalName}</p>
                      <p className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">{config.municipalRes}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-slate-900 text-xs">FOLIO: {previewDoc.type.toUpperCase()} N° {previewDoc.folioNumber} - {previewDoc.year}</p>
                      <p className="text-[10px] font-bold text-slate-500">{previewDoc.date}</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <p className="font-black text-xl text-center uppercase underline mb-10">{previewDoc.type}</p>
                    <div className="text-sm space-y-2 mb-10">
                      <p><span className="font-black">PARA:</span> {previewDoc.addressee}</p>
                      <p><span className="font-black">DE:</span> SECRETARÍA GENERAL - {config.tradeName}</p>
                      <p><span className="font-black">ASUNTO:</span> {previewDoc.subject}</p>
                    </div>
                    <div className="whitespace-pre-wrap text-sm leading-relaxed text-slate-800 border-t border-slate-100 pt-8 italic">
                      {previewDoc.content}
                    </div>
                  </div>

                  <div className="absolute bottom-16 left-16 right-16 flex justify-around border-t border-slate-200 pt-8 opacity-40 grayscale">
                    <div className="text-center"><div className="w-32 h-px bg-slate-900 mb-2"></div><p className="text-[8px] font-black uppercase">Secretaría</p></div>
                    <div className="text-center"><div className="w-32 h-px bg-slate-900 mb-2"></div><p className="text-[8px] font-black uppercase">Presidencia</p></div>
                  </div>
               </div>
            </div>

            <div className="p-10 bg-slate-50 border-t border-slate-100 flex flex-wrap gap-4 justify-between items-center shrink-0">
               <div className="flex gap-3">
                  <button 
                    onClick={() => handlePrint(previewDoc)} 
                    className="bg-emerald-600 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-emerald-200 hover:bg-emerald-700 transition active:scale-95 flex items-center"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/></svg>
                    Generar PDF / Imprimir
                  </button>
                  
                  {previewDoc.status === DocumentStatus.DRAFT && (
                    <button 
                      onClick={() => handleSign(previewDoc)} 
                      className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-indigo-200 hover:bg-indigo-700 transition"
                    >
                      Firmar Oficialmente
                    </button>
                  )}
               </div>

               <div className="flex gap-2">
                  <button 
                    onClick={() => handleSend(previewDoc, 'whatsapp')} 
                    className="p-4 bg-white border-2 border-slate-200 text-emerald-600 rounded-2xl hover:border-emerald-600 transition shadow-sm"
                    title="Enviar WhatsApp"
                  >
                    <Icons.WhatsApp />
                  </button>
                  <button 
                    onClick={() => handleSend(previewDoc, 'email')} 
                    className="p-4 bg-white border-2 border-slate-200 text-blue-600 rounded-2xl hover:border-blue-600 transition shadow-sm"
                    title="Enviar Email"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                  </button>
               </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL HISTORIAL */}
      {showHistory && historyDoc && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xl flex items-center justify-center z-[120] p-6">
          <div className="bg-white rounded-[3rem] w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 my-auto max-h-[80vh] flex flex-col">
            <div className="bg-slate-50 p-10 border-b border-slate-100 flex justify-between items-center">
              <h4 className="text-2xl font-black text-slate-800 uppercase tracking-tighter leading-none">Bitácora</h4>
              <button onClick={() => setShowHistory(null)} className="w-12 h-12 rounded-2xl bg-white text-slate-400 hover:text-slate-600 shadow-sm border border-slate-100 text-3xl font-light">&times;</button>
            </div>
            <div className="flex-1 overflow-y-auto p-10 space-y-8">
              {historyDoc.history.map((log, i) => (
                <div key={i} className="flex gap-8 items-start relative">
                  {i < historyDoc.history.length - 1 && <div className="absolute left-[23px] top-12 bottom-[-32px] w-0.5 bg-slate-100"></div>}
                  <div className={`w-12 h-12 rounded-full border-4 border-white shadow-lg flex items-center justify-center shrink-0 z-10 ${i === 0 ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                    {i === 0 ? <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4"/></svg> : <Icons.Pencil />}
                  </div>
                  <div className="flex-1 bg-slate-50/50 rounded-[2rem] p-6 border border-slate-100">
                    <div className="flex justify-between items-center mb-2">
                      <p className="text-sm font-black text-slate-800">{log.editorName}</p>
                      <span className="text-[9px] font-bold text-slate-400 uppercase">{new Date(log.timestamp).toLocaleString()}</span>
                    </div>
                    <p className="text-xs text-slate-600 font-medium mb-3">{log.action}</p>
                    <span className="text-[8px] font-black uppercase px-3 py-1 rounded-lg border bg-white shadow-sm inline-block">{log.statusAtTime}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Secretariat;
