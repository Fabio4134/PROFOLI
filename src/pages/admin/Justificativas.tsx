import React, { useEffect, useState } from 'react';
import { Download, Plus, Trash2, UserX } from 'lucide-react';
import api from '../../lib/api';
import { generatePDF } from '../../lib/pdf';
import { useAuthStore } from '../../store/auth';

export default function Justificativas() {
  const [justifications, setJustifications] = useState<any[]>([]);
  const [attendees, setAttendees] = useState<any[]>([]);
  const [themes, setThemes] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  
  const [formData, setFormData] = useState({
    attendee_id: '',
    theme_id: '',
    date: new Date().toISOString().split('T')[0],
    reason: 'Outro'
  });

  const REASONS = [
    'Trabalho', 'Saúde', 'Família', 'Agenda', 'Imprevisto', 'Pessoal', 'Outro'
  ];

  const user = useAuthStore(state => state.user);

  const fetchData = async () => {
    try {
      const [justRes, attRes, themesRes] = await Promise.all([
        api.get('/justifications'),
        api.get('/attendees'),
        api.get('/themes')
      ]);
      setJustifications(justRes.data);
      setAttendees(attRes.data);
      setThemes(themesRes.data);
    } catch (error) {
      console.error('Erro ao buscar dados', error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/justifications', {
        attendee_id: parseInt(formData.attendee_id),
        theme_id: parseInt(formData.theme_id),
        date: formData.date,
        reason: formData.reason
      });
      setShowModal(false);
      setFormData({
        attendee_id: '',
        theme_id: '',
        date: new Date().toISOString().split('T')[0],
        reason: 'Outro'
      });
      fetchData();
    } catch (error) {
      alert('Erro ao registrar justificativa.');
    }
  };

  const handleDelete = async (id: number) => {
    setDeleteConfirmId(id);
  };

  const confirmDelete = async () => {
    if (deleteConfirmId) {
      try {
        await api.delete(`/justifications/${deleteConfirmId}`);
        fetchData();
      } catch (error: any) {
        alert(error.response?.data?.error || 'Erro ao excluir.');
      } finally {
        setDeleteConfirmId(null);
      }
    }
  };

  const handleDownloadPDF = () => {
    const columns = ['Data', 'Inscrito', 'Tema', 'Motivo'];
    const data = justifications.map(j => [
      new Date(j.date).toLocaleDateString('pt-BR'),
      j.attendee_name,
      j.theme_title,
      j.reason
    ]);
    generatePDF('Relatório de Justificativas de Ausência', columns, data);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <UserX className="text-blue-600" />
          Justificativas de Ausência
        </h1>
        <div className="flex space-x-3 w-full sm:w-auto">
          <button 
            onClick={handleDownloadPDF}
            className="flex-1 sm:flex-none flex items-center justify-center space-x-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Download size={18} />
            <span>Exportar</span>
          </button>
          <button 
            onClick={() => setShowModal(true)}
            className="flex-1 sm:flex-none flex items-center justify-center space-x-2 bg-[#1e3a8a] text-white px-4 py-2 rounded-lg hover:bg-blue-800 transition-colors"
          >
            <Plus size={18} />
            <span>Nova Justificativa</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-600 text-sm uppercase tracking-wider">
                <th className="p-4 font-medium">Data</th>
                <th className="p-4 font-medium">Inscrito</th>
                <th className="p-4 font-medium">Tema</th>
                <th className="p-4 font-medium">Motivo</th>
                <th className="p-4 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {justifications.map((justification) => (
                <tr key={justification.id} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4 text-sm text-gray-700">
                    {new Date(justification.date).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="p-4 text-sm font-medium text-gray-900">
                    {justification.attendee_name}
                  </td>
                  <td className="p-4 text-sm text-gray-600">
                    {justification.theme_title}
                  </td>
                  <td className="p-4 text-sm text-gray-600">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      {justification.reason}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-right">
                    {user?.role === 'admin' && (
                      <button 
                        onClick={() => handleDelete(justification.id)}
                        className="text-gray-400 hover:text-red-500 transition-colors p-1"
                        title="Excluir"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {justifications.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500">
                    Nenhuma justificativa registrada.
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
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800">Nova Justificativa</h2>
              <button 
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Inscrito</label>
                <select 
                  required
                  className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                  value={formData.attendee_id}
                  onChange={e => setFormData({...formData, attendee_id: e.target.value})}
                >
                  <option value="">Selecione o inscrito</option>
                  {attendees.map(a => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tema</label>
                <select 
                  required
                  className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                  value={formData.theme_id}
                  onChange={e => setFormData({...formData, theme_id: e.target.value})}
                >
                  <option value="">Selecione o tema</option>
                  {themes.map(t => (
                    <option key={t.id} value={t.id}>{t.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Data</label>
                <input 
                  type="date" 
                  required
                  className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formData.date}
                  onChange={e => setFormData({...formData, date: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Motivo da Ausência</label>
                <select 
                  required
                  className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                  value={formData.reason}
                  onChange={e => setFormData({...formData, reason: e.target.value})}
                >
                  {REASONS.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              <div className="pt-4 flex space-x-3">
                <button 
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="flex-1 bg-[#1e3a8a] text-white py-2 rounded-lg hover:bg-blue-800 transition-colors font-medium"
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
            <h3 className="text-xl font-bold text-gray-900 mb-2">Excluir Justificativa</h3>
            <p className="text-gray-600 mb-6">Tem certeza que deseja excluir esta justificativa? Esta ação não poderá ser desfeita.</p>
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
