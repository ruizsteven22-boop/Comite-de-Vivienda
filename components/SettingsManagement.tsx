
import React, { useState } from 'react';
import { CommitteeConfig, Language } from '../types';
import { formatRut } from '../services/utils';

interface SettingsManagementProps {
  config: CommitteeConfig;
  setConfig: React.Dispatch<React.SetStateAction<CommitteeConfig>>;
  onExportBackup: () => void;
  onResetSystem: () => void;
}

const SettingsManagement: React.FC<SettingsManagementProps> = ({ config, setConfig, onExportBackup, onResetSystem }) => {
  const [formData, setFormData] = useState<CommitteeConfig>(config);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveStatus('saving');
    // Simulamos un delay para feedback visual
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

  return (
    <div className="space-y-12 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tighter">Panel de <span className="text-emerald-700">Configuración</span></h2>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-2">Parámetros globales y mantenimiento</p>
        </div>
        <button 
          onClick={onExportBackup}
          className="bg-white border-2 border-slate-200 text-slate-700 px-8 py-4 rounded-3xl font-black text-xs uppercase tracking-widest hover:border-emerald-600 hover:text-emerald-700 transition shadow-sm flex items-center group"
        >
          <svg className="w-5 h-5 mr-3 text-emerald-600 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Generar Respaldo Local
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-10">
          <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
            <div className="px-10 py-6 bg-slate-50 border-b border-slate-100">
              <h3 className="text-sm font-black text-slate-700 uppercase tracking-widest">Identidad Institucional</h3>
            </div>
            <form onSubmit={handleSave} className="p-10 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-2">Razón Social Legal</label>
                  <input 
                    required 
                    className="w-full px-6 py-4 border-2 border-slate-100 rounded-2xl focus:border-emerald-600 outline-none font-bold text-slate-800 bg-slate-50/50 transition-all"
                    value={formData.legalName}
                    onChange={e => handleChange('legalName', e.target.value)}
                    placeholder="Ej: Comité de Vivienda Esperanza Ltda."
                  />
                </div>
                
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-2">Nombre de Fantasía</label>
                  <input 
                    required 
                    className="w-full px-6 py-4 border-2 border-slate-100 rounded-2xl focus:border-emerald-600 outline-none font-bold text-slate-800 bg-slate-50/50 transition-all"
                    value={formData.tradeName}
                    onChange={e => handleChange('tradeName', e.target.value)}
                    placeholder="Ej: Tierra Esperanza"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-2">RUT Institucional</label>
                  <input 
                    required 
                    className="w-full px-6 py-4 border-2 border-slate-100 rounded-2xl focus:border-emerald-600 outline-none font-mono text-slate-800 bg-slate-50/50 transition-all"
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
                    className="w-full px-6 py-4 border-2 border-slate-100 rounded-2xl focus:border-emerald-600 outline-none font-bold text-slate-800 bg-slate-50/50 transition-all"
                    value={formData.email}
                    onChange={e => handleChange('email', e.target.value)}
                    placeholder="comite@ejemplo.cl"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-2">Teléfono de Contacto</label>
                  <input 
                    className="w-full px-6 py-4 border-2 border-slate-100 rounded-2xl focus:border-emerald-600 outline-none font-bold text-slate-800 bg-slate-50/50 transition-all"
                    value={formData.phone}
                    onChange={e => handleChange('phone', e.target.value)}
                    placeholder="+56 9 1234 5678"
                  />
                </div>
              </div>

              {/* SECCIÓN DE IDIOMA */}
              <div className="pt-8 border-t border-slate-100">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 ml-2">Preferencia de Sistema</h3>
                <div className="flex gap-4">
                  <button 
                    type="button"
                    onClick={() => handleChange('language', Language.ES)}
                    className={`flex-1 flex items-center justify-center gap-3 p-5 rounded-3xl border-2 transition-all font-black text-xs uppercase tracking-widest ${formData.language === Language.ES ? 'bg-emerald-50 border-emerald-600 text-emerald-800 shadow-md' : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'}`}
                  >
                    <span className="text-2xl">🇪🇸</span> Español
                  </button>
                  <button 
                    type="button"
                    onClick={() => handleChange('language', Language.EN)}
                    className={`flex-1 flex items-center justify-center gap-3 p-5 rounded-3xl border-2 transition-all font-black text-xs uppercase tracking-widest ${formData.language === Language.EN ? 'bg-emerald-50 border-emerald-600 text-emerald-800 shadow-md' : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'}`}
                  >
                    <span className="text-2xl">🇺🇸</span> English
                  </button>
                </div>
              </div>

              <div className="flex justify-end pt-6">
                <button 
                  type="submit" 
                  disabled={saveStatus === 'saving'}
                  className={`px-12 py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl transition-all active:scale-95 ${
                    saveStatus === 'saved' ? 'bg-emerald-600 text-white shadow-emerald-200' : 'bg-slate-900 text-white hover:bg-black shadow-slate-900/20'
                  }`}
                >
                  {saveStatus === 'saving' ? 'Guardando...' : saveStatus === 'saved' ? '¡Cambios Guardados!' : 'Guardar Parámetros'}
                </button>
              </div>
            </form>
          </div>

          {/* DANGER ZONE */}
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
             
             <div className="flex flex-col md:flex-row items-center justify-between gap-6 p-8 bg-white/50 rounded-3xl border border-rose-200 shadow-inner">
                <div className="max-w-md">
                   <p className="text-sm font-black text-rose-900">Restablecer Sistema a Cero</p>
                   <p className="text-[11px] font-medium text-rose-700 mt-1">Borrará permanentemente socios, finanzas, asambleas y devolverá la configuración a los valores de fábrica.</p>
                </div>
                <button 
                  onClick={onResetSystem}
                  className="w-full md:w-auto px-8 py-4 bg-rose-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-rose-700 transition shadow-xl shadow-rose-200 active:scale-95"
                >
                  Restablecer Base de Datos
                </button>
             </div>
          </div>
        </div>

        <div className="lg:col-span-1 space-y-8">
           <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-all group-hover:rotate-12">
                <svg className="w-32 h-32" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
              </div>
              <h4 className="text-xl font-black mb-8 tracking-tight">Estatus del Sistema</h4>
              <div className="space-y-6 relative z-10">
                <div className="p-6 bg-white/5 rounded-3xl border border-white/10 backdrop-blur-sm">
                  <p className="text-[9px] font-black uppercase tracking-widest text-emerald-400 mb-2">Entidad Vigente</p>
                  <p className="text-sm font-bold text-slate-100">{formData.legalName || 'No configurada'}</p>
                </div>
                <div className="p-6 bg-white/5 rounded-3xl border border-white/10 backdrop-blur-sm">
                  <p className="text-[9px] font-black uppercase tracking-widest text-emerald-400 mb-2">Identificador</p>
                  <p className="text-sm font-bold text-slate-100 font-mono tracking-tighter">{formData.rut || 'Pendiente'}</p>
                </div>
                <div className="pt-4 px-2">
                   <p className="text-[10px] text-slate-400 italic font-medium leading-relaxed opacity-60">
                     * La información configurada se sincroniza automáticamente con los motores de impresión de certificados y actas.
                   </p>
                </div>
              </div>
           </div>

           <div className="bg-indigo-50 border border-indigo-100 p-8 rounded-[2rem] shadow-sm">
              <h5 className="text-indigo-900 font-black text-xs uppercase tracking-widest mb-4 flex items-center">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                Mantenimiento
              </h5>
              <p className="text-indigo-900/70 text-[11px] font-medium leading-relaxed">
                Se recomienda generar un respaldo local antes de realizar cambios estructurales o antes de proceder con el restablecimiento de fábrica.
              </p>
           </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsManagement;
