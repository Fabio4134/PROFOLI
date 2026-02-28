import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import PublicPage from './pages/PublicPage';
import PublicPagamentos from './pages/PublicPagamentos';
import PublicStatus from './pages/PublicStatus';
import PublicApostilas from './pages/PublicApostilas';
import LoginPage from './pages/LoginPage';
import AdminLayout from './pages/admin/AdminLayout';
import Dashboard from './pages/admin/Dashboard';
import Inscritos from './pages/admin/Inscritos';
import Chamadas from './pages/admin/Chamadas';
import Justificativas from './pages/admin/Justificativas';
import Relatorios from './pages/admin/Relatorios';
import FormasPagamento from './pages/admin/FormasPagamento';
import Financeiro from './pages/admin/Financeiro';
import Temas from './pages/admin/Temas';
import { useAuthStore } from './store/auth';

const ProtectedRoute = ({ children, requireAdmin = false }: { children: React.ReactNode, requireAdmin?: boolean }) => {
  const user = useAuthStore((state) => state.user);
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  if (requireAdmin && user.role !== 'admin') {
    return <Navigate to="/admin" replace />;
  }
  
  return <>{children}</>;
};

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<PublicPage />} />
        <Route path="/pagamentos" element={<PublicPagamentos />} />
        <Route path="/status" element={<PublicStatus />} />
        <Route path="/apostilas" element={<PublicApostilas />} />
        <Route path="/login" element={<LoginPage />} />
        
        <Route path="/admin" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
          <Route index element={<Dashboard />} />
          <Route path="inscritos" element={<Inscritos />} />
          <Route path="chamadas" element={<Chamadas />} />
          <Route path="justificativas" element={<Justificativas />} />
          <Route path="relatorios" element={<Relatorios />} />
          <Route path="pagamentos" element={<FormasPagamento />} />
          <Route path="financeiro" element={<ProtectedRoute requireAdmin><Financeiro /></ProtectedRoute>} />
          <Route path="temas" element={<Temas />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
