import React, { useState } from 'react';
import { KeyRound, User, CheckCircle2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import api from '../../lib/api';
import { useAuthStore } from '../../store/auth';

export default function Conta() {
    const { user, login } = useAuthStore();

    const [currentPassword, setCurrentPassword] = useState('');
    const [newUsername, setNewUsername] = useState(user?.username || '');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSuccess('');
        setError('');

        if (newPassword && newPassword !== confirmPassword) {
            setError('As senhas não coincidem.');
            return;
        }
        if (newPassword && newPassword.length < 4) {
            setError('A nova senha deve ter pelo menos 4 caracteres.');
            return;
        }
        if (!newUsername && !newPassword) {
            setError('Informe um novo login ou nova senha para salvar.');
            return;
        }

        setLoading(true);
        try {
            await api.put(`/users/${user?.id}`, {
                currentPassword,
                username: newUsername !== user?.username ? newUsername : undefined,
                password: newPassword || undefined
            });

            // Update local store if username changed
            if (newUsername !== user?.username) {
                login({ ...user!, username: newUsername });
            }

            setSuccess('Credenciais atualizadas com sucesso!');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err: any) {
            setError(err.response?.data?.error || 'Erro ao atualizar. Verifique a senha atual.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-lg mx-auto">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="bg-[#1e3a8a] p-6 text-white">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                            <KeyRound size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">Minha Conta</h2>
                            <p className="text-blue-200 text-sm">Altere seu login e senha de acesso</p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {/* Current user info */}
                    <div className="bg-gray-50 rounded-lg p-4 flex items-center gap-3 border border-gray-200">
                        <User size={18} className="text-gray-500 shrink-0" />
                        <div>
                            <p className="text-xs text-gray-500">Usuário atual</p>
                            <p className="font-semibold text-gray-800">{user?.username}</p>
                        </div>
                    </div>

                    {/* New username */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Novo Login</label>
                        <input
                            type="text"
                            className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none"
                            value={newUsername}
                            onChange={e => setNewUsername(e.target.value)}
                            placeholder="Deixe igual para não alterar"
                        />
                    </div>

                    {/* Current password (required for any change) */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Senha Atual *</label>
                        <div className="relative">
                            <input
                                type={showCurrent ? 'text' : 'password'}
                                required
                                className="w-full border border-gray-300 rounded-lg p-2.5 pr-10 focus:ring-2 focus:ring-blue-500 outline-none"
                                value={currentPassword}
                                onChange={e => setCurrentPassword(e.target.value)}
                                placeholder="Digite sua senha atual"
                            />
                            <button type="button" onClick={() => setShowCurrent(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                {showCurrent ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    {/* New password */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nova Senha</label>
                        <div className="relative">
                            <input
                                type={showNew ? 'text' : 'password'}
                                className="w-full border border-gray-300 rounded-lg p-2.5 pr-10 focus:ring-2 focus:ring-blue-500 outline-none"
                                value={newPassword}
                                onChange={e => setNewPassword(e.target.value)}
                                placeholder="Deixe vazio para manter a atual"
                            />
                            <button type="button" onClick={() => setShowNew(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    {/* Confirm new password */}
                    {newPassword && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar Nova Senha</label>
                            <input
                                type="password"
                                className={`w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none ${confirmPassword && confirmPassword !== newPassword ? 'border-red-400' : 'border-gray-300'}`}
                                value={confirmPassword}
                                onChange={e => setConfirmPassword(e.target.value)}
                                placeholder="Repita a nova senha"
                            />
                            {confirmPassword && confirmPassword !== newPassword && (
                                <p className="text-xs text-red-600 mt-1">As senhas não coincidem</p>
                            )}
                        </div>
                    )}

                    {/* Messages */}
                    {success && (
                        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2 text-sm">
                            <CheckCircle2 size={18} />
                            {success}
                        </div>
                    )}
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2 text-sm">
                            <AlertCircle size={18} />
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading || !currentPassword}
                        className="w-full bg-[#1e3a8a] text-white py-3 rounded-lg font-medium hover:bg-blue-800 transition-colors disabled:opacity-60"
                    >
                        {loading ? 'Salvando...' : 'Salvar Alterações'}
                    </button>
                </form>
            </div>
        </div>
    );
}
