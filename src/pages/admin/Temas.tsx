import React, { useEffect, useState, useRef } from 'react';
import { Download, Upload, Trash2, FileText, Image as ImageIcon, Edit2, X, Camera } from 'lucide-react';
import api from '../../lib/api';
import { generatePDF } from '../../lib/pdf';
import { useAuthStore } from '../../store/auth';

export default function Temas() {
  const [themes, setThemes] = useState<any[]>([]);
  const [title, setTitle] = useState('');
  const [speaker, setSpeaker] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string>('');
  const [uploading, setUploading] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const user = useAuthStore(state => state.user);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

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
    setCoverFile(null);
    setCoverPreview(theme.cover_image_url || '');
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (coverInputRef.current) coverInputRef.current.value = '';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setTitle('');
    setSpeaker('');
    setEventDate('');
    setFile(null);
    setCoverFile(null);
    setCoverPreview('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (coverInputRef.current) coverInputRef.current.value = '';
  };

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    setCoverFile(f);
    if (f) {
      const reader = new FileReader();
      reader.onload = ev => setCoverPreview(ev.target?.result as string);
      reader.readAsDataURL(f);
    } else {
      setCoverPreview('');
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
    if (coverFile) formData.append('cover', coverFile);

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
      t.file_type?.includes('pdf') ? 'PDF' : 'Imagem',
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
            {editingId ? 'Editar Material' : 'Novo Material'}
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
            {/* Main file (PDF/doc) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Arquivo do Material (PDF ou imagem){' '}
                {editingId && <span className="text-gray-400 font-normal">(Opcional se não quiser alterar)</span>}
              </label>
              <input
                type="file"
                required={!editingId}
                accept=".pdf, .jpg, .jpeg, .png"
                ref={fileInputRef}
                className="w-full border border-gray-300 rounded-lg p-1.5 focus:ring-2 focus:ring-blue-500 outline-none file:mr-4 file:py-1 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                onChange={e => setFile(e.target.files?.[0] || null)}
              />
            </div>

            {/* Cover image */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
                <Camera size={14} className="text-blue-500" />
                Foto do Palestrante / Capa da Apostila
                <span className="text-gray-400 font-normal ml-1">(Opcional)</span>
              </label>
              <input
                type="file"
                accept=".jpg, .jpeg, .png, .webp"
                ref={coverInputRef}
                className="w-full border border-gray-300 rounded-lg p-1.5 focus:ring-2 focus:ring-blue-500 outline-none file:mr-4 file:py-1 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                onChange={handleCoverChange}
              />
              {coverPreview && (
                <div className="mt-2 relative inline-block">
                  <img
                    src={coverPreview}
                    alt="Pré-visualização da capa"
                    className="h-24 w-24 object-cover rounded-lg border border-gray-200 shadow-sm"
                  />
                  <button
                    type="button"
                    className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                    onClick={() => { setCoverFile(null); setCoverPreview(''); if (coverInputRef.current) coverInputRef.current.value = ''; }}
                  >×</button>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={uploading || (!editingId && !file) || !title}
              className="bg-[#1e3a8a] text-white px-8 py-2.5 rounded-lg font-medium hover:bg-blue-800 transition-colors disabled:opacity-70"
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
            <div key={theme.id} className="border border-gray-200 rounded-xl overflow-hidden flex flex-col hover:shadow-md transition-shadow">
              {/* Cover image */}
              {theme.cover_image_url ? (
                <div className="relative h-40 bg-gray-100">
                  <img
                    src={theme.cover_image_url}
                    alt={`Capa: ${theme.title}`}
                    className="w-full h-full object-cover"
                  />
                  {user?.role === 'admin' && (
                    <div className="absolute top-2 right-2 flex gap-1">
                      <button onClick={() => handleEdit(theme)} className="bg-white/90 text-gray-700 hover:text-blue-500 p-1.5 rounded-lg shadow" title="Editar"><Edit2 size={15} /></button>
                      <button onClick={() => handleDelete(theme.id)} className="bg-white/90 text-gray-700 hover:text-red-500 p-1.5 rounded-lg shadow" title="Excluir"><Trash2 size={15} /></button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-40 bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col items-center justify-center relative">
                  <div className={`p-3 rounded-lg ${theme.file_type?.includes('pdf') ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                    {theme.file_type?.includes('pdf') ? <FileText size={28} /> : <ImageIcon size={28} />}
                  </div>
                  {user?.role === 'admin' && (
                    <div className="absolute top-2 right-2 flex gap-1">
                      <button onClick={() => handleEdit(theme)} className="bg-white/90 text-gray-700 hover:text-blue-500 p-1.5 rounded-lg shadow" title="Editar"><Edit2 size={15} /></button>
                      <button onClick={() => handleDelete(theme.id)} className="bg-white/90 text-gray-700 hover:text-red-500 p-1.5 rounded-lg shadow" title="Excluir"><Trash2 size={15} /></button>
                    </div>
                  )}
                </div>
              )}

              <div className="p-4 flex flex-col flex-1">
                <h3 className="text-base font-semibold text-gray-900 mb-1 line-clamp-2">{theme.title}</h3>
                {theme.speaker && (
                  <p className="text-sm text-gray-700 mb-1"><strong>Palestrante:</strong> {theme.speaker}</p>
                )}
                {theme.event_date && (
                  <p className="text-sm text-gray-700 mb-1"><strong>Data:</strong> {new Date(theme.event_date).toLocaleDateString('pt-BR')}</p>
                )}
                <p className="text-xs text-gray-500 mb-4 mt-1">
                  Enviado em {new Date(theme.created_at).toLocaleDateString('pt-BR')}
                </p>

                {theme.file_url && (
                  <a
                    href={theme.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-auto flex items-center justify-center space-x-2 w-full bg-gray-50 text-gray-700 py-2 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200"
                  >
                    <Download size={16} />
                    <span className="text-sm font-medium">Baixar Arquivo</span>
                  </a>
                )}
              </div>
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
