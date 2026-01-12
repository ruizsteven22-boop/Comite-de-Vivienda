
import React, { useState } from 'react';
import { BoardPosition, BoardRole, Member, User } from '../types';
import { formatRut } from '../services/utils';
import { printBoardIDCard, printBoardReport } from '../services/printService';

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
  const [searchQueries, setSearchQueries] = useState<Record<string, string>>({});

  const canEdit = currentUser.role === 'SUPPORT' || 
                  currentUser.role === 'ADMINISTRATOR' || 
                  currentUser.role === BoardRole.PRESIDENT;

  const handleUpdateBoard = (role: BoardRole, type: 'primary' | 'substitute', field: string, value: string) => {
    const processedValue = field === 'rut' ? formatRut(value) : value;
    setTempBoard(prev => prev.map(pos => pos.role === role ? { ...pos, [type]: { ...pos[type], [field]: processedValue } } : pos));
  };

  const onSelectMember = (role: BoardRole, type: 'primary' | 'substitute', member: Member) => {
    setTempBoard(prev => prev.map(pos => pos.role === role ? { ...pos, [type]: { name: member.name, rut: member.rut, phone: member.phone } } : pos));
    setSearchQueries(prev => ({ ...prev, [`${role}-${type}`]: '' }));
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
    setSearchQueries({});
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Directiva del Comité</h2>
          <p className="text-slate-500">Representantes oficiales y sus respectivos suplentes</p>
        </div>
        {!isEditing ? (
          <div className="flex space-x-2">
            <button onClick={() => printBoardReport(board, boardPeriod)} className="bg-slate-100 text-slate-700 px-6 py-2.5 rounded-xl font-bold border">Imprimir Nómina</button>
            {canEdit && (
              <button onClick={() => setIsEditing(true)} className="bg-emerald-600 text-white px-6 py-2.5 rounded-xl font-bold shadow-lg">Modificar Directiva</button>
            )}
          </div>
        ) : (
          <div className="flex space-x-2">
            <button onClick={handleCancel} className="px-6 py-2.5 border rounded-xl font-bold">Cancelar</button>
            <button onClick={handleSave} className="bg-emerald-600 text-white px-8 py-2.5 rounded-xl font-black">Guardar Cambios</button>
          </div>
        )}
      </header>

      <div className={`p-8 rounded-[32px] border ${isEditing ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-slate-100 shadow-sm'}`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] mb-1 text-slate-400">Periodo de Vigencia</h4>
            {isEditing ? (
              <input className="font-black text-2xl text-emerald-900 border-b-4 border-emerald-400 bg-transparent outline-none w-full" value={tempPeriod} onChange={e => setTempPeriod(e.target.value)}/>
            ) : (
              <p className="text-3xl font-black text-slate-800 tracking-tight">{boardPeriod}</p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {(isEditing ? tempBoard : board).map((pos) => (
          <div key={pos.role} className="flex flex-col space-y-4">
            <div className="bg-slate-900 text-white p-5 rounded-3xl text-center font-black uppercase text-xs border-b-4 border-emerald-500">{pos.role}</div>
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex-1 relative">
              <span className="absolute -top-3 left-6 bg-emerald-600 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase">Titular</span>
              <div className="mt-6">
                {isEditing ? (
                  <input className="w-full px-4 py-2 border rounded-xl text-sm" placeholder="Buscar socio..." onChange={e => setSearchQueries({...searchQueries, [`${pos.role}-primary`]: e.target.value})}/>
                ) : (
                  <p className="text-xl font-black text-slate-800">{pos.primary.name}</p>
                )}
                <p className="text-xs text-slate-400 mt-2">RUT: {pos.primary.rut}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BoardManagement;
