// API client for backend communication

// Use relative path - nginx will proxy to backend
// This allows access from any device on the network
const API_BASE_URL = '/api';

// Get token from localStorage
function getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('token');
}

// Set token to localStorage
export function setToken(token: string): void {
    localStorage.setItem('token', token);
}

// Remove token from localStorage
export function removeToken(): void {
    localStorage.removeItem('token');
}

// API request wrapper
async function request<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<T> {
    const token = getToken();

    const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    if (token) {
        (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Request failed' }));
        throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response.json();
}

// Auth API
export const authApi = {
    sendCode: (data: { email: string; type?: string }) =>
        request<{ message: string }>('/auth/send-code', {
            method: 'POST',
            body: JSON.stringify(data),
        }),

    register: (data: {
        email: string;
        password: string;
        nickname: string;
        phone: string;
        verificationCode: string;
    }) =>
        request<{ user: any; token: string }>('/auth/register', {
            method: 'POST',
            body: JSON.stringify(data),
        }),

    login: (data: { emailOrUsername: string; password: string }) =>
        request<{ user: any; token: string }>('/auth/login', {
            method: 'POST',
            body: JSON.stringify(data),
        }),

    getProfile: () => request<any>('/auth/profile'),

    updateProfile: (data: { nickname?: string; phone?: string; avatar?: string }) =>
        request<any>('/auth/profile', {
            method: 'PUT',
            body: JSON.stringify(data),
        }),
};

// Families API
export const familiesApi = {
    getAll: () => request<any[]>('/families'),

    getOne: (id: string) => request<any>(`/families/${id}`),

    create: (data: { name: string; subtitle?: string; hometown?: string; theme?: string }) =>
        request<any>('/families', {
            method: 'POST',
            body: JSON.stringify(data),
        }),

    update: (id: string, data: any) =>
        request<any>(`/families/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        }),

    // Alias for update (more explicit name)
    updateFamily: (id: string, data: any) =>
        request<any>(`/families/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        }),

    delete: (id: string) =>
        request<any>(`/families/${id}`, {
            method: 'DELETE',
        }),

    import: (id: string, data: any) =>
        request<any>(`/families/${id}/import`, {
            method: 'POST',
            body: JSON.stringify(data),
        }),

    updateGenealogyContent: (id: string, data: any) =>
        request<any>(`/families/${id}/content`, {
            method: 'PUT',
            body: JSON.stringify(data),
        }),

    // Generations
    addGeneration: (familyId: string, data: { name: string; atTop?: boolean }) =>
        request<any>(`/families/${familyId}/generations`, {
            method: 'POST',
            body: JSON.stringify(data),
        }),

    updateGeneration: (id: string, data: { name?: string; order?: number }) =>
        request<any>(`/families/generations/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        }),

    deleteGeneration: (id: string) =>
        request<any>(`/families/generations/${id}`, {
            method: 'DELETE',
        }),

    // Members
    addMember: (generationId: string, data: any) =>
        request<any>(`/families/generations/${generationId}/members`, {
            method: 'POST',
            body: JSON.stringify(data),
        }),

    updateMember: (id: string, data: any) =>
        request<any>(`/families/members/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        }),

    deleteMember: (id: string) =>
        request<any>(`/families/members/${id}`, {
            method: 'DELETE',
        }),
};

// Upload API
export const uploadApi = {
    uploadImage: async (file: File, folder: string = 'images'): Promise<{ url: string; key: string }> => {
        const token = getToken();
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(`${API_BASE_URL}/upload/image?folder=${folder}`, {
            method: 'POST',
            headers: token ? { Authorization: `Bearer ${token}` } : {},
            body: formData,
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ message: 'Upload failed' }));
            throw new Error(error.message || 'Upload failed');
        }

        return response.json();
    },
};

