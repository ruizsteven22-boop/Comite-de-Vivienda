
import React, { useState } from 'react';
import { BoardPosition, BoardRole, Member, User, Person } from '../types';
import { formatRut } from '../services/utils';
import { printBoardReport } from '../services/printService';
import { Icons } from '../constants';

interface BoardManagementProps {
  board: BoardPosition[];
  setBoard: React.Dispatch<React.SetStateAction<BoardPosition[]>>;
  boardPeriod: string;
  setBoardPeriod: (period: string) => void;
  members: Member[];
  currentUser: User;
}

const BoardManagement: React.FC<BoardManagementProps> = ({ board, setBoard, boardPeriod, setBoardPeriod, members, currentUser }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempBoard, setTempBoard] = useState<BoardPosition[]>(board);
  const [tempPeriod, setTempPeriod] = useState(boardPeriod);

  const canEdit = currentUser.role === 'SUPPORT' || 
                  currentUser.role === 'ADMINISTRATOR' || 
                  currentUser.role === BoardRole.PRESIDENT;

  const handleUpdatePosition = (role: BoardRole, type: 'primary' | 'substitute', field: keyof Person, value: string) => {
    const processedValue = field === 'rut' ? formatRut(value) : value;
    setTempBoard(prev => prev.map(pos => 
      pos.role === role ? { ...pos, [type]: { ...pos[type], [field]: processedValue } } : pos
    ));
  };

  const handleSave = () => {
    if (!canEdit) return;
    setBoard(tempBoard);
    setBoardPeriod(tempPeriod);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setTempBoard(board);
    setTempPeriod(boardPeriod);
    setIsEditing(false);
  };

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tighter leading-none">Cuerpo <span className="text-emerald-700">Directivo</span></h2>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-4">Autoridades Vigentes Tierra Esperanza</p>
        </div>
        {!isEditing ? (
          <div className="flex space-x-3">
            <button onClick={() => printBoardReport(board, boardPeriod)} className="bg-white border-2 border-slate-200 text-slate-700 px-8 py-4 rounded-3xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition shadow-sm">Generar Nómina</button>
            {canEdit && (
              <button onClick={() => setIsEditing(true)} className="bg-slate-900 text-white px-10 py-4 rounded-3xl font-black text-xs uppercase tracking-widest shadow-xl active:scale-95 transition">Modificar Directorio</button>
            )}
          </div>
        ) : (
          <div className="flex space-x-3">
            <button onClick={handleCancel} className="px-8 py-4 border-2 border-slate-200 rounded-3xl font-black text-xs uppercase tracking-widest text-slate-400">Descartar</button>
            <button onClick={handleSave} className="bg-emerald-700 text-white px-12 py-4 rounded-3xl font-black text-xs uppercase tracking-widest shadow-xl shadow-emerald-900/20 active:scale-95 transition">Publicar Cambios</button>
          </div>
        )}
      </header>

      <div className={`p-12 rounded-[3.5rem] border-2 ${isEditing ? 'bg-white border-emerald-600' : 'bg-white border-slate-100 shadow-sm'} transition-all duration-500 relative overflow-hidden`}>
        <div className="relative z-10">
          <p className="text-[10px] font-black uppercase tracking-[0.4em] mb-4 text-slate-400">Periodo de Gobernanza Actual</p>
          {isEditing ? (
            <input 
              className="font-black text-5xl text-emerald-900 border-b-4 border-emerald-400 bg-transparent outline-none w-full placeholder:text-slate-200 tracking-tighter" 
              value={tempPeriod} 
              placeholder="Ej: 2025 - 2027"
              onChange={e => setTempPeriod(e.target.value)}
            />
          ) : (
            <p className="text-6xl font-black text-slate-900 tracking-tighter leading-none">{boardPeriod}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {(isEditing ? tempBoard : board).map((pos) => (
          <div key={pos.role} className="space-y-8 animate-in slide-in-from-bottom-10 duration-700">
            <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] text-center shadow-2xl relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-20 transition-opacity"><Icons.Shield /></div>
               <p className="font-black uppercase text-[12px] tracking-[0.4em]">{pos.role}</p>
            </div>
            
            <div className="space-y-6">
              {/* TITULAR */}
              <div className={`p-10 rounded-[3rem] shadow-sm border-2 transition-all ${isEditing ? 'bg-white border-emerald-100 ring-4 ring-emerald-50' : 'bg-white border-slate-50'}`}>
                <div className="flex items-center justify-between mb-8">
                   <span className="bg-emerald-600 text-white text-[9px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest shadow-lg shadow-emerald-900/20">Titular</span>
                </div>
                {isEditing ? (
                  <div className="space-y-4">
                    <input className="w-full px-5 py-3 border-2 border-slate-50 rounded-2xl font-black text-sm bg-slate-50/50 outline-none focus:border-emerald-600" placeholder="Nombre completo" value={pos.primary.name} onChange={e => handleUpdatePosition(pos.role, 'primary', 'name', e.target.value)}/>
                    <input className="w-full px-5 py-3 border-2 border-slate-50 rounded-2xl font-mono text-xs bg-slate-50/50 outline-none focus:border-emerald-600" placeholder="RUT" value={pos.primary.rut} onChange={e => handleUpdatePosition(pos.role, 'primary', 'rut', e.target.value)}/>
                  </div>
                ) : (
                  <div>
                    <h5 className="text-2xl font-black text-slate-900 leading-tight">{pos.primary.name || 'Posición Vacante'}</h5>
                    <p className="text-[10px] font-bold text-slate-400 mt-3 uppercase tracking-widest font-mono">RUT: {pos.primary.rut || 'No definido'}</p>
                  </div>
                )}
              </div>

              {/* SUPLENTE */}
              <div className={`p-10 rounded-[3rem] shadow-sm border-2 transition-all ${isEditing ? 'bg-white border-amber-100 ring-4 ring-amber-50' : 'bg-amber-50/30 border-amber-100/50'}`}>
                <div className="flex items-center justify-between mb-8">
                   <span className="bg-amber-600 text-white text-[9px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest shadow-lg shadow-amber-900/20">Suplente</span>
                </div>
                {isEditing ? (
                  <div className="space-y-4">
                    <input className="w-full px-5 py-3 border-2 border-slate-50 rounded-2xl font-black text-sm bg-slate-50/50 outline-none focus:border-amber-600" placeholder="Nombre del suplente" value={pos.substitute.name} onChange={e => handleUpdatePosition(pos.role, 'substitute', 'name', e.target.value)}/>
                    <input className="w-full px-5 py-3 border-2 border-slate-50 rounded-2xl font-mono text-xs bg-slate-50/50 outline-none focus:border-amber-600" placeholder="RUT" value={pos.substitute.rut} onChange={e => handleUpdatePosition(pos.role, 'substitute', 'rut', e.target.value)}/>
                  </div>
                ) : (
                  <div>
                    <h5 className="text-xl font-black text-slate-800 leading-tight">{pos.substitute.name || 'Sin Asignar'}</h5>
                    <p className="text-[10px] font-bold text-slate-400 mt-3 uppercase tracking-widest font-mono">RUT: {pos.substitute.rut || 'No definido'}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BoardManagement;
