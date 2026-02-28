import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  ClipboardCheck,
  UserX,
  FileText,
  CreditCard,
  DollarSign,
  BookOpen,
  LogOut,
  Menu,
  X,
  KeyRound
} from 'lucide-react';
import { useAuthStore } from '../../store/auth';

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { path: '/admin', icon: <LayoutDashboard size={20} />, label: 'Tela Inicial' },
    { path: '/admin/inscritos', icon: <Users size={20} />, label: 'Inscritos' },
    { path: '/admin/chamadas', icon: <ClipboardCheck size={20} />, label: 'Chamadas' },
    { path: '/admin/justificativas', icon: <UserX size={20} />, label: 'Justificativas' },
    { path: '/admin/relatorios', icon: <FileText size={20} />, label: 'Relatórios' },
    { path: '/admin/pagamentos', icon: <CreditCard size={20} />, label: 'Formas de Pagamento' },
    ...(user?.role === 'admin' ? [{ path: '/admin/financeiro', icon: <DollarSign size={20} />, label: 'Financeiro' }] : []),
    { path: '/admin/temas', icon: <BookOpen size={20} />, label: 'Temas' },
    ...(user?.role === 'admin' ? [{ path: '/admin/conta', icon: <KeyRound size={20} />, label: 'Minha Conta' }] : []),
  ];

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden bg-[#1e3a8a] text-white p-4 flex justify-between items-center z-20">
        <h1 className="text-xl font-bold tracking-wider">PROFOLI</h1>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 focus:outline-none"
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar */}
      <aside className={`
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} 
        md:translate-x-0 
        fixed md:static inset-y-0 left-0 z-10 
        w-64 bg-[#1e3a8a] text-white flex flex-col 
        transition-transform duration-300 ease-in-out
      `}>
        <div className="p-6 text-center border-b border-blue-800 hidden md:block">
          <h1 className="text-2xl font-bold tracking-wider">PROFOLI</h1>
          <p className="text-blue-300 text-sm mt-1">Área Administrativa</p>
          <div className="mt-4 inline-block bg-blue-800 px-3 py-1 rounded-full text-xs font-medium">
            {user?.role === 'admin' ? 'Mestre' : 'Padrão'}
          </div>
        </div>

        <div className="md:hidden p-4 border-b border-blue-800 flex items-center justify-between mt-16">
          <span className="text-blue-200 text-sm">Logado como:</span>
          <div className="bg-blue-800 px-3 py-1 rounded-full text-xs font-medium">
            {user?.role === 'admin' ? 'Mestre' : 'Padrão'}
          </div>
        </div>

        <nav className="flex-1 py-6 px-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setIsMobileMenuOpen(false)}
              className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${location.pathname === item.path
                  ? 'bg-blue-800 text-white'
                  : 'text-blue-200 hover:bg-blue-800/50 hover:text-white'
                }`}
            >
              {item.icon}
              <span className="font-medium">{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-blue-800">
          <button
            onClick={handleLogout}
            className="flex items-center space-x-3 px-4 py-3 w-full text-left text-blue-200 hover:bg-red-600 hover:text-white rounded-lg transition-colors"
          >
            <LogOut size={20} />
            <span className="font-medium">Sair</span>
          </button>
        </div>
      </aside>

      {/* Overlay for mobile sidebar */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-0 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-[calc(100vh-60px)] md:h-screen overflow-hidden">
        <header className="bg-white shadow-sm py-4 px-4 md:px-8 flex justify-between items-center shrink-0">
          <h2 className="text-lg md:text-xl font-semibold text-gray-800 truncate">
            {navItems.find(item => item.path === location.pathname)?.label || 'Painel'}
          </h2>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-500 hidden sm:inline">Olá, <strong className="text-gray-900">{user?.username}</strong></span>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
