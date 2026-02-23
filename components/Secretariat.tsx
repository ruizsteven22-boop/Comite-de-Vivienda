import React, { useState, useMemo, useEffect } from 'react';
import { Document, DocumentType, DocumentStatus, CommitteeConfig, BoardPosition, BoardRole, User, DocumentLog } from '../types';
import { Icons } from '../constants';
import { draftSecretariatDocument, refineSecretariatText, RefineAction, summarizeDocument } from '../services/geminiService';
import { printOfficialDocument } from '../services/printService';
import Pagination from './Pagination';

const ITEMS_PER_PAGE = 10;

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
  const [isSummarizingAI, setIsSummarizingAI] = useState(false);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | DocumentType>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'info' } | null>(null);

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

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterType]);

  const filteredDocs = useMemo(() => {
    return documents.filter(doc => {
      const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          doc.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          doc.addressee.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filterType === 'ALL' || doc.type === filterType;
      return matchesSearch && matchesType;
    }).sort((a, b) => {
        if (a.folioNumber && b.folioNumber && a.year === b.year && a.type === b.type) {
            return b.folioNumber - a.folioNumber;
        }
        return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
  }, [documents, searchTerm, filterType]);

  const paginatedDocs = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredDocs.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredDocs, currentPage]);

  const getNextFolio = (type: DocumentType, year: number) => {
    const sameTypeAndYearDocs = documents.filter(d => d.type === type && d.year === year && d.folioNumber);
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
    setAiSummary(null);
    setShowForm(true);
  };

  const handleEdit = (doc: Document) => {
    if (doc.status !== DocumentStatus.DRAFT && currentUser.role !== 'SUPPORT' && currentUser.role !== 'ADMINISTRATOR') {
        alert("Los documentos firmados no pueden ser editados por seguridad. Contacte al administrador si requiere cambios.");
        return;
    }
    setFormData({ ...doc });
    setEditingId(doc.id);
    setAiSummary(null);
    setShowForm(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const docDate = new Date(formData.date || '');
    const docYear = docDate.getFullYear();
    let finalFolio = formData.folioNumber;
    if (formData.status === DocumentStatus.SIGNED && !finalFolio) {
        finalFolio = getNextFolio(formData.type as DocumentType, docYear);
    }
    const log: DocumentLog = {
      editorName: currentUser.name,
      timestamp: new Date().toISOString(),
      action: editingId ? 'Actualización de contenido' : 'Creación inicial',
      statusAtTime: formData.status as DocumentStatus
    };
    const newDoc = {
      ...formData,
      folioNumber: finalFolio,
      year: docYear,
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
    if (window.confirm("¿Está seguro de eliminar este registro permanentemente?")) {
      setDocuments(prev => prev.filter(d => d.id !== id));
      if (previewId === id) setPreviewId(null);
    }
  };

  const handleSign = (doc: Document) => {
    if (doc.status !== DocumentStatus.DRAFT) return;
    const docYear = new Date(doc.date).getFullYear();
    const assignedFolio = getNextFolio(doc.type, docYear);
    let updated = addLog(doc, `Documento firmado. Folio N° ${assignedFolio} asignado.`, DocumentStatus.SIGNED);
    updated.folioNumber = assignedFolio;
    updated.year = docYear;
    setDocuments(prev => prev.map(d => d.id === doc.id ? updated : d));
  };

  const handlePrint = (doc: Document) => {
    printOfficialDocument(doc, board, config);
  };

  const handleDownloadPDF = (doc: Document) => {
    // Cambiamos temporalmente el título de la página para que el navegador sugiera un nombre de archivo correcto
    const originalTitle = document.title;
    const cleanTitle = doc.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const fileName = `${doc.type}_N${doc.folioNumber || 'SN'}_${doc.year}_${cleanTitle}`;
    
    document.title = fileName;
    printOfficialDocument(doc, board, config);
    
    // Restauramos el título original después de que el diálogo de impresión se haya disparado
    setTimeout(() => {
      document.title = originalTitle;
    }, 1000);
  };

  const handleSend = (doc: Document, channel: 'whatsapp' | 'email') => {
    if (doc.status === DocumentStatus.DRAFT) {
        if (!confirm("Este documento es un BORRADOR sin Folio. ¿Desea enviarlo?")) return;
    }
    const folioText = doc.folioNumber ? `N° ${doc.folioNumber} - ${doc.year}` : '(BORRADOR)';
    const message = `Hola, envío ${doc.type} oficial ${folioText}.\nAsunto: ${doc.subject}\n\nGenerado por Secretaría de ${config.tradeName}.`;
    
    if (channel === 'whatsapp') {
      window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
    } else {
      window.location.href = `mailto:?subject=${encodeURIComponent(doc.title)}&body=${encodeURIComponent(message)}`;
    }

    // Visual confirmation
    setNotification({ 
      message: `Documento preparado para envío vía ${channel === 'whatsapp' ? 'WhatsApp' : 'Email'}`, 
      type: 'success' 
    });
    setTimeout(() => setNotification(null), 4000);

    if (doc.status === DocumentStatus.SIGNED) {
        const updated = addLog(doc, `Documento enviado vía ${channel}`, DocumentStatus.SENT);
        setDocuments(prev => prev.map(d => d.id === doc.id ? updated : d));
    }
  };

  const previewDoc = documents.find(d => d.id === previewId);
  const historyDoc = documents.find(d => d.id === showHistory);

  return (
    <div className="space-y-12 animate-in fade-in duration-500 pb-20 relative">
      {/* Notificación Flotante */}
      {notification && (
        <div id="secretariat-notification" className="fixed top-10 left-1/2 -translate-x-1/2 z-[200] animate-in slide-in-from-top-10 duration-500">
          <div className={`px-8 py-4 rounded-3xl shadow-2xl border-2 flex items-center space-x-4 backdrop-blur-xl ${
            notification.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-indigo-50 border-indigo-200 text-indigo-800'
          }`}>
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
              notification.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-indigo-500 text-white'
            }`}>
              {notification.type === 'success' ? '✓' : 'ℹ'}
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest opacity-50">Notificación de Sistema</p>
              <p className="text-sm font-black tracking-tight">{notification.message}</p>
            </div>
          </div>
        </div>
      )}

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

      <div className="bg-white rounded-[3.5rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50/50 text-slate-400 text-[9px] uppercase tracking-[0.2em] font-black border-b border-slate-100">
              <tr>
                <th className="px-10 py-6">Folio / Clasificación</th>
                <th className="px-10 py-6">Documento</th>
                <th className="px-10 py-6">Estatus</th>
                <th className="px-10 py-6">Última Act.</th>
                <th className="px-10 py-6 text-right">Gestión</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {paginatedDocs.map(doc => {
                const lastLog = doc.history && doc.history.length > 0 ? doc.history[doc.history.length - 1] : null;
                return (
                  <tr key={doc.id} className="hover:bg-slate-50/30 transition-all group">
                    <td className="px-10 py-8">
                      <div className="flex flex-col">
                        <span className="text-xl font-black text-slate-900 leading-none">
                            {doc.folioNumber ? `N° ${doc.folioNumber}` : 'S/N'}
                        </span>
                        <span className="text-[9px] font-black text-indigo-600 uppercase tracking-[0.15em] mt-2 bg-indigo-50 px-2 py-1 rounded-md self-start">{doc.type}</span>
                        <span className="text-[8px] font-bold text-slate-300 mt-2">Ciclo: {doc.year}</span>
                      </div>
                    </td>
                    <td className="px-10 py-8">
                      <p className="font-black text-slate-800 text-base leading-tight group-hover:text-indigo-600 transition-colors">{doc.title}</p>
                      <p className="text-[11px] text-slate-400 font-medium mt-1 italic">Re: {doc.subject}</p>
                      <p className="text-[9px] text-slate-300 font-bold mt-1 uppercase">Para: {doc.addressee}</p>
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
                          <button onClick={() => setShowHistory(doc.id)} className="text-[8px] text-slate-300 font-bold hover:text-indigo-600 transition-all text-left uppercase tracking-widest flex items-center">
                            <span className="mr-1">🕒</span> {lastLog.editorName.split(' ')[0]}
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-10 py-8">
                      <div className="flex flex-col">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{new Date(doc.lastUpdate).toLocaleDateString('es-CL')}</p>
                        <p className="text-[8px] font-bold text-slate-300 mt-1 uppercase">{new Date(doc.lastUpdate).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })} hrs</p>
                      </div>
                    </td>
                    <td className="px-10 py-8 text-right">
                      <div className="flex justify-end items-center space-x-2">
                        <button 
                          onClick={() => setPreviewId(doc.id)} 
                          className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:bg-slate-900 hover:text-white transition-all shadow-sm" 
                          title="Vista Previa Institucional"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                        </button>
                        <div className="h-6 w-px bg-slate-100 mx-1"></div>
                        {canEdit && (
                          <>
                            <button 
                              onClick={() => handleEdit(doc)} 
                              className={`p-3 rounded-xl transition-all shadow-sm ${doc.status === DocumentStatus.DRAFT ? 'bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white' : 'bg-slate-50 text-slate-300 cursor-not-allowed'}`} 
                              title={doc.status === DocumentStatus.DRAFT ? "Editar" : "Bloqueado"}
                            >
                              <Icons.Pencil />
                            </button>
                            <button 
                              onClick={() => handleDelete(doc.id)} 
                              className="p-3 bg-rose-50 text-rose-500 rounded-xl hover:bg-rose-600 hover:text-white transition-all shadow-sm" 
                              title="Eliminar"
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
        <Pagination 
          currentPage={currentPage}
          totalPages={Math.ceil(filteredDocs.length / ITEMS_PER_PAGE)}
          onPageChange={setCurrentPage}
          totalItems={filteredDocs.length}
          itemsPerPage={ITEMS_PER_PAGE}
        />
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xl flex items-center justify-center z-[110] p-6 overflow-y-auto">
          <div className="bg-white rounded-[4rem] w-full max-w-6xl shadow-2xl overflow-hidden animate-in zoom-in-95 my-auto max-h-[95vh] flex flex-col">
            <div className="bg-slate-900 p-12 text-white flex justify-between items-center shrink-0">
              <div>
                <h3 className="text-3xl font-black tracking-tighter">{editingId ? 'Editar Documento' : 'Nueva Redacción'}</h3>
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em] mt-2">Plataforma Tierra Esperanza</p>
              </div>
              <button onClick={() => setShowForm(false)} className="w-14 h-14 rounded-[1.5rem] bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-4xl font-light transition-all">&times;</button>
            </div>
            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-12 space-y-12">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                <div className="lg:col-span-4 space-y-8">
                  <div className="p-8 bg-slate-50 rounded-[3rem] border border-slate-100 space-y-8">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-200 pb-3">Ajustes</h4>
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
                  </div>
                </div>
                <div className="lg:col-span-8 space-y-8">
                    <input required className="w-full px-8 py-5 border-2 border-slate-100 rounded-[2.5rem] focus:border-indigo-600 outline-none font-black text-slate-800 bg-slate-50/50 text-lg" placeholder="Título" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})}/>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <input required className="w-full px-8 py-4 border-2 border-slate-100 rounded-[2rem] focus:border-indigo-600 outline-none font-bold text-slate-700 bg-slate-50/50" placeholder="Destinatario" value={formData.addressee} onChange={e => setFormData({...formData, addressee: e.target.value})}/>
                      <input required className="w-full px-8 py-4 border-2 border-slate-100 rounded-[2rem] focus:border-indigo-600 outline-none font-bold text-slate-700 bg-slate-50/50" placeholder="Asunto" value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})}/>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center ml-2">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Contenido</label>
                        <button type="button" onClick={async () => {
                           setIsDraftingAI(true);
                           const res = await draftSecretariatDocument(formData.type!, formData.subject!, formData.content || '');
                           setFormData({...formData, content: res});
                           setIsDraftingAI(false);
                        }} className="text-[9px] font-black text-indigo-600 uppercase tracking-widest disabled:opacity-50" disabled={isDraftingAI}>
                          {isDraftingAI ? 'Procesando...' : 'IA ✨'}
                        </button>
                      </div>
                      <textarea required className="w-full px-10 py-10 border-2 border-slate-100 rounded-[3rem] focus:border-indigo-600 outline-none font-medium text-slate-800 bg-slate-50/50 min-h-[400px]" value={formData.content} onChange={e => setFormData({...formData, content: e.target.value})}></textarea>
                    </div>

                    {/* AI Summary Section */}
                    <div className="space-y-4">
                      <div className="flex justify-between items-center ml-2">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Resumen Ejecutivo (IA)</label>
                        <button 
                          type="button" 
                          onClick={async () => {
                            if (!formData.content || formData.content.length < 20) {
                              alert("El documento debe tener contenido para generar un resumen.");
                              return;
                            }
                            setIsSummarizingAI(true);
                            const res = await summarizeDocument(formData.content);
                            setAiSummary(res || "No se pudo generar el resumen.");
                            setIsSummarizingAI(false);
                          }} 
                          className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all disabled:opacity-50 flex items-center"
                          disabled={isSummarizingAI}
                        >
                          {isSummarizingAI ? (
                            <>
                              <svg className="animate-spin -ml-1 mr-2 h-3 w-3 text-indigo-600 group-hover:text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Resumiendo...
                            </>
                          ) : 'Resumir con IA ✨'}
                        </button>
                      </div>
                      
                      {aiSummary && (
                        <div className="p-8 bg-indigo-50/30 rounded-[2.5rem] border-2 border-indigo-100/50 animate-in fade-in slide-in-from-top-4 duration-500">
                          <p className="text-sm text-slate-700 leading-relaxed italic">
                            "{aiSummary}"
                          </p>
                          <div className="mt-4 flex justify-end">
                             <button 
                               type="button" 
                               onClick={() => setAiSummary(null)}
                               className="text-[8px] font-black text-slate-400 uppercase tracking-widest hover:text-rose-500 transition-colors"
                             >
                               Limpiar Resumen
                             </button>
                          </div>
                        </div>
                      )}
                    </div>
                </div>
              </div>
              <div className="flex justify-end space-x-6 pt-12 border-t border-slate-100">
                <button type="button" onClick={() => setShowForm(false)} className="px-10 py-5 font-black text-slate-400 uppercase tracking-widest text-xs">Descartar</button>
                <button type="submit" className="px-14 py-5 bg-indigo-600 text-white rounded-[2rem] font-black shadow-xl uppercase text-xs tracking-widest transition-all">Guardar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL VISTA PREVIA CON BOTÓN DE DESCARGA PDF */}
      {previewId && previewDoc && (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-2xl flex items-center justify-center z-[130] p-6 overflow-y-auto">
          <div className="bg-white rounded-[4rem] w-full max-w-5xl shadow-2xl overflow-hidden animate-in zoom-in-95 my-auto max-h-[95vh] flex flex-col">
            <div className="bg-slate-50 p-10 border-b border-slate-100 flex justify-between items-center shrink-0">
              <div>
                <h4 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">Vista Institucional</h4>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">
                    {previewDoc.folioNumber ? `Folio N° ${previewDoc.folioNumber} - ${previewDoc.year}` : 'Borrador'}
                </p>
              </div>
              <button onClick={() => setPreviewId(null)} className="w-12 h-12 rounded-2xl bg-white text-slate-400 hover:text-slate-600 flex items-center justify-center shadow-sm border border-slate-100 text-3xl font-light transition-all">&times;</button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-12 bg-slate-200/50">
               <div className="bg-white mx-auto max-w-[215.9mm] shadow-2xl p-[2.5cm] min-h-[279.4mm] border border-slate-200 relative text-black" style={{ fontFamily: '"Crimson Pro", serif' }}>
                  <div className="flex justify-between border-b-2 border-black pb-4 mb-8 items-center">
                    <div className="flex items-center gap-4">
                      {config.logoUrl && (
                        <img src={config.logoUrl} alt="Logo" className="w-16 h-16 object-contain" />
                      )}
                      <div>
                        <p className="font-black text-sm uppercase" style={{ fontFamily: 'Inter, sans-serif' }}>{config.legalName}</p>
                        <p className="text-[7.5pt] font-bold text-slate-500 uppercase tracking-widest mt-1" style={{ fontFamily: 'Inter, sans-serif' }}>{config.municipalRes}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-xs uppercase" style={{ fontFamily: 'Inter, sans-serif' }}>FOLIO: {previewDoc.folioNumber || 'BORRADOR'}</p>
                      <p className="text-[10px] font-bold text-slate-500 mt-1 uppercase" style={{ fontFamily: 'Inter, sans-serif' }}>{previewDoc.date}</p>
                    </div>
                  </div>
                  <div className="space-y-6">
                    <p className="font-black text-xl text-center uppercase underline mb-10" style={{ fontFamily: 'Inter, sans-serif' }}>{previewDoc.type}</p>
                    <div className="text-[11.5pt] space-y-2 mb-10" style={{ fontFamily: 'Inter, sans-serif' }}>
                      <p><span className="font-black">PARA:</span> {previewDoc.addressee}</p>
                      <p><span className="font-black">DE:</span> SECRETARÍA GENERAL - {config.tradeName}</p>
                      <p><span className="font-black">ASUNTO:</span> <strong>{previewDoc.subject}</strong></p>
                    </div>
                    <div className="whitespace-pre-wrap text-[11.5pt] leading-relaxed text-justify pt-4 border-t border-slate-100 min-h-[400px]">
                      {previewDoc.content}
                    </div>
                  </div>
                  <div className="mt-20 flex justify-between gap-12 pt-8" style={{ fontFamily: 'Inter, sans-serif' }}>
                    <div className="w-[45%] text-center border-t border-black pt-2">
                      <p className="text-[9pt] font-black uppercase">{board.find(b => b.role === BoardRole.SECRETARY)?.primary.name || 'SECRETARIO(A)'}</p>
                      <p className="text-[7pt] font-bold text-slate-500 uppercase">Secretaría General</p>
                    </div>
                    <div className="w-[45%] text-center border-t border-black pt-2">
                      <p className="text-[9pt] font-black uppercase">{board.find(b => b.role === BoardRole.PRESIDENT)?.primary.name || 'PRESIDENTE(A)'}</p>
                      <p className="text-[7pt] font-bold text-slate-500 uppercase">Presidencia</p>
                    </div>
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
                    Imprimir
                  </button>

                  <button 
                    onClick={() => handleDownloadPDF(previewDoc)} 
                    className="bg-white border-2 border-indigo-600 text-indigo-600 px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-50 transition active:scale-95 flex items-center"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                    Descargar PDF
                  </button>
                  
                  {previewDoc.status === DocumentStatus.DRAFT && (
                    <button 
                      onClick={() => handleSign(previewDoc)} 
                      className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-indigo-200 hover:bg-indigo-700 transition active:scale-95"
                    >
                      Firmar
                    </button>
                  )}
               </div>
               <div className="flex gap-2">
                  <button 
                    onClick={() => handleSend(previewDoc, 'whatsapp')} 
                    className="p-4 bg-white border-2 border-slate-200 text-emerald-600 rounded-2xl hover:border-emerald-600 transition shadow-sm"
                  >
                    <Icons.WhatsApp />
                  </button>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Secretariat;