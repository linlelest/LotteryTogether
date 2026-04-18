// API 配置
const API_BASE_URL = '/api';

// API 请求函数
async function apiRequest(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    
    const config = {
        headers: {
            'Content-Type': 'application/json',
        },
        ...options,
    };
    
    // 添加认证 token
    const token = localStorage.getItem('access_token');
    if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
    }
    
    try {
        const response = await fetch(url, config);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || '请求失败');
        }
        
        return data;
    } catch (error) {
        console.error('API 请求错误:', error);
        throw error;
    }
}

// 认证相关 API
const AuthAPI = {
    register: (username, password) => 
        apiRequest('/register', {
            method: 'POST',
            body: JSON.stringify({ username, password }),
        }),
    
    login: (username, password) =>
        apiRequest('/login', {
            method: 'POST',
            body: JSON.stringify({ username, password }),
        }),
    
    updateProfile: (data) =>
        apiRequest('/user/profile', {
            method: 'PUT',
            body: JSON.stringify(data),
        }),
};

// 抽奖相关 API
const LotteryAPI = {
    getLotteries: (params = {}) => {
        const queryString = new URLSearchParams(params).toString();
        return apiRequest(`/lotteries${queryString ? '?' + queryString : ''}`);
    },
    
    getLottery: (id) =>
        apiRequest(`/lotteries/${id}`),
    
    createLottery: (data) =>
        apiRequest('/lotteries', {
            method: 'POST',
            body: JSON.stringify(data),
        }),
    
    joinLottery: (id, data) =>
        apiRequest(`/lotteries/${id}/join`, {
            method: 'POST',
            body: JSON.stringify(data),
        }),
    
    spinLottery: (id, data) =>
        apiRequest(`/lotteries/${id}/spin`, {
            method: 'POST',
            body: JSON.stringify(data),
        }),
};

// 管理员 API
const AdminAPI = {
    getUsers: () =>
        apiRequest('/admin/users'),
    
    banUser: (userId) =>
        apiRequest(`/admin/users/${userId}/ban`, {
            method: 'PUT',
        }),
    
    unbanUser: (userId) =>
        apiRequest(`/admin/users/${userId}/unban`, {
            method: 'PUT',
        }),
    
    createAnnouncement: (data) =>
        apiRequest('/admin/announcements', {
            method: 'POST',
            body: JSON.stringify(data),
        }),
    
    updateSettings: (data) =>
        apiRequest('/admin/settings', {
            method: 'PUT',
            body: JSON.stringify(data),
        }),
};
