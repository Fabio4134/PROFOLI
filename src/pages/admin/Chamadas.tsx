import React, { useEffect, useState } from 'react';
import { Download, Save, CheckCircle } from 'lucide-react';
import api from '../../lib/api';
import { generatePDF } from '../../lib/pdf';
import { useAuthStore } from '../../store/auth';

export default function Chamadas() {
  const [attendees, setAttendees] = useState<any[]>([]);
  const [themes, setThemes] = useState<any[]>([]);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [themeId, setThemeId] = useState<string>('');
  const [attendance, setAttendance] = useState<Record<number, boolean>>({});
  const [savedRecords, setSavedRecords] = useState<Record<number, boolean>>({});
  const [isFinalized, setIsFinalized] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showFinalizeModal, setShowFinalizeModal] = useState(false);
  const user = useAuthStore(state => state.user);

  useEffect(() => {
    fetchThemes();
  }, []);

  useEffect(() => {
    if (themeId) {
      fetchData();
    } else {
      setAttendees([]);
      setAttendance({});
      setSavedRecords({});
      setIsFinalized(false);
    }
  }, [date, themeId]);

  const fetchThemes = async () => {
    try {
      const res = await api.get('/themes');
      setThemes(res.data);
      if (res.data.length > 0) {
        setThemeId(res.data[0].id.toString());
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchData = async () => {
    try {
      const [attRes, recRes] = await Promise.all([
        api.get('/attendees'),
        api.get(`/attendance?date=${date}&theme_id=${themeId}`)
      ]);
      
      setAttendees(attRes.data);
      
      const attMap: Record<number, boolean> = {};
      const savedMap: Record<number, boolean> = {};
      let finalized = false;

      recRes.data.forEach((r: any) => {
        attMap[r.attendee_id] = r.present === 1;
        savedMap[r.attendee_id] = true;
        if (r.finalized === 1) finalized = true;
      });
      
      setAttendance(attMap);
      setSavedRecords(savedMap);
      setIsFinalized(finalized);
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggle = (id: number) => {
    if (isFinalized && user?.role !== 'admin') return;
    
    setAttendance(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const confirmFinalize = async () => {
    setShowFinalizeModal(false);
    await executeSave(true);
  };

  const handleSave = async (finalize: boolean = false) => {
    if (finalize) {
      setShowFinalizeModal(true);
      return;
    }
    await executeSave(false);
  };

  const executeSave = async (finalize: boolean) => {
    setSaving(true);
    const records = attendees.map(a => ({
      attendee_id: a.id,
      present: attendance[a.id] || false
    }));
    
    try {
      await api.post('/attendance', { 
        date, 
        theme_id: themeId, 
        records, 
        finalized: finalize || isFinalized 
      });
      alert(finalize ? 'Chamada finalizada com sucesso!' : 'Chamada salva com sucesso!');
      fetchData();
    } catch (e) {
      alert('Erro ao salvar chamada.');
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadPDF = () => {
    const themeName = themes.find(t => t.id.toString() === themeId)?.title || '';
    const columns = ['Nome', 'Igreja', 'Status'];
    const data = attendees.map(a => [
      a.name, 
      a.church, 
      attendance[a.id] ? 'Presente' : 'Ausente'
    ]);
    generatePDF(`Chamada - ${date} - ${themeName}`, columns, data);
  };

  const canEdit = !isFinalized || user?.role === 'admin';

  const presentCount = attendees.filter(a => attendance[a.id]).length;
  const absentCount = attendees.length - presentCount;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <label className="font-medium text-gray-700 whitespace-nowrap">Tema:</label>
            <select 
              className="w-full sm:w-auto border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
              value={themeId}
              onChange={e => setThemeId(e.target.value)}
            >
              <option value="">Selecione um tema</option>
              {themes.map(t => (
                <option key={t.id} value={t.id}>{t.title}</option>
              ))}
            </select>
          </div>
          
          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <label className="font-medium text-gray-700 whitespace-nowrap">Data:</label>
            <input 
              type="date" 
              className="w-full sm:w-auto border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
              value={date}
              onChange={e => setDate(e.target.value)}
            />
          </div>
        </div>
        
        <div className="flex flex-wrap gap-3 justify-center sm:justify-end w-full sm:w-auto">
          <button 
            onClick={handleDownloadPDF}
            disabled={!themeId}
            className="flex items-center space-x-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            <Download size={18} />
            <span className="hidden sm:inline">Baixar PDF</span>
          </button>
          
          <button 
            onClick={() => handleSave(false)}
            disabled={saving || !themeId || (!canEdit)}
            className="flex items-center space-x-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-lg hover:bg-blue-200 transition-colors disabled:opacity-50"
          >
            <Save size={18} />
            <span>Salvar</span>
          </button>

          <button 
            onClick={() => handleSave(true)}
            disabled={saving || !themeId || (!canEdit)}
            className="flex items-center space-x-2 bg-[#1e3a8a] text-white px-4 py-2 rounded-lg hover:bg-blue-800 transition-colors disabled:opacity-50"
          >
            <CheckCircle size={18} />
            <span>Finalizar</span>
          </button>
        </div>
      </div>

      {themeId && attendees.length > 0 && (
        <div className="bg-blue-50 border-b border-blue-100 p-4 flex justify-center gap-8 text-sm font-medium">
          <div className="flex items-center gap-2 text-green-700">
            <span className="w-3 h-3 rounded-full bg-green-500"></span>
            Presentes: {presentCount}
          </div>
          <div className="flex items-center gap-2 text-red-700">
            <span className="w-3 h-3 rounded-full bg-red-500"></span>
            Ausentes: {absentCount}
          </div>
          <div className="flex items-center gap-2 text-blue-800">
            <span className="w-3 h-3 rounded-full bg-blue-500"></span>
            Total: {attendees.length}
          </div>
        </div>
      )}

      {isFinalized && (
        <div className="bg-yellow-50 border-b border-yellow-100 p-3 text-center text-yellow-800 text-sm font-medium">
          Esta chamada já foi finalizada. {user?.role === 'admin' ? 'Você pode editá-la pois tem acesso de mestre.' : 'Apenas usuários mestres podem alterá-la.'}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 text-gray-600 text-sm uppercase tracking-wider">
              <th className="p-4 font-medium w-16 text-center">Presença</th>
              <th className="p-4 font-medium">Nome</th>
              <th className="p-4 font-medium">Igreja</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {attendees.map((attendee) => {
              const isSaved = savedRecords[attendee.id];
              const isPresent = attendance[attendee.id] || false;
              
              let rowClass = "hover:bg-gray-50 transition-colors cursor-pointer";
              if (isSaved) {
                rowClass = isPresent ? "bg-green-50 hover:bg-green-100 transition-colors cursor-pointer" : "bg-red-50 hover:bg-red-100 transition-colors cursor-pointer";
              }

              return (
                <tr 
                  key={attendee.id} 
                  className={rowClass} 
                  onClick={() => handleToggle(attendee.id)}
                >
                  <td className="p-4 text-center">
                    <input 
                      type="checkbox" 
                      className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500 cursor-pointer disabled:opacity-50"
                      checked={isPresent}
                      disabled={!canEdit}
                      onChange={() => {}} // Handled by tr click
                    />
                  </td>
                  <td className="p-4 text-gray-900 font-medium">{attendee.name}</td>
                  <td className="p-4 text-gray-600">{attendee.church}</td>
                </tr>
              );
            })}
            {attendees.length === 0 && themeId && (
              <tr>
                <td colSpan={3} className="p-8 text-center text-gray-500">
                  Nenhum inscrito encontrado.
                </td>
              </tr>
            )}
            {!themeId && (
              <tr>
                <td colSpan={3} className="p-8 text-center text-gray-500">
                  Selecione um tema para realizar a chamada.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {/* Finalize Confirm Modal */}
      {showFinalizeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[60]">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 text-center">
            <div className="w-16 h-16 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={32} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Finalizar Chamada</h3>
            <p className="text-gray-600 mb-6">Tem certeza que deseja finalizar esta chamada? Você não poderá mais adicionar presenças. Este processo só poderá ser revertido com autorização do usuário mestre.</p>
            <div className="flex justify-center space-x-3">
              <button 
                onClick={() => setShowFinalizeModal(false)}
                className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                Cancelar
              </button>
              <button 
                onClick={confirmFinalize}
                className="px-6 py-2 bg-[#1e3a8a] text-white rounded-lg hover:bg-blue-800 transition-colors font-medium"
              >
                Sim, Finalizar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
