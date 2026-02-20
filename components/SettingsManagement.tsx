
import React, { useState, useRef } from 'react';
import { CommitteeConfig, Language } from '../types';
import { formatRut } from '../services/utils';

interface SettingsManagementProps {
  config: CommitteeConfig;
  setConfig: React.Dispatch<React.SetStateAction<CommitteeConfig>>;
  onExportBackup: () => void;
  onImportBackup: (data: any) => void;
  onResetSystem: () => void;
}

const SettingsManagement: React.FC<SettingsManagementProps> = ({ config, setConfig, onExportBackup, onImportBackup, onResetSystem }) => {
  const [formData, setFormData] = useState<CommitteeConfig>(config);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveStatus('saving');
    setTimeout(() => {
      setConfig(formData);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }, 800);
  };

  const handleChange = (field: keyof CommitteeConfig, value: any) => {
    const processedValue = field === 'rut' ? formatRut(value) : value;
    setFormData(prev => ({ ...prev, [field]: processedValue }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const json = JSON.parse(event.target?.result as string);
          if (confirm("⚠️ ¿Está seguro de restaurar este respaldo? Se sobrescribirán todos los datos actuales.")) {
            onImportBackup(json);
          }
        } catch (err) {
          alert("El archivo seleccionado no es un respaldo válido.");
        }
      };
      reader.readAsText(file);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) { // 1MB limit for base64 storage
        alert("El logo es demasiado pesado. Por favor use una imagen de menos de 1MB.");
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        setFormData(prev => ({ ...prev, logoUrl: base64 }));
      };
      reader.readAsDataURL(file);
    }
    if (logoInputRef.current) logoInputRef.current.value = '';
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tighter">Panel de <span className="text-violet-600">Configuración</span></h2>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-2">Parámetros globales y mantenimiento</p>
        </div>
        <div className="flex gap-3">
          <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={handleFileChange} />
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="bg-white border-2 border-slate-100 text-slate-700 px-6 py-4 rounded-3xl font-black text-xs uppercase tracking-widest hover:border-violet-600 transition shadow-sm flex items-center group"
          >
            <svg className="w-5 h-5 mr-3 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4 4m0 0l-4-4m4 4V4" /></svg>
            Restaurar
          </button>
          <button 
            onClick={onExportBackup}
            className="bg-violet-600 text-white px-8 py-4 rounded-3xl font-black text-xs uppercase tracking-widest hover:bg-violet-700 transition shadow-xl shadow-violet-200 flex items-center group"
          >
            <svg className="w-5 h-5 mr-3 text-white group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>
            Copia de Seguridad
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-10">
          <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
            <div className="px-10 py-6 bg-slate-50 border-b border-slate-100">
              <h3 className="text-sm font-black text-slate-700 uppercase tracking-widest">Identidad Institucional</h3>
            </div>
            <form onSubmit={handleSave} className="p-10 space-y-8">
              <div className="flex flex-col md:flex-row gap-10 items-start">
                {/* Logo Upload Section */}
                <div className="w-full md:w-48 flex flex-col items-center gap-4">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Logo Institucional</label>
                  <div 
                    onClick={() => logoInputRef.current?.click()}
                    className="w-40 h-40 rounded-[2rem] border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center cursor-pointer hover:border-violet-400 hover:bg-violet-50 transition-all overflow-hidden group relative"
                  >
                    {formData.logoUrl ? (
                      <>
                        <img src={formData.logoUrl} alt="Logo" className="w-full h-full object-contain p-4" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <p className="text-[10px] font-black text-white uppercase tracking-widest">Cambiar</p>
                        </div>
                      </>
                    ) : (
                      <>
                        <svg className="w-8 h-8 text-slate-300 mb-2 group-hover:text-violet-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest text-center px-4">Subir Logo</p>
                      </>
                    )}
                  </div>
                  <input type="file" ref={logoInputRef} className="hidden" accept="image/*" onChange={handleLogoUpload} />
                  {formData.logoUrl && (
                    <button 
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, logoUrl: '' }))}
                      className="text-[9px] font-black text-rose-500 uppercase tracking-widest hover:text-rose-700"
                    >
                      Eliminar Logo
                    </button>
                  )}
                </div>

                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="md:col-span-2">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-2">Razón Social Legal</label>
                    <input 
                      required 
                      className="w-full px-8 py-5 border-2 border-slate-100 rounded-[2rem] focus:border-violet-600 outline-none font-bold text-slate-800 bg-slate-50/50 transition-all"
                      value={formData.legalName}
                      onChange={e => handleChange('legalName', e.target.value)}
                      placeholder="Ej: Comité de Vivienda Esperanza Ltda."
                    />
                  </div>
                  
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-2">Nombre de Fantasía</label>
                    <input 
                      required 
                      className="w-full px-8 py-5 border-2 border-slate-100 rounded-[2rem] focus:border-violet-600 outline-none font-bold text-slate-800 bg-slate-50/50 transition-all"
                      value={formData.tradeName}
                      onChange={e => handleChange('tradeName', e.target.value)}
                      placeholder="Ej: Tierra Esperanza"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-2">RUT Institucional</label>
                    <input 
                      required 
                      className="w-full px-8 py-5 border-2 border-slate-100 rounded-[2rem] focus:border-violet-600 outline-none font-mono text-slate-800 bg-slate-50/50 transition-all"
                      value={formData.rut}
                      onChange={e => handleChange('rut', e.target.value)}
                      placeholder="76.000.000-0"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-2">Email Institucional</label>
                    <input 
                      type="email" 
                      required 
                      className="w-full px-8 py-5 border-2 border-slate-100 rounded-[2rem] focus:border-violet-600 outline-none font-bold text-slate-800 bg-slate-50/50 transition-all"
                      value={formData.email}
                      onChange={e => handleChange('email', e.target.value)}
                      placeholder="comite@ejemplo.cl"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-2">Teléfono de Contacto</label>
                    <input 
                      className="w-full px-8 py-5 border-2 border-slate-100 rounded-[2rem] focus:border-violet-600 outline-none font-bold text-slate-800 bg-slate-50/50 transition-all"
                      value={formData.phone}
                      onChange={e => handleChange('phone', e.target.value)}
                      placeholder="+56 9 1234 5678"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-8 border-t border-slate-100">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 ml-2">Preferencia de Sistema</h3>
                <div className="flex gap-4">
                  <button 
                    type="button"
                    onClick={() => handleChange('language', Language.ES)}
                    className={`flex-1 flex items-center justify-center gap-3 p-6 rounded-[2rem] border-2 transition-all font-black text-xs uppercase tracking-widest ${formData.language === Language.ES ? 'bg-violet-50 border-violet-600 text-violet-800 shadow-md' : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'}`}
                  >
                    <span className="text-2xl">🇪🇸</span> Español
                  </button>
                  <button 
                    type="button"
                    onClick={() => handleChange('language', Language.EN)}
                    className={`flex-1 flex items-center justify-center gap-3 p-6 rounded-[2rem] border-2 transition-all font-black text-xs uppercase tracking-widest ${formData.language === Language.EN ? 'bg-violet-50 border-violet-600 text-violet-800 shadow-md' : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'}`}
                  >
                    <span className="text-2xl">🇺🇸</span> English
                  </button>
                </div>
              </div>

              <div className="flex justify-end pt-6">
                <button 
                  type="submit" 
                  disabled={saveStatus === 'saving'}
                  className={`px-12 py-5 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-2xl transition-all active:scale-95 ${
                    saveStatus === 'saved' ? 'bg-emerald-600 text-white shadow-emerald-200' : 'bg-slate-900 text-white hover:bg-black shadow-slate-900/20'
                  }`}
                >
                  {saveStatus === 'saving' ? 'Guardando...' : saveStatus === 'saved' ? '¡Cambios Guardados!' : 'Guardar Parámetros'}
                </button>
              </div>
            </form>
          </div>

          <div className="bg-rose-50 border-2 border-rose-100 rounded-[2.5rem] p-10 space-y-6">
             <div className="flex items-center space-x-4">
               <div className="p-3 bg-rose-200 rounded-2xl text-rose-700">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
               </div>
               <div>
                  <h3 className="text-lg font-black text-rose-900">Zona de Riesgo</h3>
                  <p className="text-xs font-bold text-rose-700 uppercase tracking-widest opacity-60">Acciones irreversibles del sistema</p>
               </div>
             </div>
             
             <div className="flex flex-col md:flex-row items-center justify-between gap-6 p-10 bg-white/50 rounded-[2.5rem] border border-rose-200 shadow-inner">
                <div className="max-w-md">
                   <p className="text-sm font-black text-rose-900">Restablecer Sistema a Cero</p>
                   <p className="text-[11px] font-medium text-rose-700 mt-1">Borrará permanentemente socios, finanzas, asambleas, documentos de secretaría y devolverá la configuración a los valores de fábrica.</p>
                </div>
                <button 
                  onClick={onResetSystem}
                  className="w-full md:w-auto px-10 py-5 bg-rose-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-rose-700 transition shadow-xl shadow-rose-200 active:scale-95"
                >
                  Restablecer Base de Datos
                </button>
             </div>
          </div>
        </div>

        <div className="lg:col-span-1 space-y-8">
           <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white p-12 rounded-[3rem] shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-all group-hover:rotate-12">
                <svg className="w-32 h-32" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
              </div>
              <h4 className="text-xl font-black mb-8 tracking-tight">Estatus del Sistema</h4>
              <div className="space-y-6 relative z-10">
                <div className="p-8 bg-white/5 rounded-[2rem] border border-white/10 backdrop-blur-sm">
                  <p className="text-[9px] font-black uppercase tracking-widest text-violet-400 mb-2">Entidad Vigente</p>
                  <p className="text-sm font-bold text-slate-100 leading-tight">{formData.legalName || 'No configurada'}</p>
                </div>
                <div className="p-8 bg-white/5 rounded-[2rem] border border-white/10 backdrop-blur-sm">
                  <p className="text-[9px] font-black uppercase tracking-widest text-violet-400 mb-2">Identificador</p>
                  <p className="text-sm font-bold text-slate-100 font-mono tracking-tighter">{formData.rut || 'Pendiente'}</p>
                </div>
                <div className="pt-4 px-2">
                   <p className="text-[10px] text-slate-400 italic font-medium leading-relaxed opacity-60">
                     * La información configurada se sincroniza automáticamente con los motores de impresión de certificados y actas. Se recomienda respaldar mensualmente.
                   </p>
                </div>
              </div>
           </div>

           <div className="bg-violet-50 border border-violet-100 p-10 rounded-[2.5rem] shadow-sm">
              <h5 className="text-violet-900 font-black text-xs uppercase tracking-widest mb-4 flex items-center">
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                Mantenimiento
              </h5>
              <p className="text-violet-900/70 text-[11px] font-medium leading-relaxed">
                Utilice el botón de <strong>"Copia de Seguridad"</strong> para descargar un archivo JSON que podrá restaurar en cualquier equipo. Este archivo es privado y contiene información sensible.
              </p>
           </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsManagement;
