import React, { useEffect, useState, useRef } from 'react';
import { Download, Upload, Trash2, FileText, Image as ImageIcon, Edit2, X } from 'lucide-react';
import api from '../../lib/api';
import { generatePDF } from '../../lib/pdf';
import { useAuthStore } from '../../store/auth';

export default function Temas() {
  const [themes, setThemes] = useState<any[]>([]);
  const [title, setTitle] = useState('');
  const [speaker, setSpeaker] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const user = useAuthStore(state => state.user);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchThemes = async () => {
    const res = await api.get('/themes');
    setThemes(res.data);
  };

  useEffect(() => {
    fetchThemes();
  }, []);

  const handleEdit = (theme: any) => {
    setEditingId(theme.id);
    setTitle(theme.title);
    setSpeaker(theme.speaker || '');
    setEventDate(theme.event_date || '');
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setTitle('');
    setSpeaker('');
    setEventDate('');
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;
    if (!editingId && !file) return;

    const formData = new FormData();
    formData.append('title', title);
    if (speaker) formData.append('speaker', speaker);
    if (eventDate) formData.append('event_date', eventDate);
    if (file) formData.append('file', file);

    setUploading(true);
    try {
      if (editingId) {
        await api.put(`/themes/${editingId}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        await api.post('/themes', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }
      cancelEdit();
      fetchThemes();
    } catch (error) {
      alert('Erro ao salvar o tema.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: number) => {
    setDeleteConfirmId(id);
  };

  const confirmDelete = async () => {
    if (deleteConfirmId) {
      try {
        await api.delete(`/themes/${deleteConfirmId}`);
        fetchThemes();
      } catch (error: any) {
        alert(error.response?.data?.error || 'Erro ao excluir.');
      } finally {
        setDeleteConfirmId(null);
      }
    }
  };

  const handleDownloadPDF = () => {
    const columns = ['Título', 'Tipo de Arquivo', 'Data de Upload'];
    const data = themes.map(t => [
      t.title,
      t.file_type.includes('pdf') ? 'PDF' : 'Imagem',
      new Date(t.created_at).toLocaleDateString('pt-BR')
    ]);
    generatePDF('Lista de Temas e Materiais', columns, data);
  };

  return (
    <div className="space-y-6">
      {/* Upload Form */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            {editingId ? <Edit2 size={20} className="text-blue-600" /> : <Upload size={20} className="text-blue-600" />}
            {editingId ? 'Editar Material' : 'Novo Material (PDF ou JPEG)'}
          </h2>
          {editingId && (
            <button 
              onClick={cancelEdit}
              className="text-gray-500 hover:text-gray-700 flex items-center gap-1 text-sm font-medium"
            >
              <X size={16} /> Cancelar Edição
            </button>
          )}
        </div>
        
        <form onSubmit={handleUpload} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="w-full">
              <label className="block text-sm font-medium text-gray-700 mb-1">Título do Tema</label>
              <input 
                type="text" 
                required 
                className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Ex: Liderança Cristã"
              />
            </div>
            
            <div className="w-full">
              <label className="block text-sm font-medium text-gray-700 mb-1">Palestrante</label>
              <input 
                type="text" 
                className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                value={speaker}
                onChange={e => setSpeaker(e.target.value)}
                placeholder="Ex: Pr. João Silva"
              />
            </div>

            <div className="w-full">
              <label className="block text-sm font-medium text-gray-700 mb-1">Data do Evento</label>
              <input 
                type="date" 
                className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                value={eventDate}
                onChange={e => setEventDate(e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 w-full">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Arquivo {editingId && <span className="text-gray-400 font-normal">(Opcional se não quiser alterar)</span>}
              </label>
              <input 
                type="file" 
                required={!editingId}
                accept=".pdf, .jpg, .jpeg"
                ref={fileInputRef}
                className="w-full border border-gray-300 rounded-lg p-1.5 focus:ring-2 focus:ring-blue-500 outline-none file:mr-4 file:py-1 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                onChange={e => setFile(e.target.files?.[0] || null)}
              />
            </div>
            
            <button 
              type="submit" 
              disabled={uploading || (!editingId && !file) || !title}
              className="bg-[#1e3a8a] text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-800 transition-colors disabled:opacity-70 h-[42px] w-full md:w-auto"
            >
              {uploading ? 'Salvando...' : editingId ? 'Salvar Alterações' : 'Fazer Upload'}
            </button>
          </div>
        </form>
      </div>

      {/* List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-800">Materiais Disponíveis</h2>
          <button 
            onClick={handleDownloadPDF}
            className="flex items-center space-x-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <Download size={18} />
            <span>Baixar Lista (PDF)</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
          {themes.map(theme => (
            <div key={theme.id} className="border border-gray-200 rounded-xl p-5 flex flex-col hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-lg ${theme.file_type.includes('pdf') ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                  {theme.file_type.includes('pdf') ? <FileText size={24} /> : <ImageIcon size={24} />}
                </div>
                {user?.role === 'admin' && (
                  <div className="flex items-center space-x-2">
                    <button 
                      onClick={() => handleEdit(theme)}
                      className="text-gray-400 hover:text-blue-500 transition-colors"
                      title="Editar"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button 
                      onClick={() => handleDelete(theme.id)}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                      title="Excluir"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                )}
              </div>
              
              <h3 className="text-lg font-semibold text-gray-900 mb-1 line-clamp-2">{theme.title}</h3>
              {theme.speaker && (
                <p className="text-sm text-gray-700 mb-1"><strong>Palestrante:</strong> {theme.speaker}</p>
              )}
              {theme.event_date && (
                <p className="text-sm text-gray-700 mb-1"><strong>Data:</strong> {new Date(theme.event_date).toLocaleDateString('pt-BR')}</p>
              )}
              <p className="text-xs text-gray-500 mb-4 mt-2">
                Enviado em {new Date(theme.created_at).toLocaleDateString('pt-BR')}
              </p>
              
              <a 
                href={theme.file_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="mt-auto flex items-center justify-center space-x-2 w-full bg-gray-50 text-gray-700 py-2 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200"
              >
                <Download size={16} />
                <span className="text-sm font-medium">Baixar Arquivo</span>
              </a>
            </div>
          ))}
          
          {themes.length === 0 && (
            <div className="col-span-full text-center py-12 text-gray-500">
              Nenhum material cadastrado ainda.
            </div>
          )}
        </div>
      </div>
      {/* Delete Confirm Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[60]">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 text-center">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 size={32} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Excluir Material</h3>
            <p className="text-gray-600 mb-6">Tem certeza que deseja excluir este material? Esta ação não poderá ser desfeita.</p>
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
