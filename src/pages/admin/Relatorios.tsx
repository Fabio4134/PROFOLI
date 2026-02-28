import React, { useState, useEffect } from 'react';
import { Download, FileText, Eye, TrendingUp, Users, CheckCircle, DollarSign } from 'lucide-react';
import api from '../../lib/api';
import { generatePDF } from '../../lib/pdf';

const TAXA = 50; // R$ por inscrito

const toTitleCase = (str: string) =>
  str.toLowerCase().split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

const parseRoles = (roles: any): string[] => {
  if (Array.isArray(roles)) return roles;
  try { return JSON.parse(roles); } catch { return []; }
};

export default function Relatorios() {
  const [reportType, setReportType] = useState('inscritos');
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<{ title: string, columns: string[], data: any[][] } | null>(null);
  const [projection, setProjection] = useState<{ total: number; paid: number; exempt: number; pending: number } | null>(null);

  useEffect(() => {
    loadProjection();
  }, []);

  const loadProjection = async () => {
    try {
      const res = await api.get('/attendees');
      const attendees: any[] = res.data;
      const paid = attendees.filter(a => a.payment_status === 'paid').length;
      const exempt = attendees.filter(a => a.payment_status === 'exempt').length;
      const pending = attendees.filter(a => a.payment_status === 'pending').length;
      setProjection({ total: attendees.length, paid, exempt, pending });
    } catch { }
  };

  const fetchReportData = async () => {
    if (reportType === 'inscritos') {
      const res = await api.get('/attendees');
      const columns = ['Nome', 'CPF', 'Igreja', 'Telefone', 'Cargos', 'Status Pgto'];
      const data = res.data.map((a: any) => [
        toTitleCase(a.name),
        a.cpf,
        a.church,
        a.phone,
        parseRoles(a.roles).join(', '),
        a.payment_status === 'paid' ? 'Pago' : a.payment_status === 'exempt' ? 'Isento' : 'Pendente'
      ]);
      return { title: 'Relatório Geral de Inscritos', columns, data };
    } else if (reportType === 'financeiro') {
      const res = await api.get('/financial');
      const columns = ['Data', 'Tipo', 'Categoria', 'Valor (R$)', 'Descrição', 'Inscrito'];
      const data = res.data.map((t: any) => [
        new Date(t.date).toLocaleDateString('pt-BR'),
        t.type === 'income' ? 'Entrada' : 'Saída',
        t.category,
        t.amount.toFixed(2),
        t.description || '-',
        t.attendee_name || '-'
      ]);
      return { title: 'Relatório Financeiro', columns, data };
    } else if (reportType === 'chamadas') {
      const [attRes, recRes] = await Promise.all([
        api.get('/attendees'),
        api.get('/attendance')
      ]);
      const dates = [...new Set(recRes.data.map((r: any) => r.date))].sort() as string[];
      const columns = ['Nome', ...dates];
      const data = attRes.data.map((a: any) => {
        const row = [toTitleCase(a.name)];
        dates.forEach(d => {
          const record = recRes.data.find((r: any) => r.attendee_id === a.id && r.date === d);
          row.push(record?.present ? 'Presente' : 'Ausente');
        });
        return row;
      });
      return { title: 'Relatório de Frequência', columns, data };
    }
    return null;
  };

  const handleViewReport = async () => {
    setLoading(true);
    try {
      const data = await fetchReportData();
      setReportData(data);
    } catch (e) {
      alert('Erro ao carregar relatório.');
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePDF = async () => {
    setLoading(true);
    try {
      const data = reportData || await fetchReportData();
      if (data) generatePDF(data.title, data.columns, data.data);
    } catch (e) {
      alert('Erro ao gerar relatório.');
    } finally {
      setLoading(false);
    }
  };

  const estimativaTotal = projection ? projection.total * TAXA : 0;
  const arrecadadoConfirmado = projection ? projection.paid * TAXA : 0;
  const pendente = projection ? projection.pending * TAXA : 0;

  return (
    <div className="space-y-6">

      {/* ── Projeção de Arrecadação ── */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
          <div className="bg-emerald-100 p-2 rounded-lg text-emerald-600">
            <TrendingUp size={20} />
          </div>
          <div>
            <h2 className="font-semibold text-gray-800">Projeção de Arrecadação</h2>
            <p className="text-xs text-gray-500">Taxa por inscrito: R$ {TAXA.toFixed(2)} · Dados atualizados automaticamente</p>
          </div>
        </div>

        {projection ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-0 divide-x divide-y md:divide-y-0 divide-gray-100">
            {/* Total inscritos */}
            <div className="p-5 flex flex-col gap-1">
              <div className="flex items-center gap-2 text-gray-500 text-xs font-medium uppercase tracking-wide">
                <Users size={14} />
                Total Inscritos
              </div>
              <p className="text-2xl font-bold text-gray-800">{projection.total}</p>
              <p className="text-xs text-gray-400">participantes</p>
            </div>

            {/* Estimativa bruta */}
            <div className="p-5 flex flex-col gap-1 bg-blue-50">
              <div className="flex items-center gap-2 text-blue-600 text-xs font-medium uppercase tracking-wide">
                <DollarSign size={14} />
                Estimativa Total
              </div>
              <p className="text-2xl font-bold text-blue-700">R$ {estimativaTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              <p className="text-xs text-blue-400">{projection.total} × R$ {TAXA}</p>
            </div>

            {/* Confirmado */}
            <div className="p-5 flex flex-col gap-1 bg-emerald-50">
              <div className="flex items-center gap-2 text-emerald-600 text-xs font-medium uppercase tracking-wide">
                <CheckCircle size={14} />
                Confirmado
              </div>
              <p className="text-2xl font-bold text-emerald-700">R$ {arrecadadoConfirmado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              <p className="text-xs text-emerald-400">{projection.paid} confirmados · {projection.exempt} isentos</p>
            </div>

            {/* Pendente */}
            <div className="p-5 flex flex-col gap-1 bg-amber-50">
              <div className="flex items-center gap-2 text-amber-600 text-xs font-medium uppercase tracking-wide">
                <DollarSign size={14} />
                Pendente
              </div>
              <p className="text-2xl font-bold text-amber-700">R$ {pendente.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              <p className="text-xs text-amber-400">{projection.pending} pendentes</p>
            </div>
          </div>
        ) : (
          <div className="p-8 text-center text-gray-400">Carregando projeção...</div>
        )}

        {/* Progress bar */}
        {projection && projection.total > 0 && (
          <div className="px-6 pb-5">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Confirmados: {projection.paid}/{projection.total}</span>
              <span>{Math.round((projection.paid / projection.total) * 100)}%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div
                className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${(projection.paid / projection.total) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* ── Gerador de Relatórios ── */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 max-w-3xl mx-auto">
        <div className="flex items-center space-x-3 mb-6">
          <div className="bg-blue-100 p-3 rounded-lg text-blue-600">
            <FileText size={24} />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-800">Gerador de Relatórios</h2>
            <p className="text-sm text-gray-500">Selecione o tipo de relatório que deseja visualizar ou exportar</p>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Relatório</label>
            <select
              className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
              value={reportType}
              onChange={e => { setReportType(e.target.value); setReportData(null); }}
            >
              <option value="inscritos">Relatório Geral de Inscritos</option>
              <option value="chamadas">Relatório de Frequência (Chamadas)</option>
              <option value="financeiro">Relatório Financeiro (Entradas e Saídas)</option>
            </select>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={handleViewReport}
              disabled={loading}
              className="flex-1 bg-gray-100 text-gray-800 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors flex justify-center items-center space-x-2 disabled:opacity-70"
            >
              <Eye size={20} />
              <span>{loading ? 'Carregando...' : 'Visualizar em Tela'}</span>
            </button>
            <button
              onClick={handleGeneratePDF}
              disabled={loading}
              className="flex-1 bg-[#1e3a8a] text-white py-3 rounded-lg font-medium hover:bg-blue-800 transition-colors flex justify-center items-center space-x-2 disabled:opacity-70"
            >
              <Download size={20} />
              <span>Gerar PDF</span>
            </button>
          </div>
        </div>
      </div>

      {reportData && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800">{reportData.title}</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  {reportData.columns.map((col, i) => (
                    <th key={i} className="p-4 text-sm font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {reportData.data.map((row, i) => (
                  <tr key={i} className="hover:bg-gray-50 transition-colors">
                    {row.map((cell: any, j: number) => (
                      <td key={j} className="p-4 text-sm text-gray-700 whitespace-nowrap">
                        {cell === 'Presente' ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Presente</span>
                        ) : cell === 'Ausente' ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Ausente</span>
                        ) : cell === 'Pago' ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Pago</span>
                        ) : cell === 'Isento' ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">Isento</span>
                        ) : cell === 'Pendente' ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Pendente</span>
                        ) : cell === 'Entrada' ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Entrada</span>
                        ) : cell === 'Saída' ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Saída</span>
                        ) : (
                          cell
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
                {reportData.data.length === 0 && (
                  <tr>
                    <td colSpan={reportData.columns.length} className="p-8 text-center text-gray-500">
                      Nenhum dado encontrado para este relatório.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
