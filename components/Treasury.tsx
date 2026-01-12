
import React, { useState } from 'react';
import { Transaction, TransactionType, Member, PaymentMethod, User, BoardRole } from '../types';
import { generateReceiptText } from '../services/geminiService';
// Fix: Import Icons from constants to allow access to Icons.Clipboard and Icons.Dashboard
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

  const filteredTransactions = filterMethod === 'ALL' 
    ? transactions 
    : transactions.filter(t => t.paymentMethod === filterMethod);

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

  const handleExportCSV = () => {
    if (filteredTransactions.length === 0) {
      alert("No hay transacciones para exportar.");
      return;
    }

    const headers = ["ID", "Fecha", "Monto", "Tipo", "Metodo", "Referencia", "Descripcion", "Socio"];
    const rows = filteredTransactions.map(tx => {
      const member = members.find(m => m.id === tx.memberId);
      return [
        tx.id,
        tx.date,
        tx.amount,
        tx.type,
        tx.paymentMethod,
        tx.referenceNumber || "",
        `"${tx.description.replace(/"/g, '""')}"`,
        `"${(member ? member.name : "N/A").replace(/"/g, '""')}"`
      ];
    });

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `tesoreria_tierra_esperanza_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintReport = () => {
    if (filteredTransactions.length === 0) {
      alert("No hay datos para generar el reporte.");
      return;
    }

    const totalIncome = filteredTransactions.filter(t => t.type === TransactionType.INCOME).reduce((acc, t) => acc + t.amount, 0);
    const totalExpense = filteredTransactions.filter(t => t.type === TransactionType.EXPENSE).reduce((acc, t) => acc + t.amount, 0);
    const balance = totalIncome - totalExpense;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const tableRows = filteredTransactions.map(tx => {
      const member = members.find(m => m.id === tx.memberId);
      return `
        <tr>
          <td>${tx.date}</td>
          <td><strong>${tx.id}</strong></td>
          <td>${tx.description}<br/><small style="color: #64748b">${member ? member.name : 'N/A'}</small></td>
          <td>${tx.paymentMethod}</td>
          <td style="text-align: right; font-weight: bold; color: ${tx.type === TransactionType.INCOME ? '#059669' : '#dc2626'}">
            ${tx.type === TransactionType.INCOME ? '+' : '-'}$${tx.amount.toLocaleString('es-CL')}
          </td>
        </tr>
      `;
    }).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>Reporte de Tesorería - Tierra Esperanza</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap');
            body { font-family: 'Inter', sans-serif; color: #1e293b; padding: 40px; }
            .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; margin-bottom: 30px; }
            .title h1 { margin: 0; color: #059669; font-size: 24px; }
            .title p { margin: 5px 0 0; color: #64748b; font-size: 12px; text-transform: uppercase; }
            .summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 30px; }
            .summary-card { background: #f8fafc; padding: 15px; border-radius: 12px; border: 1px solid #e2e8f0; }
            .summary-card h4 { margin: 0; font-size: 10px; color: #64748b; text-transform: uppercase; }
            .summary-card p { margin: 5px 0 0; font-size: 20px; font-weight: 800; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
            th { text-align: left; padding: 12px; border-bottom: 2px solid #e2e8f0; color: #64748b; text-transform: uppercase; }
            td { padding: 12px; border-bottom: 1px solid #f1f5f9; }
            .footer { margin-top: 50px; text-align: center; font-size: 10px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 20px; }
            @media print { body { padding: 0; } .no-print { display: none; } }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">
              <h1>Comité Tierra Esperanza</h1>
              <p>Reporte General de Tesorería</p>
            </div>
          </div>
          <div class="summary">
            <div class="summary-card"><h4>Total Ingresos</h4><p style="color: #059669">$${totalIncome.toLocaleString('es-CL')}</p></div>
            <div class="summary-card"><h4>Total Egresos</h4><p style="color: #dc2626">$${totalExpense.toLocaleString('es-CL')}</p></div>
            <div class="summary-card"><h4>Balance Neto</h4><p>$${balance.toLocaleString('es-CL')}</p></div>
          </div>
          <table>
            <thead><tr><th>Fecha</th><th>Folio</th><th>Descripción / Socio</th><th>Método</th><th style="text-align: right">Monto</th></tr></thead>
            <tbody>${tableRows}</tbody>
          </table>
          <script>window.onload = function() { window.print(); window.onafterprint = function() { window.close(); }; }</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handlePrintReceipt = (tx: Transaction) => {
    const member = members.find(m => m.id === tx.memberId);
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Recibo Oficial TE-${tx.id}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap');
            body { font-family: 'Inter', sans-serif; padding: 20px; }
            .folio-badge { background: #1e293b; color: white; padding: 5px 10px; border-radius: 4px; display: inline-block; font-weight: bold; }
            .amount-wrap { border: 2px dashed #059669; padding: 20px; text-align: center; margin-top: 20px; }
            .amount-val { font-size: 32px; color: #059669; font-weight: 800; }
          </style>
        </head>
        <body>
          <h1>Comité Tierra Esperanza</h1>
          <div class="folio-badge">FOLIO: ${tx.id}</div>
          <p>Socio: ${member ? member.name : 'Pago General'}</p>
          <p>Concepto: ${tx.description}</p>
          <div class="amount-wrap"><span class="amount-val">$${tx.amount.toLocaleString('es-CL')}</span></div>
          <script>window.onload = function() { window.print(); window.onafterprint = function() { window.close(); }; }</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleSendReceipt = (tx: Transaction, method: 'whatsapp' | 'email') => {
    const member = members.find(m => m.id === tx.memberId);
    if (!member) return;
    const receiptText = generateReceiptText(member, tx);
    if (method === 'whatsapp') {
      const url = `https://wa.me/${member.phone.replace('+', '')}?text=${encodeURIComponent(receiptText)}`;
      window.open(url, '_blank');
    } else {
      window.location.href = `mailto:${member.email}?subject=Recibo TE-${tx.id}&body=${encodeURIComponent(receiptText)}`;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Tesorería y Finanzas</h2>
          <p className="text-slate-500">Administración de fondos y emisión de recibos</p>
        </div>
        <div className="flex flex-wrap gap-2">
           <select 
            className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium outline-none"
            value={filterMethod}
            onChange={(e) => setFilterMethod(e.target.value as any)}
          >
            <option value="ALL">Todos los métodos</option>
            <option value={PaymentMethod.CASH}>Efectivo</option>
            <option value={PaymentMethod.TRANSFER}>Transferencia</option>
          </select>
          <button onClick={handlePrintReport} className="bg-emerald-50 text-emerald-700 px-4 py-2 rounded-xl font-semibold text-sm">Reporte PDF</button>
          <button onClick={handleExportCSV} className="bg-slate-100 text-slate-700 px-4 py-2 rounded-xl font-semibold text-sm">Exportar CSV</button>
          {canEdit && (
            <button 
              onClick={() => setShowForm(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-xl font-bold transition shadow-lg shadow-emerald-600/20"
            >
              Nueva Transacción
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-[10px] uppercase tracking-widest font-bold">
                <th className="px-6 py-5">Folio / Fecha</th>
                <th className="px-6 py-5">Socio y Concepto</th>
                <th className="px-6 py-5">Detalle Pago</th>
                <th className="px-6 py-5 text-right">Monto</th>
                <th className="px-6 py-5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTransactions.map(tx => {
                const member = members.find(m => m.id === tx.memberId);
                return (
                  <tr key={tx.id} className="hover:bg-slate-50/50 transition group">
                    <td className="px-6 py-4">
                      <p className="text-xs font-black text-slate-400">#{tx.id}</p>
                      <p className="text-xs text-slate-600">{tx.date}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-800">{tx.description}</p>
                      {member && <button onClick={() => onViewMember(member.id)} className="text-xs text-emerald-600 italic hover:underline">{member.name}</button>}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${tx.paymentMethod === PaymentMethod.CASH ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>{tx.paymentMethod}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <p className={`text-sm font-black ${tx.type === TransactionType.INCOME ? 'text-emerald-600' : 'text-red-600'}`}>
                        {tx.type === TransactionType.INCOME ? '+' : '-'}${tx.amount.toLocaleString('es-CL')}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end space-x-2">
                        <button onClick={() => handlePrintReceipt(tx)} className="p-2 text-slate-400 hover:text-slate-800"><Icons.Clipboard /></button>
                        {tx.type === TransactionType.INCOME && member && (
                          <button onClick={() => handleSendReceipt(tx, 'whatsapp')} className="p-2 text-emerald-500"><Icons.Dashboard /></button>
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

      {showForm && canEdit && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 backdrop-blur-md">
          <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-xl overflow-hidden">
            <div className="bg-emerald-600 p-8 text-white"><h3 className="text-2xl font-black">Registrar Movimiento</h3></div>
            <form onSubmit={handleAdd} className="p-8 space-y-5">
              <div className="flex bg-slate-100 p-1.5 rounded-2xl">
                <button type="button" onClick={() => setNewTx({...newTx, type: TransactionType.INCOME})} className={`flex-1 py-3 rounded-xl text-sm font-black transition ${newTx.type === TransactionType.INCOME ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400'}`}>INGRESO</button>
                <button type="button" onClick={() => setNewTx({...newTx, type: TransactionType.EXPENSE})} className={`flex-1 py-3 rounded-xl text-sm font-black transition ${newTx.type === TransactionType.EXPENSE ? 'bg-white text-red-600 shadow-sm' : 'text-slate-400'}`}>EGRESO</button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <input type="number" required className="w-full px-4 py-3 border rounded-xl font-black" placeholder="Monto" value={newTx.amount} onChange={e => setNewTx({...newTx, amount: parseInt(e.target.value) || 0})}/>
                <input type="text" required className="w-full px-4 py-3 border rounded-xl" placeholder="Descripción" value={newTx.description} onChange={e => setNewTx({...newTx, description: e.target.value})}/>
              </div>
              <select className="w-full px-4 py-3 border rounded-xl" value={newTx.memberId || ''} onChange={e => setNewTx({...newTx, memberId: e.target.value})}>
                <option value="">-- Sin socio --</option>
                {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
              <div className="flex justify-end space-x-4 pt-6">
                <button type="button" onClick={() => setShowForm(false)} className="px-6 py-3 text-slate-400">Cancelar</button>
                <button type="submit" className="px-10 py-3 bg-emerald-600 text-white rounded-2xl font-black">REGISTRAR</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Treasury;
