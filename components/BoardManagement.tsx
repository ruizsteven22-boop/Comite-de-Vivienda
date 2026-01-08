
import React, { useState } from 'react';
import { BoardPosition, BoardRole, Member } from '../types';
import { formatRut } from '../services/utils';

interface BoardManagementProps {
  board: BoardPosition[];
  setBoard: React.Dispatch<React.SetStateAction<BoardPosition[]>>;
  boardPeriod: string;
  setBoardPeriod: (period: string) => void;
  members: Member[];
}

const BoardManagement: React.FC<BoardManagementProps> = ({ board, setBoard, boardPeriod, setBoardPeriod, members }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempBoard, setTempBoard] = useState<BoardPosition[]>(board);
  const [tempPeriod, setTempPeriod] = useState(boardPeriod);

  // Estado para las búsquedas individuales por cargo y tipo
  const [searchQueries, setSearchQueries] = useState<Record<string, string>>({});

  const handleUpdateBoard = (role: BoardRole, type: 'primary' | 'substitute', field: string, value: string) => {
    const processedValue = field === 'rut' ? formatRut(value) : value;
    
    setTempBoard(prev => prev.map(pos => {
      if (pos.role === role) {
        return {
          ...pos,
          [type]: {
            ...pos[type],
            [field]: processedValue
          }
        };
      }
      return pos;
    }));
  };

  const onSelectMember = (role: BoardRole, type: 'primary' | 'substitute', member: Member) => {
    setTempBoard(prev => prev.map(pos => {
      if (pos.role === role) {
        return {
          ...pos,
          [type]: {
            name: member.name,
            rut: member.rut,
            phone: member.phone
          }
        };
      }
      return pos;
    }));
    // Limpiar búsqueda después de seleccionar
    setSearchQueries(prev => ({ ...prev, [`${role}-${type}`]: '' }));
  };

  const handleSave = () => {
    setBoard(tempBoard);
    setBoardPeriod(tempPeriod);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setTempBoard(board);
    setTempPeriod(boardPeriod);
    setIsEditing(false);
    setSearchQueries({});
  };

  const getFilteredMembers = (query: string) => {
    if (!query || query.length < 2) return [];
    const normalizedQuery = query.toLowerCase();
    return members.filter(m => 
      m.name.toLowerCase().includes(normalizedQuery) || 
      m.rut.toLowerCase().includes(normalizedQuery)
    ).slice(0, 5); // Limitar a 5 resultados
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Directiva del Comité</h2>
          <p className="text-slate-500">Representantes oficiales y sus respectivos suplentes</p>
        </div>
        {!isEditing ? (
          <button 
            onClick={() => setIsEditing(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl font-bold transition shadow-lg shadow-emerald-600/20 flex items-center group"
          >
            <svg className="w-4 h-4 mr-2 group-hover:rotate-12 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
            Modificar Directiva
          </button>
        ) : (
          <div className="flex space-x-2">
            <button 
              onClick={handleCancel}
              className="px-6 py-2.5 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 font-bold transition"
            >
              Cancelar
            </button>
            <button 
              onClick={handleSave}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-2.5 rounded-xl font-black transition shadow-xl shadow-emerald-600/30"
            >
              Guardar Cambios
            </button>
          </div>
        )}
      </header>

      {/* SECCIÓN DE PERIODO DE VIGENCIA */}
      <div className={`p-8 rounded-[32px] shadow-sm border transition-all duration-300 ${isEditing ? 'bg-emerald-50 border-emerald-200 ring-4 ring-emerald-500/5' : 'bg-white border-slate-100'}`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center space-x-6">
            <div className={`p-4 rounded-2xl transition-colors ${isEditing ? 'bg-emerald-600 text-white' : 'bg-emerald-100 text-emerald-600'}`}>
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            </div>
            <div>
              <h4 className={`text-[10px] font-black uppercase tracking-[0.2em] mb-1 ${isEditing ? 'text-emerald-600' : 'text-slate-400'}`}>
                {isEditing ? 'Editando Periodo de Duración' : 'Periodo de Vigencia'}
              </h4>
              {isEditing ? (
                <div className="relative group">
                  <input 
                    type="text" 
                    className="font-black text-2xl text-emerald-900 border-b-4 border-emerald-400 bg-transparent outline-none focus:border-emerald-600 transition-all w-full max-w-xs py-1"
                    value={tempPeriod}
                    onChange={e => setTempPeriod(e.target.value)}
                    placeholder="Ej: 2024 - 2026"
                    autoFocus
                  />
                  <p className="text-[10px] text-emerald-500 mt-2 font-bold italic">Presione enter o use el botón de guardar para confirmar.</p>
                </div>
              ) : (
                <div className="flex items-center space-x-3">
                  <p className="text-3xl font-black text-slate-800 tracking-tight">{boardPeriod}</p>
                  <span className="bg-emerald-100 text-emerald-700 text-[10px] font-black px-2 py-1 rounded uppercase tracking-wider">Vigente</span>
                </div>
              )}
            </div>
          </div>
          <div className="hidden md:block text-right">
             <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Estado Administrativo</p>
             <p className="text-sm font-semibold text-slate-600">Aprobado por Asamblea General</p>
          </div>
        </div>
      </div>

      {/* CARGOS DE LA DIRECTIVA */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {(isEditing ? tempBoard : board).map((pos) => (
          <div key={pos.role} className="flex flex-col space-y-4 animate-in slide-in-from-bottom-4 duration-500">
            <div className="bg-slate-900 text-white p-5 rounded-3xl text-center font-black uppercase tracking-widest text-xs shadow-xl flex items-center justify-center border-b-4 border-emerald-500">
              {pos.role}
            </div>
            
            {/* Titular */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex-1 relative flex flex-col hover:border-emerald-200 transition">
              <span className="absolute -top-3 left-6 bg-emerald-600 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-lg shadow-emerald-100">Titular</span>
              <div className="mt-6 space-y-4 flex-1">
                {isEditing ? (
                  <div className="space-y-4">
                    <div className="relative">
                      <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">Buscar Socio Responsable</label>
                      <input 
                        className="w-full px-4 py-3 text-sm border-2 border-slate-100 rounded-2xl outline-none focus:border-emerald-500 bg-slate-50 transition"
                        placeholder="RUT o Nombre..."
                        value={searchQueries[`${pos.role}-primary`] || ''}
                        onChange={e => setSearchQueries({ ...searchQueries, [`${pos.role}-primary`]: e.target.value })}
                      />
                      {getFilteredMembers(searchQueries[`${pos.role}-primary`] || '').length > 0 && (
                        <div className="absolute z-20 w-full mt-2 bg-white border border-slate-200 rounded-[24px] shadow-2xl overflow-hidden animate-in zoom-in-95">
                          {getFilteredMembers(searchQueries[`${pos.role}-primary`] || '').map(member => (
                            <button 
                              key={member.id}
                              onClick={() => onSelectMember(pos.role, 'primary', member)}
                              className="w-full text-left px-5 py-3 hover:bg-emerald-50 border-b border-slate-50 last:border-0 transition"
                            >
                              <p className="text-sm font-bold text-slate-800">{member.name}</p>
                              <p className="text-[10px] text-slate-400 font-mono font-bold">{member.rut}</p>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="pt-4 border-t border-slate-100 space-y-4">
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <p className="text-[10px] font-black text-slate-400 uppercase">Nombre</p>
                        <p className="font-bold text-slate-700">{pos.primary.name || 'No asignado'}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                          <p className="text-[10px] font-black text-slate-400 uppercase">RUT</p>
                          <p className="font-mono font-bold text-slate-700">{pos.primary.rut || '-'}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase mb-1 ml-1">Fono</p>
                          <input 
                            className="w-full px-3 py-3 text-xs border-2 border-slate-100 rounded-xl outline-none focus:border-emerald-500 font-bold"
                            value={pos.primary.phone}
                            onChange={e => handleUpdateBoard(pos.role, 'primary', 'phone', e.target.value)}
                            placeholder="+569..."
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="text-xl font-black text-slate-800 tracking-tight">{pos.primary.name}</p>
                    <div className="space-y-2 mt-4">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-400 font-bold uppercase text-[10px]">RUT</span>
                        <span className="font-mono font-bold text-slate-700">{pos.primary.rut}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-400 font-bold uppercase text-[10px]">Fono</span>
                        <span className="font-bold text-emerald-600">{pos.primary.phone}</span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Suplente */}
            <div className="bg-slate-50 p-6 rounded-3xl shadow-sm border-2 border-dashed border-slate-200 flex-1 relative flex flex-col hover:bg-white transition group">
              <span className="absolute -top-3 left-6 bg-slate-200 text-slate-600 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest border border-slate-300 group-hover:bg-slate-800 group-hover:text-white transition-colors">Suplente</span>
              <div className="mt-6 space-y-4 flex-1">
                {isEditing ? (
                  <div className="space-y-4">
                    <div className="relative">
                      <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1">Socio Suplente</label>
                      <input 
                        className="w-full px-4 py-3 text-sm border-2 border-slate-200 rounded-2xl outline-none focus:border-emerald-500 bg-white transition"
                        placeholder="Buscar..."
                        value={searchQueries[`${pos.role}-substitute`] || ''}
                        onChange={e => setSearchQueries({ ...searchQueries, [`${pos.role}-substitute`]: e.target.value })}
                      />
                      {getFilteredMembers(searchQueries[`${pos.role}-substitute`] || '').length > 0 && (
                        <div className="absolute z-20 w-full mt-2 bg-white border border-slate-200 rounded-[24px] shadow-2xl overflow-hidden animate-in zoom-in-95">
                          {getFilteredMembers(searchQueries[`${pos.role}-substitute`] || '').map(member => (
                            <button 
                              key={member.id}
                              onClick={() => onSelectMember(pos.role, 'substitute', member)}
                              className="w-full text-left px-5 py-3 hover:bg-slate-50 border-b border-slate-50 last:border-0 transition"
                            >
                              <p className="text-sm font-bold text-slate-800">{member.name}</p>
                              <p className="text-[10px] text-slate-400 font-mono font-bold">{member.rut}</p>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="pt-4 border-t border-slate-200 space-y-4">
                      <div className="bg-white p-3 rounded-xl border border-slate-100">
                        <p className="text-[10px] font-black text-slate-400 uppercase">Nombre</p>
                        <p className="font-bold text-slate-600">{pos.substitute.name || 'No asignado'}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                         <div className="bg-white p-3 rounded-xl border border-slate-100">
                          <p className="text-[10px] font-black text-slate-400 uppercase">RUT</p>
                          <p className="font-mono font-bold text-slate-600">{pos.substitute.rut || '-'}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase mb-1 ml-1">Fono</p>
                          <input 
                            className="w-full px-3 py-3 text-xs border-2 border-slate-200 rounded-xl outline-none focus:border-emerald-500 font-bold"
                            value={pos.substitute.phone}
                            onChange={e => handleUpdateBoard(pos.role, 'substitute', 'phone', e.target.value)}
                            placeholder="+569..."
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="text-lg font-bold text-slate-600 tracking-tight">{pos.substitute.name}</p>
                    <div className="space-y-2 mt-4 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400 font-bold uppercase text-[9px]">RUT</span>
                        <span className="font-mono font-bold text-slate-600">{pos.substitute.rut}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400 font-bold uppercase text-[9px]">Fono</span>
                        <span className="font-bold text-slate-600">{pos.substitute.phone}</span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-emerald-900 text-emerald-50 p-8 rounded-[40px] shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <svg className="w-32 h-32" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L1 21h22L12 2zm0 3.45L20.1 19H3.9L12 5.45zM11 10v4h2v-4h-2zm0 6v2h2v-2h-2z" /></svg>
        </div>
        <h4 className="text-xl font-black mb-4 flex items-center tracking-tight">
          <svg className="w-6 h-6 mr-3 text-emerald-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
          Protocolo Legal de Directiva
        </h4>
        <div className="max-w-2xl space-y-4 text-emerald-200/80 leading-relaxed text-sm">
          <p>
            El <strong>Periodo de Duración</strong> es fundamental para la vigencia jurídica del comité ante bancos, municipios y el Ministerio de Vivienda. Asegúrese de que el rango de años coincida exactamente con lo establecido en la última Acta de Elección de Directorio.
          </p>
          <p>
            Tanto titulares como suplentes deben ser socios con estado <strong>ACTIVO</strong> y con sus cuotas al día para ejercer representación oficial.
          </p>
        </div>
      </div>
    </div>
  );
};

export default BoardManagement;
