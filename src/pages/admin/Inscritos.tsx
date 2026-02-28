import React, { useEffect, useState } from 'react';
import { Download, Search, Trash2, Edit, Plus, X, Filter } from 'lucide-react';
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

// Normalize name to title case
const toTitleCase = (str: string) =>
  str
    .toLowerCase()
    .split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

const parseRoles = (roles: any): string[] => {
  if (Array.isArray(roles)) return roles;
  try { return JSON.parse(roles); } catch { return []; }
};

export default function Inscritos() {
  const [attendees, setAttendees] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [filterChurch, setFilterChurch] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterPayment, setFilterPayment] = useState('');
  const [showFilters, setShowFilters] = useState(false);
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

  const handleDelete = async (id: number) => setDeleteConfirmId(id);

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
      roles: parseRoles(attendee.roles),
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
    const payload = {
      ...formData,
      name: toTitleCase(formData.name),
      cpf: formData.cpf.replace(/\D/g, '')
    };
    try {
      if (editingId) {
        await api.put(`/attendees/${editingId}`, payload);
      } else {
        await api.post('/attendees', payload);
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

  const clearFilters = () => {
    setSearch('');
    setFilterChurch('');
    setFilterRole('');
    setFilterPayment('');
  };

  const activeFiltersCount = [filterChurch, filterRole, filterPayment].filter(Boolean).length;

  const filteredAttendees = attendees.filter(a => {
    const roles = parseRoles(a.roles);
    const matchSearch = !search ||
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.cpf.includes(search);
    const matchChurch = !filterChurch || a.church === filterChurch;
    const matchRole = !filterRole || roles.includes(filterRole);
    const matchPayment = !filterPayment || a.payment_status === filterPayment;
    return matchSearch && matchChurch && matchRole && matchPayment;
  });

  const handleDownloadPDF = () => {
    const columns = ['Nome', 'CPF', 'Igreja', 'Telefone', 'Cargos', 'Status Pgto'];
    const data = filteredAttendees.map(a => [
      toTitleCase(a.name),
      a.cpf,
      a.church,
      a.phone,
      parseRoles(a.roles).join(', '),
      a.payment_status === 'paid' ? 'Pago' : a.payment_status === 'exempt' ? 'Isento' : 'Pendente'
    ]);
    generatePDF('Lista de Inscritos', columns, data);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Header bar */}
        <div className="p-4 border-b border-gray-100 space-y-3">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            {/* Search */}
            <div className="relative w-full sm:w-80">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por nome ou CPF..."
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>

            <div className="flex gap-2 w-full sm:w-auto">
              {/* Filter toggle */}
              <button
                onClick={() => setShowFilters(v => !v)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-medium transition-colors relative ${showFilters || activeFiltersCount > 0 ? 'bg-blue-50 border-blue-300 text-blue-700' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}
              >
                <Filter size={15} />
                Filtros
                {activeFiltersCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-blue-600 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-bold">
                    {activeFiltersCount}
                  </span>
                )}
              </button>
              <button
                onClick={handleDownloadPDF}
                className="flex items-center gap-1.5 bg-gray-800 text-white px-3 py-2 rounded-lg hover:bg-gray-700 transition-colors text-sm"
              >
                <Download size={15} />
                PDF
              </button>
              <button
                onClick={openNewModal}
                className="flex items-center gap-1.5 bg-[#1e3a8a] text-white px-3 py-2 rounded-lg hover:bg-blue-800 transition-colors text-sm whitespace-nowrap"
              >
                <Plus size={15} />
                Novo Inscrito
              </button>
            </div>
          </div>

          {/* Filters row */}
          {showFilters && (
            <div className="flex flex-col sm:flex-row gap-3 pt-2 border-t border-gray-100">
              <select
                className="flex-1 border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                value={filterChurch}
                onChange={e => setFilterChurch(e.target.value)}
              >
                <option value="">Todas as igrejas</option>
                {CHURCHES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>

              <select
                className="flex-1 border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                value={filterRole}
                onChange={e => setFilterRole(e.target.value)}
              >
                <option value="">Todos os cargos</option>
                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>

              <select
                className="flex-1 border border-gray-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                value={filterPayment}
                onChange={e => setFilterPayment(e.target.value)}
              >
                <option value="">Todos os pagamentos</option>
                <option value="pending">Pendente</option>
                <option value="paid">Pago</option>
                <option value="exempt">Isento</option>
              </select>

              {activeFiltersCount > 0 && (
                <button
                  onClick={clearFilters}
                  className="text-sm text-red-600 hover:text-red-800 font-medium px-2 whitespace-nowrap"
                >
                  Limpar filtros
                </button>
              )}
            </div>
          )}

          {/* Results count */}
          <p className="text-xs text-gray-500">
            {filteredAttendees.length} {filteredAttendees.length === 1 ? 'inscrito encontrado' : 'inscritos encontrados'}
            {attendees.length !== filteredAttendees.length && ` (de ${attendees.length} total)`}
          </p>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider">
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
                  <td className="p-4 text-gray-900 font-medium">{toTitleCase(attendee.name)}</td>
                  <td className="p-4 text-gray-600 text-sm">{attendee.cpf}</td>
                  <td className="p-4 text-gray-600 text-sm">{attendee.church}</td>
                  <td className="p-4 text-gray-600 text-sm">{attendee.phone}</td>
                  <td className="p-4 text-gray-600 text-sm max-w-[200px]">
                    <div className="flex flex-wrap gap-1">
                      {parseRoles(attendee.roles).map((r: string) => (
                        <span key={r} className="bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded text-[11px] font-medium">{r}</span>
                      ))}
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${attendee.payment_status === 'paid'
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
                      <button onClick={() => handleEdit(attendee)} className="text-blue-500 hover:text-blue-700 p-1" title="Editar"><Edit size={16} /></button>
                      <button onClick={() => handleDelete(attendee.id)} className="text-red-500 hover:text-red-700 p-1" title="Excluir"><Trash2 size={16} /></button>
                    </td>
                  )}
                </tr>
              ))}
              {filteredAttendees.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-10 text-center text-gray-500">
                    Nenhum inscrito encontrado com os filtros aplicados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit/New Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-[#1e3a8a] text-white rounded-t-2xl">
              <h3 className="text-lg font-semibold">{editingId ? 'Editar Inscrito' : 'Novo Inscrito'}</h3>
              <button onClick={() => setShowModal(false)} className="text-white/80 hover:text-white"><X size={24} /></button>
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
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
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
                      onChange={e => setFormData({ ...formData, cpf: e.target.value })}
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
                      onChange={e => setFormData({ ...formData, church: e.target.value })}
                    >
                      <option value="">Selecione...</option>
                      {CHURCHES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                    <input
                      type="tel"
                      placeholder="(00) 00000-0000"
                      className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
                      value={formData.phone}
                      onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                  {editingId && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Status Pgto</label>
                      <select
                        className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                        value={formData.payment_status}
                        onChange={e => setFormData({ ...formData, payment_status: e.target.value })}
                      >
                        <option value="pending">Pendente</option>
                        <option value="paid">Pago</option>
                        <option value="exempt">Isento</option>
                      </select>
                    </div>
                  )}
                </div>
              </form>
            </div>

            <div className="p-4 border-t border-gray-100 flex justify-end space-x-3 bg-gray-50 rounded-b-2xl">
              <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors font-medium">
                Cancelar
              </button>
              <button type="submit" form="attendee-form" className="px-6 py-2 bg-[#1e3a8a] text-white rounded-lg hover:bg-blue-800 transition-colors font-medium">
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
            <p className="text-gray-600 mb-6">Tem certeza? Esta ação removerá também as chamadas e pagamentos vinculados.</p>
            <div className="flex justify-center space-x-3">
              <button onClick={() => setDeleteConfirmId(null)} className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium">Cancelar</button>
              <button onClick={confirmDelete} className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium">Sim, Excluir</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
