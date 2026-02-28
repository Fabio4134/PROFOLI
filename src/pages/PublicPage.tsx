import React, { useState } from 'react';
import { BookOpen, Users, Heart, GraduationCap, CreditCard, Search, Book, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import { CHURCHES } from '../lib/constants';

const ROLES = [
  'Auxiliar', 'DEPIN', 'Dirigente Círculo de oração', 'Líder de departamento',
  'Ministério de Louvor', 'Pastor', 'Presbítero', 'Regente',
  'Coordenador(a) de departamento', 'Diáconos', 'Evangelista', 'Membro',
  'Outros', 'Porteiro', 'Professor(a) EBD'
];

export default function PublicPage() {
  const [formData, setFormData] = useState({
    name: '',
    cpf: '',
    roles: [] as string[],
    church: '',
    phone: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

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
    setLoading(true);
    try {
      await api.post('/attendees', { ...formData, cpf: formData.cpf.replace(/\D/g, '') });
      setSuccess(true);
      setFormData({ name: '', cpf: '', roles: [], church: '', phone: '' });
    } catch (error: any) {
      const message = error.response?.data?.error || 'Erro ao realizar cadastro. Verifique os dados e tente novamente.';
      alert(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white text-[#1e3a8a] py-8 px-4 text-center shadow-sm">
        <div className="flex justify-center mb-4">
          <div className="w-48 h-48 md:w-56 md:h-56 relative flex items-center justify-center mx-auto">
            <svg viewBox="0 0 400 400" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
              {/* Book Base */}
              <path d="M60 220 Q 200 260 340 220 L 340 250 Q 200 290 60 250 Z" fill="#0f204b" />
              <path d="M50 200 Q 200 240 350 200 L 330 180 Q 200 220 70 180 Z" fill="#1e3a8a" />

              {/* People */}
              <circle cx="160" cy="130" r="15" fill="#0f204b" />
              <path d="M140 180 Q 160 150 180 180 Z" fill="#0f204b" />

              <circle cx="240" cy="130" r="15" fill="#0f204b" />
              <path d="M220 180 Q 240 150 260 180 Z" fill="#0f204b" />

              <circle cx="200" cy="100" r="20" fill="#f59e0b" />
              <path d="M175 180 Q 200 130 225 180 Z" fill="#f59e0b" />

              {/* Arrow */}
              <path d="M120 210 Q 250 240 300 120" fill="none" stroke="#f59e0b" strokeWidth="20" strokeLinecap="round" />
              <polygon points="280,130 320,100 320,150" fill="#f59e0b" />
            </svg>
          </div>
        </div>
        <h1 className="text-3xl md:text-5xl font-bold mb-2 text-[#0f204b]">PROFOLI</h1>
        <p className="text-lg md:text-xl mb-2 font-bold text-[#f59e0b]">PROGRAMA DE FORMAÇÃO DE OBREIROS E LÍDERES</p>
        <p className="text-gray-600 text-sm md:text-base max-w-2xl mx-auto mt-4">Capacitando servos para a obra do Senhor através de ensino bíblico e prático</p>
      </div>

      {/* Info Cards */}
      <div className="max-w-6xl mx-auto px-4 py-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-start space-x-4">
          <div className="bg-blue-100 p-3 rounded-lg text-blue-600 shrink-0">
            <BookOpen size={24} />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Ensino Bíblico</h3>
            <p className="text-sm text-gray-500">Fundamentos sólidos da Palavra</p>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-start space-x-4">
          <div className="bg-yellow-100 p-3 rounded-lg text-yellow-600 shrink-0">
            <Users size={24} />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Formação de Líderes</h3>
            <p className="text-sm text-gray-500">Desenvolvendo servos capacitados</p>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-start space-x-4">
          <div className="bg-green-100 p-3 rounded-lg text-green-600 shrink-0">
            <Heart size={24} />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Comunhão</h3>
            <p className="text-sm text-gray-500">Crescendo juntos em Cristo</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-grow max-w-3xl mx-auto w-full px-4 pb-12">
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Inscreva-se</h2>
          <p className="text-gray-600">Faça sua matrícula no PROFOLI</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
          <div className="bg-[#1e3a8a] text-white p-4 flex items-center space-x-2">
            <Users size={20} />
            <h3 className="font-semibold text-lg">Formulário de Inscrição</h3>
          </div>

          <div className="p-4 md:p-6">
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-6 flex items-center space-x-3">
              <span className="text-2xl">💰</span>
              <span className="font-semibold text-blue-900 text-sm md:text-base">Valor da Inscrição: R$ 50,00</span>
            </div>

            {success ? (
              <div className="bg-green-50 border border-green-200 text-green-800 p-6 rounded-lg text-center">
                <h4 className="text-xl font-bold mb-2">Inscrição realizada com sucesso!</h4>
                <p className="text-sm md:text-base mb-4">Caso não possa efetuar o pagamento no momento da inscrição, Não se preocupe, procure um dos responsáveis e negocie modalidade e prazo.</p>
                <div className="flex flex-col sm:flex-row justify-center gap-3">
                  <Link
                    to="/pagamentos"
                    className="bg-[#1e3a8a] text-white px-6 py-2 rounded-lg hover:bg-blue-800 transition-colors text-sm font-medium"
                  >
                    Ver Formas de Pagamento
                  </Link>
                  <button
                    onClick={() => setSuccess(false)}
                    className="bg-white border border-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                  >
                    Nova Inscrição
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5 md:space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo *</label>
                  <input
                    type="text"
                    required
                    className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow"
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
                    className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow"
                    value={formData.cpf}
                    onChange={e => setFormData({ ...formData, cpf: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Cargo/Função * (Selecione uma ou mais opções)</label>
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-60 overflow-y-auto">
                    {ROLES.map(role => (
                      <label key={role} className="flex items-center space-x-3 cursor-pointer p-1 hover:bg-gray-100 rounded transition-colors">
                        <input
                          type="checkbox"
                          className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-gray-300"
                          checked={formData.roles.includes(role)}
                          onChange={() => handleRoleChange(role)}
                        />
                        <span className="text-sm text-gray-700">{role}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Igreja *</label>
                    <select
                      required
                      className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none bg-white transition-shadow"
                      value={formData.church}
                      onChange={e => setFormData({ ...formData, church: e.target.value })}
                    >
                      <option value="">Selecione sua igreja</option>
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
                      className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-shadow"
                      value={formData.phone}
                      onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#1e3a8a] text-white py-3.5 rounded-lg font-medium hover:bg-blue-800 transition-colors flex justify-center items-center space-x-2 disabled:opacity-70 mt-4 shadow-sm"
                >
                  <Users size={20} />
                  <span>{loading ? 'Processando...' : 'Realizar Cadastro'}</span>
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mt-8">
          <Link to="/pagamentos" className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center hover:bg-blue-50 hover:border-blue-200 transition-all group">
            <div className="text-blue-600 mb-2 group-hover:scale-110 transition-transform"><CreditCard size={24} /></div>
            <span className="text-xs md:text-sm font-medium text-gray-800">Pagamentos</span>
          </Link>
          <Link to="/status" className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center hover:bg-blue-50 hover:border-blue-200 transition-all group">
            <div className="text-blue-600 mb-2 group-hover:scale-110 transition-transform"><Search size={24} /></div>
            <span className="text-xs md:text-sm font-medium text-gray-800">Status de Inscrição</span>
          </Link>
          <Link to="/apostilas" className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center hover:bg-blue-50 hover:border-blue-200 transition-all group">
            <div className="text-blue-600 mb-2 group-hover:scale-110 transition-transform"><Book size={24} /></div>
            <span className="text-xs md:text-sm font-medium text-gray-800">Apostilas</span>
          </Link>
          <Link to="/login" className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center text-center hover:bg-blue-50 hover:border-blue-200 transition-all group">
            <div className="text-blue-600 mb-2 group-hover:scale-110 transition-transform"><Shield size={24} /></div>
            <span className="text-xs md:text-sm font-medium text-gray-800">Admin</span>
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-[#1e3a8a] text-white py-8 text-center mt-auto">
        <div className="flex justify-center mb-4">
          <GraduationCap size={32} className="text-yellow-400" />
        </div>
        <p className="text-sm font-medium opacity-90">PROFOLI - Programa de Formação de Obreiros e Líderes</p>
        <p className="text-xs opacity-70 mt-2 px-4">"E o que de mim ouviste... transmite a homens fiéis" - 2 Timóteo 2:2</p>
      </footer>
    </div>
  );
}
