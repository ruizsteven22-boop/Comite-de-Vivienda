
import React, { useState } from 'react';
import { Transaction, TransactionType, Member, PaymentMethod } from '../types';
import { generateReceiptText } from '../services/geminiService';

interface TreasuryProps {
  transactions: Transaction[];
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
  members: Member[];
  onViewMember: (id: string) => void;
}

const Treasury: React.FC<TreasuryProps> = ({ transactions, setTransactions, members, onViewMember }) => {
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

  const filteredTransactions = filterMethod === 'ALL' 
    ? transactions 
    : transactions.filter(t => t.paymentMethod === filterMethod);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
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
            <div style="text-align: right">
              <p style="font-size: 10px; color: #64748b">Generado: ${new Date().toLocaleString()}</p>
            </div>
          </div>

          <div class="summary">
            <div class="summary-card">
              <h4>Total Ingresos</h4>
              <p style="color: #059669">$${totalIncome.toLocaleString('es-CL')}</p>
            </div>
            <div class="summary-card">
              <h4>Total Egresos</h4>
              <p style="color: #dc2626">$${totalExpense.toLocaleString('es-CL')}</p>
            </div>
            <div class="summary-card">
              <h4>Balance Neto</h4>
              <p>$${balance.toLocaleString('es-CL')}</p>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Folio</th>
                <th>Descripción / Socio</th>
                <th>Método</th>
                <th style="text-align: right">Monto</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>

          <div class="footer">
            Este reporte es para uso administrativo del Comité Tierra Esperanza. El saldo reflejado corresponde a los filtros aplicados al momento de la generación.
          </div>

          <script>
            window.onload = function() { window.print(); window.onafterprint = function() { window.close(); }; }
          </script>
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
            body { font-family: 'Inter', sans-serif; padding: 0; margin: 0; color: #1e293b; background: #f8fafc; }
            .page { background: white; width: 148mm; height: 210mm; margin: 20px auto; padding: 20px; box-shadow: 0 0 10px rgba(0,0,0,0.1); position: relative; border: 1px solid #e2e8f0; }
            .header { border-bottom: 4px solid #059669; padding-bottom: 15px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-start; }
            .logo-area h1 { margin: 0; color: #059669; font-size: 22px; font-weight: 800; }
            .logo-area p { margin: 2px 0; font-size: 10px; color: #64748b; text-transform: uppercase; letter-spacing: 1px; }
            .folio-area { text-align: right; }
            .folio-badge { background: #1e293b; color: white; padding: 5px 10px; border-radius: 4px; font-weight: bold; font-size: 14px; }
            .date { font-size: 11px; color: #64748b; margin-top: 5px; }
            .content { margin-top: 30px; }
            .row { display: flex; border-bottom: 1px solid #f1f5f9; padding: 10px 0; }
            .label { width: 140px; font-size: 11px; font-weight: bold; color: #64748b; text-transform: uppercase; }
            .value { flex: 1; font-size: 14px; color: #0f172a; font-weight: 500; }
            .amount-wrap { margin-top: 40px; background: #f0fdf4; border: 2px dashed #059669; padding: 20px; text-align: center; border-radius: 12px; }
            .amount-label { font-size: 12px; color: #065f46; font-weight: bold; margin-bottom: 5px; display: block; }
            .amount-val { font-size: 32px; color: #059669; font-weight: 800; }
            .signatures { margin-top: 80px; display: flex; justify-content: space-around; }
            .sig-box { border-top: 1px solid #94a3b8; width: 160px; text-align: center; padding-top: 8px; font-size: 10px; color: #64748b; font-weight: bold; }
            .watermark { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%) rotate(-45deg); font-size: 60px; color: rgba(5, 150, 105, 0.03); font-weight: 900; white-space: nowrap; pointer-events: none; }
            .footer-info { position: absolute; bottom: 20px; left: 20px; right: 20px; text-align: center; font-size: 9px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 10px; }
            @media print {
              body { background: white; }
              .page { margin: 0; box-shadow: none; border: none; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="page">
            <div class="watermark">TIERRA ESPERANZA</div>
            <div class="header">
              <div class="logo-area">
                <h1>Comité Tierra Esperanza</h1>
                <p>Gestión de Vivienda Comunitaria</p>
              </div>
              <div class="folio-area">
                <div class="folio-badge">FOLIO: ${tx.id}</div>
                <div class="date">Emitido: ${tx.date}</div>
              </div>
            </div>

            <div class="content">
              <div class="row"><div class="label">Socio Receptor</div><div class="value">${member ? member.name : 'Pago General / Externo'}</div></div>
              <div class="row"><div class="label">RUT</div><div class="value">${member ? member.rut : 'N/A'}</div></div>
              <div class="row"><div class="label">Concepto</div><div class="value">${tx.description}</div></div>
              <div class="row"><div class="label">Método de Pago</div><div class="value">${tx.paymentMethod}</div></div>
              ${tx.referenceNumber ? `<div class="row"><div class="label">N° Referencia</div><div class="value">${tx.referenceNumber}</div></div>` : ''}
            </div>

            <div class="amount-wrap">
              <span class="amount-label">CANTIDAD RECIBIDA</span>
              <span class="amount-val">$${tx.amount.toLocaleString('es-CL')}</span>
            </div>

            <div class="signatures">
              <div class="sig-box">TESORERÍA Y TIMBRE</div>
              <div class="sig-box">FIRMA CONFORME SOCIO</div>
            </div>

            <div class="footer-info">
              Documento generado por el Sistema de Gestión Tierra Esperanza. Para validez legal requiere firma y timbre de la directiva vigente.
            </div>
          </div>
          <script>
            window.onload = function() { window.print(); window.onafterprint = function() { window.close(); }; }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleSendReceipt = (tx: Transaction, method: 'whatsapp' | 'email') => {
    const member = members.find(m => m.id === tx.memberId);
    if (!member) {
      alert("Para enviar por WhatsApp o Email, la transacción debe estar asociada a un socio.");
      return;
    }

    const receiptText = generateReceiptText(member, tx);
    
    if (method === 'whatsapp') {
      const url = `https://wa.me/${member.phone.replace('+', '')}?text=${encodeURIComponent(receiptText)}`;
      window.open(url, '_blank');
    } else {
      const subject = encodeURIComponent(`Comprobante de Pago Folio ${tx.id} - Tierra Esperanza`);
      const body = encodeURIComponent(receiptText);
      window.location.href = `mailto:${member.email}?subject=${subject}&body=${body}`;
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
            className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
            value={filterMethod}
            onChange={(e) => setFilterMethod(e.target.value as any)}
          >
            <option value="ALL">Todos los métodos</option>
            <option value={PaymentMethod.CASH}>Efectivo</option>
            <option value={PaymentMethod.TRANSFER}>Transferencia</option>
          </select>
          <button 
            onClick={handlePrintReport}
            className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-4 py-2 rounded-xl font-semibold text-sm transition flex items-center"
            title="Imprimir Reporte PDF"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2a2 2 0 00-2-2H5a2 2 0 00-2 2v2m2-4h10a2 2 0 012 2v2M9 7h6m0 10v-3m-3 3h.01M9 17h.01" /></svg>
            Reporte PDF
          </button>
          <button 
            onClick={handleExportCSV}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl font-semibold text-sm transition flex items-center"
            title="Exportar a CSV"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            Exportar CSV
          </button>
          <button 
            onClick={() => setShowForm(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-xl font-bold transition shadow-lg shadow-emerald-600/20"
          >
            Nueva Transacción
          </button>
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
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-xs font-black text-slate-400">#{tx.id}</p>
                      <p className="text-xs text-slate-600">{tx.date}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-800">{tx.description}</p>
                      {member ? (
                        <button 
                          onClick={() => onViewMember(member.id)}
                          className="text-xs text-emerald-600 italic hover:underline hover:text-emerald-700 transition"
                        >
                          {member.name}
                        </button>
                      ) : (
                        <p className="text-xs text-slate-500 italic">Transacción General</p>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border w-fit mb-1 ${
                          tx.paymentMethod === PaymentMethod.CASH ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-blue-50 text-blue-700 border-blue-200'
                        }`}>
                          {tx.paymentMethod}
                        </span>
                        {tx.referenceNumber && (
                          <span className="text-[10px] text-slate-400 font-mono">Ref: {tx.referenceNumber}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <p className={`text-sm font-black ${tx.type === TransactionType.INCOME ? 'text-emerald-600' : 'text-red-600'}`}>
                        {tx.type === TransactionType.INCOME ? '+' : '-'}${tx.amount.toLocaleString('es-CL')}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end space-x-2 opacity-0 group-hover:opacity-100 transition duration-200">
                        <button 
                          onClick={() => handlePrintReceipt(tx)}
                          className="p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
                          title="Imprimir Recibo / PDF"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                        </button>
                        {tx.type === TransactionType.INCOME && member && (
                          <>
                            <button 
                              onClick={() => handleSendReceipt(tx, 'whatsapp')}
                              className="p-2 text-emerald-500 hover:bg-emerald-50 rounded-lg transition"
                              title="Enviar vía WhatsApp"
                            >
                              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.414 0 .018 5.394 0 12.03c0 2.122.554 4.197 1.604 6.01L0 24l6.117-1.605a11.803 11.803 0 005.925 1.583h.005c6.637 0 12.032-5.395 12.035-12.032a11.761 11.761 0 00-3.468-8.491z"/></svg>
                            </button>
                            <button 
                              onClick={() => handleSendReceipt(tx, 'email')}
                              className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition"
                              title="Enviar vía Email"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
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
          {filteredTransactions.length === 0 && (
            <div className="py-20 text-center text-slate-400">
              <p>No se encontraron movimientos financieros con estos criterios.</p>
            </div>
          )}
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-center justify-center p-4 z-50 backdrop-blur-md">
          <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-emerald-600 p-8 text-white">
               <h3 className="text-2xl font-black">Registrar Movimiento</h3>
               <p className="text-emerald-100 text-sm mt-1">Ingrese los detalles para generar el recibo oficial.</p>
            </div>
            
            <form onSubmit={handleAdd} className="p-8 space-y-5">
              <div className="flex bg-slate-100 p-1.5 rounded-2xl">
                <button 
                  type="button"
                  onClick={() => setNewTx({...newTx, type: TransactionType.INCOME})}
                  className={`flex-1 py-3 rounded-xl text-sm font-black transition ${newTx.type === TransactionType.INCOME ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400'}`}
                >INGRESO</button>
                <button 
                  type="button"
                  onClick={() => setNewTx({...newTx, type: TransactionType.EXPENSE})}
                  className={`flex-1 py-3 rounded-xl text-sm font-black transition ${newTx.type === TransactionType.EXPENSE ? 'bg-white text-red-600 shadow-sm' : 'text-slate-400'}`}
                >EGRESO</button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Método de Pago</label>
                  <select 
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 font-bold outline-none focus:border-emerald-500"
                    value={newTx.paymentMethod}
                    onChange={e => setNewTx({...newTx, paymentMethod: e.target.value as PaymentMethod})}
                  >
                    <option value={PaymentMethod.CASH}>Efectivo</option>
                    <option value={PaymentMethod.TRANSFER}>Transferencia</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Ref / Comprobante</label>
                  <input 
                    type="text"
                    placeholder="Ej: #12345"
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 font-bold outline-none focus:border-emerald-500"
                    value={newTx.referenceNumber}
                    onChange={e => setNewTx({...newTx, referenceNumber: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Fecha</label>
                  <input 
                    type="date"
                    required
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 font-bold outline-none"
                    value={newTx.date}
                    onChange={e => setNewTx({...newTx, date: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Monto ($)</label>
                  <input 
                    type="number"
                    required
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 font-black text-lg text-emerald-700 outline-none"
                    value={newTx.amount}
                    onChange={e => setNewTx({...newTx, amount: parseInt(e.target.value) || 0})}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Glosa o Concepto</label>
                <input 
                  type="text"
                  required
                  placeholder="Ej: Pago cuota social mayo 2024"
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 font-bold outline-none focus:border-emerald-500"
                  value={newTx.description}
                  onChange={e => setNewTx({...newTx, description: e.target.value})}
                />
              </div>

              {newTx.type === TransactionType.INCOME && (
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Socio Responsable</label>
                  <select 
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 font-bold outline-none"
                    value={newTx.memberId || ''}
                    onChange={e => setNewTx({...newTx, memberId: e.target.value})}
                  >
                    <option value="">-- Sin socio asignado --</option>
                    {members.map(m => <option key={m.id} value={m.id}>{m.name} ({m.rut})</option>)}
                  </select>
                </div>
              )}

              <div className="flex justify-end space-x-4 pt-6">
                <button 
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-6 py-3 text-slate-400 font-bold hover:text-slate-600"
                >Cancelar</button>
                <button 
                  type="submit"
                  className="px-10 py-3 bg-emerald-600 text-white rounded-2xl font-black shadow-xl shadow-emerald-200 hover:bg-emerald-700 transition"
                >REGISTRAR AHORA</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Treasury;
