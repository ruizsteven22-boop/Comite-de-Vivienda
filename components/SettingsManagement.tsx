
import React, { useState } from 'react';
import { CommitteeConfig } from '../types';
import { formatRut } from '../services/utils';

interface SettingsManagementProps {
  config: CommitteeConfig;
  setConfig: React.Dispatch<React.SetStateAction<CommitteeConfig>>;
  onExportBackup: () => void;
}

const SettingsManagement: React.FC<SettingsManagementProps> = ({ config, setConfig, onExportBackup }) => {
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

  const handleChange = (field: keyof CommitteeConfig, value: string) => {
    const processedValue = field === 'rut' ? formatRut(value) : value;
    setFormData(prev => ({ ...prev, [field]: processedValue }));
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tighter">Parámetros del <span className="text-indigo-600">Comité</span></h2>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-2">Información Institucional y Legal</p>
        </div>
        <button 
          onClick={onExportBackup}
          className="bg-white border-2 border-slate-200 text-slate-700 px-8 py-4 rounded-3xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition shadow-sm flex items-center group"
        >
          <svg className="w-5 h-5 mr-3 text-emerald-600 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Descargar Respaldo General
        </button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
            <form onSubmit={handleSave} className="p-10 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-2">Razón Social Legal</label>
                  <input 
                    required 
                    className="w-full px-6 py-4 border-2 border-slate-100 rounded-2xl focus:border-indigo-600 outline-none font-bold text-slate-800 bg-slate-50/50"
                    value={formData.legalName}
                    onChange={e => handleChange('legalName', e.target.value)}
                    placeholder="Ej: Comité de Vivienda Esperanza Ltda."
                  />
                </div>
                
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-2">Nombre de Fantasía</label>
                  <input 
                    required 
                    className="w-full px-6 py-4 border-2 border-slate-100 rounded-2xl focus:border-indigo-600 outline-none font-bold text-slate-800 bg-slate-50/50"
                    value={formData.tradeName}
                    onChange={e => handleChange('tradeName', e.target.value)}
                    placeholder="Ej: Tierra Esperanza"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-2">RUT Institucional</label>
                  <input 
                    required 
                    className="w-full px-6 py-4 border-2 border-slate-100 rounded-2xl focus:border-indigo-600 outline-none font-mono text-slate-800 bg-slate-50/50"
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
                    className="w-full px-6 py-4 border-2 border-slate-100 rounded-2xl focus:border-indigo-600 outline-none font-bold text-slate-800 bg-slate-50/50"
                    value={formData.email}
                    onChange={e => handleChange('email', e.target.value)}
                    placeholder="comite@ejemplo.cl"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-2">Teléfono de Contacto</label>
                  <input 
                    className="w-full px-6 py-4 border-2 border-slate-100 rounded-2xl focus:border-indigo-600 outline-none font-bold text-slate-800 bg-slate-50/50"
                    value={formData.phone}
                    onChange={e => handleChange('phone', e.target.value)}
                    placeholder="+56 9 1234 5678"
                  />
                </div>

                <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-slate-50">
                   <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-2">Resolución Municipal</label>
                    <input 
                      className="w-full px-6 py-4 border-2 border-slate-100 rounded-2xl focus:border-indigo-600 outline-none font-bold text-slate-800 bg-slate-50/50"
                      value={formData.municipalRes}
                      onChange={e => handleChange('municipalRes', e.target.value)}
                      placeholder="N° Resolución / Fecha"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-2">Resolución Jurídica</label>
                    <input 
                      className="w-full px-6 py-4 border-2 border-slate-100 rounded-2xl focus:border-indigo-600 outline-none font-bold text-slate-800 bg-slate-50/50"
                      value={formData.legalRes}
                      onChange={e => handleChange('legalRes', e.target.value)}
                      placeholder="N° Personalidad Jurídica"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-6">
                <button 
                  type="submit" 
                  disabled={saveStatus === 'saving'}
                  className={`px-12 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl transition-all active:scale-95 ${
                    saveStatus === 'saved' ? 'bg-emerald-600 text-white' : 'bg-slate-900 text-white hover:bg-black shadow-slate-900/20'
                  }`}
                >
                  {saveStatus === 'saving' ? 'Guardando...' : saveStatus === 'saved' ? '¡Configuración Guardada!' : 'Actualizar Parámetros'}
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="lg:col-span-1 space-y-8">
           <div className="bg-slate-900 text-white p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                <svg className="w-32 h-32" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
              </div>
              <h4 className="text-xl font-black mb-6 tracking-tight">Ficha Técnica</h4>
              <div className="space-y-6">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-indigo-400 mb-1">Entidad</p>
                  <p className="text-sm font-bold text-slate-200">{formData.legalName || '---'}</p>
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-indigo-400 mb-1">Identificador Fiscal</p>
                  <p className="text-sm font-bold text-slate-200 font-mono">{formData.rut || '---'}</p>
                </div>
                <div className="pt-4 border-t border-white/10">
                   <p className="text-[10px] text-slate-400 italic font-medium leading-relaxed">
                     Esta información será utilizada para la generación automática de actas, reportes de tesorería y certificados oficiales de socios.
                   </p>
                </div>
              </div>
           </div>

           <div className="bg-amber-50 border border-amber-200 p-8 rounded-[2rem]">
              <h5 className="text-amber-800 font-black text-xs uppercase tracking-widest mb-4 flex items-center">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                Importante
              </h5>
              <p className="text-amber-900/70 text-[11px] font-medium leading-relaxed">
                Los cambios en el Nombre de Fantasía afectarán inmediatamente el logo textual del sidebar. Asegúrese de mantener coherencia con los estatutos municipales registrados.
              </p>
           </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsManagement;
