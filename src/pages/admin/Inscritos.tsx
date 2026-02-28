import React, { useEffect, useState } from 'react';
import { Download, Search, Trash2, Edit, Plus, X } from 'lucide-react';
import api from '../../lib/api';
import { generatePDF } from '../../lib/pdf';
import { useAuthStore } from '../../store/auth';
import { CHURCHES } from '../../lib/constants';

const ROLES = [
  'Auxiliar', 'DEPIN', 'Dirigente Círculo de oração', 'Líder de departamento',
  'Ministério de Louvor', 'Pastor', 'Presbítero', 'Regente',
  'Coordenador(a) de departamento', 'Diáconos', 'Evangelista', 'Membro',
  'Outros', 'Porteiro', 'Professor(a) EBD'
];

export default function Inscritos() {
  const [attendees, setAttendees] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const user = useAuthStore(state => state.user);

  const [formData, setFormData] = useState({
    name: '',
    cpf: '',
    roles: [] as string[],
    church: '',
    phone: '',
    payment_status: 'pending'
  });

  const fetchAttendees = async () => {
    const res = await api.get('/attendees');
    setAttendees(res.data);
  };

  useEffect(() => {
    fetchAttendees();
  }, []);

  const handleDelete = async (id: number) => {
    setDeleteConfirmId(id);
  };

  const confirmDelete = async () => {
    if (deleteConfirmId) {
      try {
        await api.delete(`/attendees/${deleteConfirmId}`);
        fetchAttendees();
      } catch (error: any) {
        alert(error.response?.data?.error || 'Erro ao excluir.');
      } finally {
        setDeleteConfirmId(null);
      }
    }
  };

  const handleEdit = (attendee: any) => {
    setEditingId(attendee.id);
    setFormData({
      name: attendee.name,
      cpf: attendee.cpf,
      roles: JSON.parse(attendee.roles),
      church: attendee.church,
      phone: attendee.phone,
      payment_status: attendee.payment_status
    });
    setShowModal(true);
  };

  const handleRoleChange = (role: string) => {
    setFormData(prev => ({
      ...prev,
      roles: prev.roles.includes(role) 
        ? prev.roles.filter(r => r !== role)
        : [...prev.roles, role]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.roles.length === 0) {
      alert('Selecione pelo menos um cargo/função.');
      return;
    }
    
    try {
      if (editingId) {
        await api.put(`/attendees/${editingId}`, formData);
      } else {
        await api.post('/attendees', formData);
      }
      setShowModal(false);
      setEditingId(null);
      setFormData({ name: '', cpf: '', roles: [], church: '', phone: '', payment_status: 'pending' });
      fetchAttendees();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Erro ao salvar inscrito.');
    }
  };

  const openNewModal = () => {
    setEditingId(null);
    setFormData({ name: '', cpf: '', roles: [], church: '', phone: '', payment_status: 'pending' });
    setShowModal(true);
  };

  const handleDownloadPDF = () => {
    const columns = ['Nome', 'CPF', 'Igreja', 'Telefone', 'Cargos', 'Status Pgto'];
    const data = filteredAttendees.map(a => {
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
        a.payment_status === 'paid' ? 'Pago' : 'Pendente'
      ];
    });
    generatePDF('Lista de Inscritos', columns, data);
  };

  const filteredAttendees = attendees.filter(a => 
    a.name.toLowerCase().includes(search.toLowerCase()) || 
    a.cpf.includes(search)
  );

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="relative w-full sm:w-96">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={18} className="text-gray-400" />
            </div>
            <input 
              type="text" 
              placeholder="Buscar por nome ou CPF..." 
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          
          <div className="flex space-x-3 w-full sm:w-auto">
            <button 
              onClick={handleDownloadPDF}
              className="flex-1 sm:flex-none flex items-center justify-center space-x-2 bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors whitespace-nowrap"
            >
              <Download size={18} />
              <span>Baixar PDF</span>
            </button>
            <button 
              onClick={openNewModal}
              className="flex-1 sm:flex-none flex items-center justify-center space-x-2 bg-[#1e3a8a] text-white px-4 py-2 rounded-lg hover:bg-blue-800 transition-colors whitespace-nowrap"
            >
              <Plus size={18} />
              <span>Inscrever Novo</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-600 text-sm uppercase tracking-wider">
                <th className="p-4 font-medium">Nome</th>
                <th className="p-4 font-medium">CPF</th>
                <th className="p-4 font-medium">Igreja</th>
                <th className="p-4 font-medium">Telefone</th>
                <th className="p-4 font-medium">Cargos</th>
                <th className="p-4 font-medium">Pagamento</th>
                {user?.role === 'admin' && <th className="p-4 font-medium text-right">Ações</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredAttendees.map((attendee) => (
                <tr key={attendee.id} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4 text-gray-900 font-medium">{attendee.name}</td>
                  <td className="p-4 text-gray-600">{attendee.cpf}</td>
                  <td className="p-4 text-gray-600">{attendee.church}</td>
                  <td className="p-4 text-gray-600">{attendee.phone}</td>
                  <td className="p-4 text-gray-600">
                    {(() => {
                      try {
                        const parsed = JSON.parse(attendee.roles);
                        return Array.isArray(parsed) ? parsed.join(', ') : attendee.roles;
                      } catch (e) {
                        return attendee.roles;
                      }
                    })()}
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      attendee.payment_status === 'paid' 
                        ? 'bg-green-100 text-green-800' 
                        : attendee.payment_status === 'exempt'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {attendee.payment_status === 'paid' ? 'Pago' : attendee.payment_status === 'exempt' ? 'Isento' : 'Pendente'}
                    </span>
                  </td>
                  {user?.role === 'admin' && (
                    <td className="p-4 text-right space-x-2">
                      <button 
                        onClick={() => handleEdit(attendee)}
                        className="text-blue-500 hover:text-blue-700 p-1"
                        title="Editar"
                      >
                        <Edit size={18} />
                      </button>
                      <button 
                        onClick={() => handleDelete(attendee.id)}
                        className="text-red-500 hover:text-red-700 p-1"
                        title="Excluir"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
              {filteredAttendees.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500">
                    Nenhum inscrito encontrado.
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
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-[#1e3a8a] text-white rounded-t-2xl">
              <h3 className="text-lg font-semibold">
                {editingId ? 'Editar Inscrito' : 'Novo Inscrito'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-white/80 hover:text-white">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              <form id="attendee-form" onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo *</label>
                    <input 
                      type="text" 
                      required 
                      className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">CPF *</label>
                    <input 
                      type="text" 
                      required 
                      placeholder="000.000.000-00"
                      className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
                      value={formData.cpf}
                      onChange={e => setFormData({...formData, cpf: e.target.value})}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Cargo/Função *</label>
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                    {ROLES.map(role => (
                      <label key={role} className="flex items-center space-x-2 cursor-pointer p-1 hover:bg-gray-100 rounded">
                        <input 
                          type="checkbox" 
                          className="rounded text-blue-600 focus:ring-blue-500"
                          checked={formData.roles.includes(role)}
                          onChange={() => handleRoleChange(role)}
                        />
                        <span className="text-sm text-gray-700">{role}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Igreja *</label>
                    <select 
                      required
                      className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                      value={formData.church}
                      onChange={e => setFormData({...formData, church: e.target.value})}
                    >
                      <option value="">Selecione...</option>
                      {CHURCHES.map(church => (
                        <option key={church} value={church}>{church}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                    <input 
                      type="tel" 
                      placeholder="(00) 00000-0000"
                      className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
                      value={formData.phone}
                      onChange={e => setFormData({...formData, phone: e.target.value})}
                    />
                  </div>

                  {editingId && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Status Pgto</label>
                      <select 
                        className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                        value={formData.payment_status}
                        onChange={e => setFormData({...formData, payment_status: e.target.value})}
                      >
                        <option value="pending">Pendente</option>
                        <option value="paid">Pago</option>
                      </select>
                    </div>
                  )}
                </div>
              </form>
            </div>
            
            <div className="p-4 border-t border-gray-100 flex justify-end space-x-3 bg-gray-50 rounded-b-2xl">
              <button 
                type="button"
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors font-medium"
              >
                Cancelar
              </button>
              <button 
                type="submit"
                form="attendee-form"
                className="px-6 py-2 bg-[#1e3a8a] text-white rounded-lg hover:bg-blue-800 transition-colors font-medium"
              >
                Salvar
              </button>
            </div>
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
            <h3 className="text-xl font-bold text-gray-900 mb-2">Excluir Inscrito</h3>
            <p className="text-gray-600 mb-6">Tem certeza que deseja excluir este inscrito? Esta ação não poderá ser desfeita e removerá também as chamadas e pagamentos vinculados.</p>
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
