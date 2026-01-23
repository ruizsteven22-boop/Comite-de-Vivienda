
import React, { useState } from 'react';
import { Transaction, TransactionType, Member, PaymentMethod, User, BoardRole } from '../types';
import { generateReceiptText } from '../services/geminiService';
import { Icons } from '../constants';

interface TreasuryProps {
  transactions: Transaction[];
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
  members: Member[];
  onViewMember: (id: string) => void;
  currentUser: User;
}

const Treasury: React.FC<TreasuryProps> = ({ transactions, setTransactions, members, onViewMember, currentUser }) => {
  const [showForm, setShowForm] = useState(false);
  const [filterMethod, setFilterMethod] = useState<'ALL' | PaymentMethod>('ALL');
  const [newTx, setNewTx] = useState<Partial<Transaction>>({
    date: new Date().toISOString().split('T')[0],
    amount: 0,
    type: TransactionType.INCOME,
    paymentMethod: PaymentMethod.CASH,
    description: '',
    referenceNumber: ''
  });

  const canEdit = currentUser.role === 'SUPPORT' || 
                  currentUser.role === 'ADMINISTRATOR' || 
                  currentUser.role === BoardRole.TREASURER;

  const sortedTransactions = [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const filteredTransactions = filterMethod === 'ALL' 
    ? sortedTransactions 
    : sortedTransactions.filter(t => t.paymentMethod === filterMethod);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) return;
    
    const tx = { 
      ...newTx, 
      id: `TE-${Date.now().toString().slice(-6)}`,
      paymentMethod: newTx.paymentMethod || PaymentMethod.CASH 
    } as Transaction;
    setTransactions(prev => [tx, ...prev]);
    setShowForm(false);
    setNewTx({
      date: new Date().toISOString().split('T')[0],
      amount: 0,
      type: TransactionType.INCOME,
      paymentMethod: PaymentMethod.CASH,
      description: '',
      referenceNumber: ''
    });
  };

  const handleDeleteTx = (id: string) => {
    if (!canEdit) return;
    if (confirm("¿Está seguro de eliminar este registro contable?")) {
      setTransactions(prev => prev.filter(t => t.id !== id));
    }
  };

  const handleExportCSV = () => {
    if (filteredTransactions.length === 0) {
      alert("No hay transacciones para exportar.");
      return;
    }
    const headers = ["ID", "Fecha", "Monto", "Tipo", "Metodo", "Referencia", "Descripcion", "Socio"];
    const rows = filteredTransactions.map(tx => {
      const member = members.find(m => m.id === tx.memberId);
      return [tx.id, tx.date, tx.amount, tx.type, tx.paymentMethod, tx.referenceNumber || "", `"${tx.description.replace(/"/g, '""')}"`, `"${(member ? member.name : "N/A").replace(/"/g, '""')}"`];
    });
    const csvContent = [headers.join(","), ...rows.map(row => row.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `tesoreria_te_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSendReceipt = (tx: Transaction, method: 'whatsapp' | 'email') => {
    const member = members.find(m => m.id === tx.memberId);
    if (!member) return;
    const receiptText = generateReceiptText(member, tx);
    if (method === 'whatsapp') {
      const url = `https://wa.me/${member.phone.replace('+', '').replace(/\s/g, '')}?text=${encodeURIComponent(receiptText)}`;
      window.open(url, '_blank');
    } else {
      window.location.href = `mailto:${member.email}?subject=Recibo Tierra Esperanza ${tx.id}&body=${encodeURIComponent(receiptText)}`;
    }
  };

  return (
    <div className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tighter">Panel de <span className="text-emerald-700">Tesorería</span></h2>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mt-2">Control Financiero y Recaudación</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button onClick={handleExportCSV} className="bg-white border border-slate-200 text-slate-700 px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition shadow-sm">Exportar CSV</button>
          {canEdit && (
            <button 
              onClick={() => setShowForm(true)}
              className="bg-emerald-700 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-emerald-700/20 hover:bg-emerald-800 transition active:scale-95"
            >
              Nueva Transacción
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-8 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Historial de Movimientos (Recientes primero)</p>
          <select 
            className="bg-white border-2 border-slate-200 rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-600 outline-none focus:border-emerald-600"
            value={filterMethod}
            onChange={(e) => setFilterMethod(e.target.value as any)}
          >
            <option value="ALL">Todos los métodos</option>
            <option value={PaymentMethod.CASH}>Efectivo</option>
            <option value={PaymentMethod.TRANSFER}>Transferencia</option>
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/30 text-slate-400 text-[9px] uppercase tracking-[0.2em] font-black border-b border-slate-100">
              <tr>
                <th className="px-10 py-5">Identificador</th>
                <th className="px-10 py-5">Socio / Motivo</th>
                <th className="px-10 py-5">Método</th>
                <th className="px-10 py-5 text-right">Monto Neto</th>
                <th className="px-10 py-5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredTransactions.map(tx => {
                const member = members.find(m => m.id === tx.memberId);
                return (
                  <tr key={tx.id} className="hover:bg-slate-50/30 transition-colors group">
                    <td className="px-10 py-5">
                      <p className="text-[10px] font-black text-slate-400">#{tx.id}</p>
                      <p className="text-xs font-bold text-slate-600 mt-1">{tx.date}</p>
                    </td>
                    <td className="px-10 py-5">
                      <p className="font-black text-slate-900 text-sm leading-tight">{tx.description}</p>
                      {member ? (
                        <button onClick={() => onViewMember(member.id)} className="text-[10px] text-emerald-700 font-bold hover:underline mt-1">{member.name}</button>
                      ) : (
                        <p className="text-[10px] text-slate-400 font-bold mt-1">Gasto General</p>
                      )}
                    </td>
                    <td className="px-10 py-5">
                      <span className={`text-[9px] font-black uppercase px-3 py-1.5 rounded-xl border-2 ${
                        tx.paymentMethod === PaymentMethod.CASH ? 'bg-amber-50 text-amber-800 border-amber-100' : 'bg-blue-50 text-blue-800 border-blue-100'
                      }`}>
                        {tx.paymentMethod}
                      </span>
                    </td>
                    <td className="px-10 py-5 text-right">
                      <p className={`text-lg font-black ${tx.type === TransactionType.INCOME ? 'text-emerald-700' : 'text-rose-600'}`}>
                        {tx.type === TransactionType.INCOME ? '+' : '-'}${tx.amount.toLocaleString('es-CL')}
                      </p>
                    </td>
                    <td className="px-10 py-5 text-right">
                      <div className="flex justify-end space-x-2">
                        {tx.type === TransactionType.INCOME && member && (
                          <button 
                            onClick={() => handleSendReceipt(tx, 'whatsapp')} 
                            className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl hover:bg-emerald-100 transition shadow-sm"
                            title="Enviar por WhatsApp"
                          >
                            <Icons.WhatsApp />
                          </button>
                        )}
                        {canEdit && (
                          <button onClick={() => handleDeleteTx(tx.id)} className="p-3 text-rose-300 hover:text-rose-600 rounded-2xl transition">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredTransactions.length === 0 && (
                <tr><td colSpan={5} className="px-10 py-20 text-center text-slate-400 font-bold italic">No hay registros financieros.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && canEdit && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xl flex items-center justify-center z-[100] p-6 overflow-y-auto">
          <div className="bg-white w-full max-w-xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95">
            <div className="bg-slate-900 p-10 text-white flex justify-between items-center">
              <div>
                <h3 className="text-3xl font-black tracking-tighter">Nuevo Registro</h3>
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em] mt-2">Caja Tierra Esperanza</p>
              </div>
              <button onClick={() => setShowForm(false)} className="w-12 h-12 rounded-2xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-3xl font-light transition-all">&times;</button>
            </div>
            <form onSubmit={handleAdd} className="p-10 space-y-6">
              <div className="flex bg-slate-100 p-1.5 rounded-[1.5rem] shadow-inner">
                <button type="button" onClick={() => setNewTx({...newTx, type: TransactionType.INCOME})} className={`flex-1 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all ${newTx.type === TransactionType.INCOME ? 'bg-white text-emerald-700 shadow-md' : 'text-slate-400'}`}>Ingreso de Fondos</button>
                <button type="button" onClick={() => setNewTx({...newTx, type: TransactionType.EXPENSE})} className={`flex-1 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all ${newTx.type === TransactionType.EXPENSE ? 'bg-white text-rose-600 shadow-md' : 'text-slate-400'}`}>Egreso / Pago</button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-2">Monto ($ CLP)</label>
                  <input type="number" required className="w-full px-6 py-4 border-2 border-slate-100 rounded-2xl focus:border-emerald-600 outline-none transition font-black text-lg bg-slate-50/50" value={newTx.amount} onChange={e => setNewTx({...newTx, amount: parseInt(e.target.value) || 0})}/>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-2">Método</label>
                  <select className="w-full px-6 py-4 border-2 border-slate-100 rounded-2xl focus:border-emerald-600 outline-none font-black text-[11px] uppercase tracking-wider bg-slate-50/50" value={newTx.paymentMethod} onChange={e => setNewTx({...newTx, paymentMethod: e.target.value as PaymentMethod})}>
                    <option value={PaymentMethod.CASH}>Efectivo</option>
                    <option value={PaymentMethod.TRANSFER}>Transferencia</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-2">Concepto del Movimiento</label>
                <input type="text" required className="w-full px-6 py-4 border-2 border-slate-100 rounded-2xl focus:border-emerald-600 outline-none transition font-black text-slate-900 bg-slate-50/50" placeholder="Ej: Pago cuota social Junio" value={newTx.description} onChange={e => setNewTx({...newTx, description: e.target.value})}/>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-2">Socio Vinculado (Opcional)</label>
                <select className="w-full px-6 py-4 border-2 border-slate-100 rounded-2xl focus:border-emerald-600 outline-none font-black text-[11px] bg-slate-50/50" value={newTx.memberId || ''} onChange={e => setNewTx({...newTx, memberId: e.target.value})}>
                  <option value="">-- Pago General --</option>
                  {members.map(m => <option key={m.id} value={m.id}>{m.name} ({m.rut})</option>)}
                </select>
              </div>

              <div className="flex justify-end space-x-6 pt-6 border-t border-slate-50">
                <button type="button" onClick={() => setShowForm(false)} className="px-6 py-3 font-black text-slate-400 uppercase tracking-widest text-xs">Cancelar</button>
                <button type="submit" className="px-10 py-4 bg-emerald-700 text-white rounded-[1.5rem] font-black shadow-2xl shadow-emerald-700/30 uppercase text-xs tracking-widest">Registrar Movimiento</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Treasury;
