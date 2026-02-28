import React, { useState } from 'react';
import { Book, ArrowLeft, Download, FileText, Image as ImageIcon, Lock, CheckCircle2, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../lib/api';

export default function PublicApostilas() {
  const [themes, setThemes] = useState<any[]>([]);
  const [isVerified, setIsVerified] = useState(false);
  const [cpf, setCpf] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [attendeeName, setAttendeeName] = useState('');

  const formatCPF = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1');
  };

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCpf(formatCPF(e.target.value));
    setError('');
  };

  const verifyCpf = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cpf.length !== 14) {
      setError('CPF inválido. Digite os 11 números.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await api.get(`/public/status/${cpf}`);
      setAttendeeName(res.data.name);
      setIsVerified(true);
      fetchThemes();
    } catch (err: any) {
      if (err.response?.status === 404) {
        setError('CPF não encontrado. Você precisa estar inscrito para acessar os materiais.');
      } else {
        setError('Ocorreu um erro ao verificar o CPF. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchThemes = async () => {
    try {
      const res = await api.get('/themes');
      setThemes(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="bg-[#1e3a8a] text-white p-4 flex items-center shadow-md">
        <Link to="/" className="flex items-center space-x-2 hover:text-blue-200 transition-colors">
          <ArrowLeft size={20} />
          <span className="font-medium">Voltar ao Início</span>
        </Link>
        <h1 className="text-xl font-bold mx-auto pr-8">Apostilas e Temas</h1>
      </div>

      <div className="flex-grow p-4 md:p-8 max-w-6xl mx-auto w-full">
        {!isVerified ? (
          <div className="max-w-md mx-auto mt-12 bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="bg-blue-50 p-6 text-center border-b border-blue-100">
              <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Lock size={32} />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Acesso Restrito</h2>
              <p className="text-gray-600 mt-2">
                Os materiais de estudo são exclusivos para inscritos. Informe seu CPF para acessar.
              </p>
            </div>
            
            <form onSubmit={verifyCpf} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  CPF do Inscrito
                </label>
                <input 
                  type="text" 
                  required
                  placeholder="000.000.000-00"
                  className="w-full border border-gray-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 outline-none text-lg text-center tracking-wider"
                  value={cpf}
                  onChange={handleCpfChange}
                  maxLength={14}
                />
              </div>

              {error && (
                <div className="bg-red-50 text-red-700 p-4 rounded-xl flex items-start space-x-3 border border-red-100">
                  <AlertCircle className="shrink-0 mt-0.5" size={20} />
                  <p className="text-sm font-medium">{error}</p>
                </div>
              )}

              <button 
                type="submit" 
                disabled={loading || cpf.length < 14}
                className="w-full bg-[#1e3a8a] text-white py-3.5 rounded-xl font-medium hover:bg-blue-800 transition-colors disabled:opacity-70 flex items-center justify-center space-x-2 text-lg shadow-sm"
              >
                {loading ? (
                  <span>Verificando...</span>
                ) : (
                  <>
                    <CheckCircle2 size={20} />
                    <span>Acessar Materiais</span>
                  </>
                )}
              </button>
            </form>
          </div>
        ) : (
          <div>
            <div className="mb-8 text-center md:text-left flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Materiais de Estudo</h2>
                <p className="text-gray-600 mt-1">Olá, <strong>{attendeeName}</strong>. Faça o download das apostilas e temas disponíveis.</p>
              </div>
              <button 
                onClick={() => {
                  setIsVerified(false);
                  setCpf('');
                }}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium bg-blue-50 px-4 py-2 rounded-lg transition-colors"
              >
                Sair / Trocar CPF
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {themes.map(theme => (
                <div key={theme.id} className="bg-white border border-gray-200 rounded-xl p-6 flex flex-col hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`p-3 rounded-lg ${theme.file_type.includes('pdf') ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                      {theme.file_type.includes('pdf') ? <FileText size={28} /> : <ImageIcon size={28} />}
                    </div>
                  </div>
                  
                  <h3 className="text-xl font-semibold text-gray-900 mb-2 line-clamp-2">{theme.title}</h3>
                  {theme.speaker && (
                    <p className="text-sm text-gray-700 mb-1"><strong>Palestrante:</strong> {theme.speaker}</p>
                  )}
                  {theme.event_date && (
                    <p className="text-sm text-gray-700 mb-1"><strong>Data:</strong> {new Date(theme.event_date).toLocaleDateString('pt-BR')}</p>
                  )}
                  <p className="text-sm text-gray-500 mb-6 mt-2">
                    Disponibilizado em {new Date(theme.created_at).toLocaleDateString('pt-BR')}
                  </p>
                  
                  <a 
                    href={theme.file_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="mt-auto flex items-center justify-center space-x-2 w-full bg-[#1e3a8a] text-white py-3 rounded-lg hover:bg-blue-800 transition-colors font-medium"
                  >
                    <Download size={18} />
                    <span>Baixar Arquivo</span>
                  </a>
                </div>
              ))}
              
              {themes.length === 0 && (
                <div className="col-span-full text-center py-16 bg-white rounded-xl border border-gray-200">
                  <Book size={48} className="mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900">Nenhum material disponível</h3>
                  <p className="text-gray-500 mt-1">Os materiais serão disponibilizados em breve.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
