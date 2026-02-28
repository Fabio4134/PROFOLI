import React, { useState } from 'react';
import { Download, FileText, Eye } from 'lucide-react';
import api from '../../lib/api';
import { generatePDF } from '../../lib/pdf';

export default function Relatorios() {
  const [reportType, setReportType] = useState('inscritos');
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<{ title: string, columns: string[], data: any[][] } | null>(null);

  const fetchReportData = async () => {
    if (reportType === 'inscritos') {
      const res = await api.get('/attendees');
      const columns = ['Nome', 'CPF', 'Igreja', 'Telefone', 'Cargos', 'Status Pgto'];
      const data = res.data.map((a: any) => {
        let cargosStr = '';
        try {
          const parsed = JSON.parse(a.roles);
          cargosStr = Array.isArray(parsed) ? parsed.join(', ') : a.roles;
        } catch (e) {
          cargosStr = a.roles;
        }
        return [
          a.name,
          a.cpf,
          a.church,
          a.phone,
          cargosStr,
          a.payment_status === 'paid' ? 'Pago' : a.payment_status === 'exempt' ? 'Isento' : 'Pendente'
        ];
      });
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
        const row = [a.name];
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
      if (data) {
        generatePDF(data.title, data.columns, data.data);
      }
    } catch (e) {
      alert('Erro ao gerar relatório.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
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
              onChange={e => {
                setReportType(e.target.value);
                setReportData(null);
              }}
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
              <span>Gerar PDF (Opcional)</span>
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
                    {row.map((cell, j) => (
                      <td key={j} className="p-4 text-sm text-gray-700 whitespace-nowrap">
                        {cell === 'Presente' ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Presente
                          </span>
                        ) : cell === 'Ausente' ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            Ausente
                          </span>
                        ) : cell === 'Pago' ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Pago
                          </span>
                        ) : cell === 'Isento' ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            Isento
                          </span>
                        ) : cell === 'Pendente' ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            Pendente
                          </span>
                        ) : cell === 'Entrada' ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Entrada
                          </span>
                        ) : cell === 'Saída' ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            Saída
                          </span>
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
