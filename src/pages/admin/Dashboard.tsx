import React, { useEffect, useState } from 'react';
import { Users, DollarSign, TrendingUp, TrendingDown } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import api from '../../lib/api';
import { useAuthStore } from '../../store/auth';

export default function Dashboard() {
  const [stats, setStats] = useState<any>(null);
  const userRole = useAuthStore(state => state.user?.role);

  useEffect(() => {
    api.get('/stats').then(res => setStats(res.data));
  }, []);

  if (!stats) return <div>Carregando...</div>;

  const roleData = Object.keys(stats.roleCounts).map(key => ({
    name: key,
    value: stats.roleCounts[key]
  })).sort((a, b) => b.value - a.value).slice(0, 5); // Top 5

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  return (
    <div className="space-y-6">
      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total Inscritos</p>
              <h3 className="text-3xl font-bold text-gray-900 mt-1">{stats.totalAttendees}</h3>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg text-blue-600">
              <Users size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Inscritos Pagos</p>
              <h3 className="text-3xl font-bold text-gray-900 mt-1">{stats.paidAttendees}</h3>
            </div>
            <div className="bg-green-100 p-3 rounded-lg text-green-600">
              <DollarSign size={24} />
            </div>
          </div>
        </div>

        {userRole === 'admin' && (
          <>
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Total Entradas</p>
                  <h3 className="text-3xl font-bold text-gray-900 mt-1">
                    R$ {stats.totalIncome.toFixed(2)}
                  </h3>
                </div>
                <div className="bg-emerald-100 p-3 rounded-lg text-emerald-600">
                  <TrendingUp size={24} />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Total Saídas</p>
                  <h3 className="text-3xl font-bold text-gray-900 mt-1">
                    R$ {stats.totalExpense.toFixed(2)}
                  </h3>
                </div>
                <div className="bg-red-100 p-3 rounded-lg text-red-600">
                  <TrendingDown size={24} />
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Top 5 Cargos/Funções</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={roleData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{fontSize: 12}} />
                <YAxis allowDecimals={false} />
                <Tooltip cursor={{fill: 'transparent'}} />
                <Bar dataKey="value" fill="#1e3a8a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Status de Pagamento</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: 'Pagos', value: stats.paidAttendees },
                    { name: 'Pendentes', value: stats.totalAttendees - stats.paidAttendees }
                  ]}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  label
                >
                  <Cell fill="#10b981" />
                  <Cell fill="#f59e0b" />
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
