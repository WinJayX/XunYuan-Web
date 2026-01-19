'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi, setToken, removeToken } from '@/lib/api';

interface User {
    id: string;
    email: string;
    nickname: string;
    phone?: string;
    avatar?: string;
    role: 'admin' | 'user';
    status: 'active' | 'disabled';
}

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    login: (emailOrUsername: string, password: string) => Promise<void>;
    register: (email: string, password: string, nickname: string, phone: string, verificationCode: string) => Promise<void>;
    logout: () => void;
    updateUser: (data: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Check if user is logged in on mount
    useEffect(() => {
        const checkAuth = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    const profile = await authApi.getProfile();
                    setUser(profile);
                } catch {
                    // Token invalid, remove it
                    removeToken();
                }
            }
            setIsLoading(false);
        };

        checkAuth();
    }, []);

    const login = async (emailOrUsername: string, password: string) => {
        const { user: userData, token } = await authApi.login({ emailOrUsername, password });
        setToken(token);
        setUser(userData);
    };

    const register = async (email: string, password: string, nickname: string, phone: string, verificationCode: string) => {
        const { user: userData, token } = await authApi.register({ email, password, nickname, phone, verificationCode });
        setToken(token);
        setUser(userData);
    };

    const logout = () => {
        removeToken();
        setUser(null);
    };

    const updateUser = (data: Partial<User>) => {
        if (user) {
            setUser({ ...user, ...data });
        }
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                isLoading,
                isAuthenticated: !!user,
                login,
                register,
                logout,
                updateUser,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
