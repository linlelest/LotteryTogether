// 认证工具函数

// 检查用户是否已登录
function isAuthenticated() {
    return localStorage.getItem('access_token') !== null;
}

// 获取当前用户信息
function getCurrentUser() {
    const userStr = localStorage.getItem('user_info');
    if (!userStr) return null;
    return JSON.parse(userStr);
}

// 保存登录信息
function saveAuthInfo(token, userInfo) {
    localStorage.setItem('access_token', token);
    localStorage.setItem('user_info', JSON.stringify(userInfo));
}

// 清除登录信息
function clearAuthInfo() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_info');
}

// 检查是否是管理员
function isAdmin() {
    const user = getCurrentUser();
    return user && user.is_admin;
}

// 检查是否是首次登录
function isFirstLogin() {
    const user = getCurrentUser();
    return user && user.is_first_login;
}

// 更新用户信息
function updateUserInfo(userInfo) {
    const currentUser = getCurrentUser();
    const updatedUser = { ...currentUser, ...userInfo };
    localStorage.setItem('user_info', JSON.stringify(updatedUser));
}
