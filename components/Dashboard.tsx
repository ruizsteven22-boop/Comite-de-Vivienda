
import React, { useState, useEffect } from 'react';
import { Member, Transaction, Assembly, TransactionType } from '../types';
import { getFinancialSummary } from '../services/geminiService';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface DashboardProps {
  members: Member[];
  transactions: Transaction[];
  assemblies: Assembly[];
}

const Dashboard: React.FC<DashboardProps> = ({ members, transactions, assemblies }) => {
  const [aiSummary, setAiSummary] = useState<string>('Cargando resumen inteligente...');

  const totalIncome = transactions
    .filter(t => t.type === TransactionType.INCOME)
    .reduce((acc, curr) => acc + curr.amount, 0);
    
  const totalExpense = transactions
    .filter(t => t.type === TransactionType.EXPENSE)
    .reduce((acc, curr) => acc + curr.amount, 0);

  const balance = totalIncome - totalExpense;

  useEffect(() => {
    const fetchSummary = async () => {
      const summary = await getFinancialSummary(transactions);
      setAiSummary(summary || 'No se pudo generar el resumen.');
    };
    fetchSummary();
  }, [transactions]);

  const chartData = [
    { name: 'Ingresos', value: totalIncome },
    { name: 'Egresos', value: totalExpense },
  ];

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-3xl font-bold text-slate-800">Panel de Control</h2>
        <p className="text-slate-500">Vista general del comité Tierra Esperanza</p>
      </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Total Socios</p>
          <div className="flex items-end justify-between mt-2">
            <p className="text-4xl font-bold text-slate-800">{members.length}</p>
            <span className="text-emerald-600 font-semibold bg-emerald-50 px-2 py-1 rounded text-xs">Activos</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Saldo Caja</p>
          <div className="mt-2">
            <p className="text-4xl font-bold text-emerald-600">${balance.toLocaleString('es-CL')}</p>
            <p className="text-xs text-slate-400 mt-1">Acumulado total</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Ingresos Mayo</p>
          <div className="mt-2">
            <p className="text-4xl font-bold text-blue-600">${totalIncome.toLocaleString('es-CL')}</p>
            <p className="text-xs text-slate-400 mt-1">Cuotas y otros</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">Asambleas</p>
          <div className="mt-2">
            <p className="text-4xl font-bold text-amber-600">{assemblies.length}</p>
            <p className="text-xs text-slate-400 mt-1">Realizadas en 2024</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-semibold text-slate-800 mb-6">Flujo de Caja</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? '#10b981' : '#ef4444'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* AI Summary */}
        <div className="bg-emerald-900 text-emerald-50 p-6 rounded-2xl shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L1 21h22L12 2zm0 3.45L20.1 19H3.9L12 5.45zM11 10v4h2v-4h-2zm0 6v2h2v-2h-2z" /></svg>
          </div>
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <span className="mr-2">✨</span> Informe IA - Tesorería
          </h3>
          <div className="text-sm leading-relaxed space-y-3 whitespace-pre-line opacity-90">
            {aiSummary}
          </div>
          <div className="mt-6 pt-4 border-t border-emerald-800 flex justify-between items-center">
            <span className="text-xs text-emerald-400 italic">Generado con Gemini 3 Flash</span>
            <button className="text-xs font-bold uppercase tracking-tighter hover:text-white">Refrescar</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
