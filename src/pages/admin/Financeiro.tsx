import React, { useEffect, useState } from 'react';
import { Download, Plus, Trash2, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import api from '../../lib/api';
import { generatePDF } from '../../lib/pdf';

export default function Financeiro() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [attendees, setAttendees] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [transactionType, setTransactionType] = useState<'income' | 'expense'>('income');
  const [isExempt, setIsExempt] = useState(false);
  
  const [formData, setFormData] = useState({
    category: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
    attendee_id: ''
  });

  const expenseCategories = [
    'Ajuda de custo para o Palestrante',
    'Material de secretaria',
    'Alimentação',
    'Hospedagem',
    'Ajuda de Custo',
    'Outros'
  ];

  const fetchTransactions = async () => {
    const res = await api.get('/financial');
    setTransactions(res.data);
  };

  const fetchAttendees = async () => {
    const res = await api.get('/attendees');
    setAttendees(res.data);
  };

  useEffect(() => {
    fetchTransactions();
    fetchAttendees();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/financial', {
        type: transactionType,
        category: formData.category,
        amount: isExempt ? 0 : parseFloat(formData.amount),
        date: formData.date,
        description: isExempt ? `[ISENÇÃO] ${formData.description}` : formData.description,
        attendee_id: formData.attendee_id ? parseInt(formData.attendee_id) : null,
        is_exempt: isExempt
      });
      setShowModal(false);
      setFormData({
        category: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        description: '',
        attendee_id: ''
      });
      setIsExempt(false);
      fetchTransactions();
    } catch (error) {
      alert('Erro ao registrar transação.');
    }
  };

  const handleDelete = async (id: number) => {
    setDeleteConfirmId(id);
  };

  const confirmDelete = async () => {
    if (deleteConfirmId) {
      try {
        await api.delete(`/financial/${deleteConfirmId}`);
        fetchTransactions();
      } catch (error: any) {
        alert(error.response?.data?.error || 'Erro ao excluir.');
      } finally {
        setDeleteConfirmId(null);
      }
    }
  };

  const handleDownloadPDF = () => {
    const columns = ['Data', 'Tipo', 'Categoria', 'Valor (R$)', 'Descrição', 'Inscrito'];
    const data = transactions.map(t => [
      new Date(t.date).toLocaleDateString('pt-BR'),
      t.type === 'income' ? 'Entrada' : 'Saída',
      t.category,
      t.amount.toFixed(2),
      t.description || '-',
      t.attendee_name || '-'
    ]);
    generatePDF('Relatório Financeiro', columns, data);
  };

  const openModal = (type: 'income' | 'expense') => {
    setTransactionType(type);
    setIsExempt(false);
    setFormData({
      ...formData,
      category: type === 'income' ? 'Inscrição' : expenseCategories[0],
      amount: '',
      attendee_id: ''
    });
    setShowModal(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex space-x-3">
          <button 
            onClick={() => openModal('income')}
            className="flex items-center space-x-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors"
          >
            <ArrowUpRight size={18} />
            <span>Nova Entrada</span>
          </button>
          <button 
            onClick={() => openModal('expense')}
            className="flex items-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            <ArrowDownRight size={18} />
            <span>Nova Saída</span>
          </button>
        </div>
        
        <button 
          onClick={handleDownloadPDF}
          className="flex items-center space-x-2 bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
        >
          <Download size={18} />
          <span>Baixar PDF</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-600 text-sm uppercase tracking-wider">
                <th className="p-4 font-medium">Data</th>
                <th className="p-4 font-medium">Tipo</th>
                <th className="p-4 font-medium">Categoria</th>
                <th className="p-4 font-medium">Descrição</th>
                <th className="p-4 font-medium">Inscrito Vinculado</th>
                <th className="p-4 font-medium text-right">Valor</th>
                <th className="p-4 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {transactions.map((t) => (
                <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4 text-gray-600">{new Date(t.date).toLocaleDateString('pt-BR')}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      t.type === 'income' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {t.type === 'income' ? 'Entrada' : 'Saída'}
                    </span>
                  </td>
                  <td className="p-4 text-gray-900">{t.category}</td>
                  <td className="p-4 text-gray-600">{t.description || '-'}</td>
                  <td className="p-4 text-gray-600">{t.attendee_name || '-'}</td>
                  <td className={`p-4 text-right font-medium ${t.type === 'income' ? 'text-emerald-600' : 'text-red-600'}`}>
                    {t.type === 'income' ? '+' : '-'} R$ {t.amount.toFixed(2)}
                  </td>
                  <td className="p-4 text-right">
                    <button 
                      onClick={() => handleDelete(t.id)}
                      className="text-red-500 hover:text-red-700 p-1"
                      title="Excluir"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              {transactions.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-500">
                    Nenhuma transação registrada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className={`p-4 text-white flex justify-between items-center ${
              transactionType === 'income' ? 'bg-emerald-600' : 'bg-red-600'
            }`}>
              <h3 className="text-lg font-semibold">
                {transactionType === 'income' ? 'Registrar Entrada' : 'Registrar Saída'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-white/80 hover:text-white">✕</button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {transactionType === 'income' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Categoria *</label>
                  <select 
                    required
                    className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                    value={formData.category}
                    onChange={e => setFormData({...formData, category: e.target.value})}
                  >
                    <option value="Inscrição">Inscrição</option>
                    <option value="Doação">Doação</option>
                    <option value="Outros">Outros</option>
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Categoria *</label>
                  <select 
                    required
                    className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                    value={formData.category}
                    onChange={e => setFormData({...formData, category: e.target.value})}
                  >
                    {expenseCategories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              )}

              {transactionType === 'income' && formData.category === 'Inscrição' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Vincular a Inscrito</label>
                    <select 
                      className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                      value={formData.attendee_id}
                      onChange={e => setFormData({...formData, attendee_id: e.target.value})}
                    >
                      <option value="">Selecione um inscrito...</option>
                      {attendees.map(a => (
                        <option key={a.id} value={a.id}>{a.name} ({a.cpf})</option>
                      ))}
                    </select>
                  </div>
                  
                  {formData.attendee_id && (
                    <div className="flex items-center space-x-2 bg-blue-50 p-3 rounded-lg border border-blue-100">
                      <input 
                        type="checkbox" 
                        id="isExempt"
                        checked={isExempt}
                        onChange={(e) => {
                          setIsExempt(e.target.checked);
                          if (e.target.checked) {
                            setFormData({...formData, amount: '0'});
                          } else {
                            setFormData({...formData, amount: ''});
                          }
                        }}
                        className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                      />
                      <label htmlFor="isExempt" className="text-sm font-medium text-blue-800 cursor-pointer">
                        Isentar pagamento (Inscrição gratuita)
                      </label>
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Valor (R$) *</label>
                <input 
                  type="number" 
                  step="0.01"
                  required 
                  disabled={isExempt}
                  className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-100 disabled:text-gray-500"
                  value={formData.amount}
                  onChange={e => setFormData({...formData, amount: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Data *</label>
                <input 
                  type="date" 
                  required 
                  className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formData.date}
                  onChange={e => setFormData({...formData, date: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                <textarea 
                  className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                  rows={3}
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                ></textarea>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button 
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className={`px-4 py-2 text-white rounded-lg transition-colors ${
                    transactionType === 'income' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Delete Confirm Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[60]">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 text-center">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 size={32} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Excluir Registro</h3>
            <p className="text-gray-600 mb-6">Tem certeza que deseja excluir este registro financeiro? Esta ação não poderá ser desfeita.</p>
            <div className="flex justify-center space-x-3">
              <button 
                onClick={() => setDeleteConfirmId(null)}
                className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                Cancelar
              </button>
              <button 
                onClick={confirmDelete}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                Sim, Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
