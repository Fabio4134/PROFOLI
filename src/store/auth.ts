import { create } from 'zustand';

interface User {
  id: number;
  username: string;
  role: 'admin' | 'standard';
}

interface AuthState {
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: JSON.parse(localStorage.getItem('profoli_user') || 'null'),
  login: (user) => {
    localStorage.setItem('profoli_user', JSON.stringify(user));
    set({ user });
  },
  logout: () => {
    localStorage.removeItem('profoli_user');
    set({ user: null });
  },
}));
