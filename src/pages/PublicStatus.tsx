import React, { useState } from 'react';
import { Search, ArrowLeft, CheckCircle, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../lib/api';

export default function PublicStatus() {
  const [cpf, setCpf] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cpf) return;
    
    setLoading(true);
    setError('');
    setResult(null);
    
    try {
      const res = await api.get(`/public/status/${cpf}`);
      setResult(res.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Inscrito não encontrado. Verifique o CPF digitado.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="bg-[#1e3a8a] text-white p-4 flex items-center shadow-md">
        <Link to="/" className="flex items-center space-x-2 hover:text-blue-200 transition-colors">
          <ArrowLeft size={20} />
          <span className="font-medium">Voltar ao Início</span>
        </Link>
        <h1 className="text-xl font-bold mx-auto pr-8">Status da Inscrição</h1>
      </div>

      <div className="flex-grow flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
          <div className="p-6 md:p-8">
            <div className="text-center mb-8">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-600">
                <Search size={32} />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Consultar Status</h2>
              <p className="text-gray-600 mt-2">Digite seu CPF para verificar a situação da sua inscrição e pagamento.</p>
            </div>

            <form onSubmit={handleSearch} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">CPF</label>
                <input 
                  type="text" 
                  required 
                  placeholder="000.000.000-00"
                  className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-lg text-center tracking-wider"
                  value={cpf}
                  onChange={e => setCpf(e.target.value)}
                />
              </div>

              <button 
                type="submit" 
                disabled={loading || !cpf}
                className="w-full bg-[#1e3a8a] text-white py-3 rounded-lg font-medium hover:bg-blue-800 transition-colors disabled:opacity-70 text-lg"
              >
                {loading ? 'Consultando...' : 'Consultar'}
              </button>
            </form>

            {error && (
              <div className="mt-6 bg-red-50 text-red-600 p-4 rounded-lg text-center border border-red-100">
                {error}
              </div>
            )}

            {result && (
              <div className="mt-8 border-t border-gray-100 pt-6">
                <div className="bg-emerald-500 text-white text-center py-3 rounded-lg font-bold text-xl mb-6 shadow-sm flex items-center justify-center space-x-2">
                  <CheckCircle size={24} />
                  <span>INSCRITO</span>
                </div>
                
                <h3 className="text-lg font-semibold text-gray-800 mb-4 text-center">Resultado da Consulta</h3>
                
                <div className="bg-gray-50 rounded-xl p-5 border border-gray-200 space-y-4">
                  <div>
                    <p className="text-sm text-gray-500">Nome do Inscrito</p>
                    <p className="font-medium text-gray-900 text-lg">{result.name}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Status do Pagamento</p>
                    {result.payment_status === 'paid' ? (
                      <div className="flex items-center space-x-2 text-emerald-700 bg-emerald-100 px-3 py-2 rounded-lg inline-flex">
                        <CheckCircle size={20} />
                        <span className="font-bold">Pagamento Confirmado</span>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2 text-yellow-700 bg-yellow-100 px-3 py-2 rounded-lg inline-flex">
                        <Clock size={20} />
                        <span className="font-bold">Pagamento Pendente</span>
                      </div>
                    )}
                  </div>
                </div>
                
                {result.payment_status !== 'paid' && (
                  <div className="mt-6 text-center">
                    <Link 
                      to="/pagamentos" 
                      className="text-blue-600 hover:text-blue-800 font-medium hover:underline"
                    >
                      Clique aqui para realizar o pagamento
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