// Feedback API (for regular users)
export const feedbackApi = {
    create: (data: { title: string; content: string; type?: string }) =>
        request<any>('/feedback', {
            method: 'POST',
            body: JSON.stringify(data),
        }),

    getMyFeedbacks: () => request<any[]>('/feedback'),

    getFeedback: (id: string) => request<any>(`/feedback/${id}`),

    delete: (id: string) => request<any>(`/feedback/${id}`, {
        method: 'DELETE',
    }),
};

// Admin API
export const adminApi = {
    // Dashboard
    getDashboard: () => request<any>('/admin/dashboard'),

    // User Management
    getUsers: (page?: number, limit?: number, search?: string) => {
        const params = new URLSearchParams();
        if (page) params.set('page', String(page));
        if (limit) params.set('limit', String(limit));
        if (search) params.set('search', search);
        return request<any>(`/admin/users?${params.toString()}`);
    },

    getUser: (id: string) => request<any>(`/admin/users/${id}`),

    updateUser: (id: string, data: {
        nickname?: string;
        role?: string;
        status?: string;
        maxFamilies?: number;
        maxGenerations?: number;
    }) => request<any>(`/admin/users/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    }),

    deleteUser: (id: string) => request<any>(`/admin/users/${id}`, {
        method: 'DELETE',
    }),

    resetUserPassword: (id: string) => request<any>(`/admin/users/${id}/reset-password`, {
        method: 'POST',
    }),


    // Family Management
    getFamilies: (page?: number, limit?: number, search?: string) => {
        const params = new URLSearchParams();
        if (page) params.set('page', String(page));
        if (limit) params.set('limit', String(limit));
        if (search) params.set('search', search);
        return request<any>(`/admin/families?${params.toString()}`);
    },

    getFamily: (id: string) => request<any>(`/admin/families/${id}`),

    deleteFamily: (id: string) => request<any>(`/admin/families/${id}`, {
        method: 'DELETE',
    }),

    // Feedback Management
    getFeedbacks: (page?: number, limit?: number, status?: string) => {
        const params = new URLSearchParams();
        if (page) params.set('page', String(page));
        if (limit) params.set('limit', String(limit));
        if (status) params.set('status', status);
        return request<any>(`/admin/feedbacks?${params.toString()}`);
    },

    getFeedback: (id: string) => request<any>(`/admin/feedbacks/${id}`),

    updateFeedback: (id: string, data: {
        status?: string;
        priority?: string;
        adminReply?: string;
    }) => request<any>(`/admin/feedbacks/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
    }),

    deleteFeedback: (id: string) => request<any>(`/admin/feedbacks/${id}`, {
        method: 'DELETE',
    }),

    // System Logs
    getLogs: (params: {
        page?: number;
        limit?: number;
        level?: string;
        module?: string;
        startDate?: string;
        endDate?: string;
        search?: string;
    }) => {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
            if (value) searchParams.set(key, String(value));
        });
        return request<any>(`/admin/logs?${searchParams.toString()}`);
    },

    getLogStats: () => request<any>('/admin/logs/stats'),

    clearLogs: (beforeDate: string) => request<any>(`/admin/logs?beforeDate=${beforeDate}`, {
        method: 'DELETE',
    }),

    // System Settings
    getSettings: () => request<any>('/admin/settings'),

    updateSettings: (data: {
        systemName?: string;
        systemDescription?: string;
        maintenanceMode?: boolean;
        defaultMaxFamilies?: number;
        defaultMaxGenerations?: number;
        minPasswordLength?: number;
        maxLoginAttempts?: number;
        sessionTimeout?: number;
    }) => request<any>('/admin/settings', {
        method: 'PUT',
        body: JSON.stringify(data),
    }),

    // Data Management
    getDataOverview: () => request<any>('/admin/data/overview'),

    exportData: (type: string) => {
        const token = getToken();
        return fetch(`${API_BASE_URL}/admin/data/export/${type}`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
    },

    restoreData: (data: any) => request<any>('/admin/data/restore', {
        method: 'POST',
        body: JSON.stringify(data),
    }),
};

