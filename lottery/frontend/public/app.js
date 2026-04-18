// 主应用逻辑

let currentWheel = null;
let currentLottery = null;
let currentUser = null;

// DOM 元素
const pages = {
    home: document.getElementById('home-page'),
    auth: document.getElementById('auth-page'),
    profile: document.getElementById('profile-page'),
    createLottery: document.getElementById('create-lottery-page'),
    lotteryDetail: document.getElementById('lottery-detail-page'),
    admin: document.getElementById('admin-page'),
};

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    initNavigation();
    initAuthForms();
    loadPublicLotteries();
    updateUI();
});

// 主题切换
function initTheme() {
    const themeToggle = document.getElementById('theme-toggle');
    const savedTheme = localStorage.getItem('theme') || 'light';
    
    document.body.className = `${savedTheme}-theme`;
    themeToggle.textContent = savedTheme === 'light' ? '🌙' : '☀️';
    
    themeToggle.addEventListener('click', () => {
        const isLight = document.body.classList.contains('light-theme');
        const newTheme = isLight ? 'dark' : 'light';
        
        document.body.classList.remove(`${isLight ? 'light' : 'dark'}-theme`);
        document.body.classList.add(`${newTheme}-theme`);
        localStorage.setItem('theme', newTheme);
        themeToggle.textContent = newTheme === 'light' ? '🌙' : '☀️';
    });
}

// 导航
function initNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const pageName = link.dataset.page;
            
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            
            showPage(pageName);
        });
    });
    
    // 返回按钮
    document.getElementById('back-to-home-btn')?.addEventListener('click', () => {
        showPage('home');
    });
    
    document.getElementById('cancel-create-btn')?.addEventListener('click', () => {
        showPage('profile');
    });
}

// 显示页面
function showPage(pageName) {
    Object.values(pages).forEach(page => page.classList.remove('active'));
    
    if (pages[pageName]) {
        pages[pageName].classList.add('active');
    }
    
    // 更新导航状态
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.toggle('active', link.dataset.page === pageName);
    });
    
    // 特殊页面初始化
    if (pageName === 'profile') {
        updateProfilePage();
    } else if (pageName === 'admin') {
        loadAdminData();
    }
}

// 认证表单
function initAuthForms() {
    const authTabs = document.querySelectorAll('.auth-tab');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    
    authTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            authTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            const authType = tab.dataset.auth;
            loginForm.classList.toggle('active', authType === 'login');
            registerForm.classList.toggle('active', authType === 'register');
        });
    });
    
    // 登录
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('login-username').value;
        const password = document.getElementById('login-password').value;
        
        try {
            const result = await AuthAPI.login(username, password);
            saveAuthInfo(result.access_token, result.user);
            updateUI();
            showPage('home');
            alert('登录成功！');
        } catch (error) {
            alert(error.message);
        }
    });
    
    // 注册
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('register-username').value;
        const password = document.getElementById('register-password').value;
        
        try {
            await AuthAPI.register(username, password);
            alert('注册成功！请登录。');
            loginForm.classList.add('active');
            registerForm.classList.remove('active');
            authTabs[0].classList.add('active');
            authTabs[1].classList.remove('active');
        } catch (error) {
            alert(error.message);
        }
    });
    
    // 退出登录
    document.getElementById('logout-btn')?.addEventListener('click', () => {
        clearAuthInfo();
        updateUI();
        showPage('home');
    });
}

// 更新 UI 状态
function updateUI() {
    currentUser = getCurrentUser();
    
    const isLoggedIn = isAuthenticated();
    
    // 更新导航链接
    const profileLink = document.querySelector('[data-page="profile"]');
    if (profileLink) {
        profileLink.textContent = isLoggedIn ? (currentUser.username + '的个人中心') : '登录/注册';
    }
    
    // 更新个人中心
    if (isLoggedIn) {
        document.getElementById('profile-username').textContent = currentUser.username;
        document.getElementById('profile-badge').className = 
            `badge ${currentUser.is_admin ? 'badge-admin' : 'badge-user'}`;
        document.getElementById('profile-badge').textContent = 
            currentUser.is_admin ? '管理员' : '用户';
        
        // 显示管理员按钮
        const adminBtn = document.getElementById('admin-panel-btn');
        if (adminBtn) {
            adminBtn.style.display = currentUser.is_admin ? 'block' : 'none';
        }
    }
}

// 加载公开抽奖
async function loadPublicLotteries() {
    try {
        const lotteries = await LotteryAPI.getLotteries({ public: 'true' });
        const container = document.getElementById('public-lotteries-list');
        
        if (!container) return;
        
        container.innerHTML = '';
        
        if (lotteries.length === 0) {
            container.innerHTML = '<p>暂无公开抽奖</p>';
            return;
        }
        
        lotteries.forEach(lottery => {
            const card = document.createElement('div');
            card.className = 'lottery-card';
            card.innerHTML = `
                <h3>${escapeHtml(lottery.name)}</h3>
                <p>${escapeHtml(lottery.description || '暂无描述')}</p>
                <div class="lottery-meta">
                    <span>🎯 ${lottery.mode === 'special' ? '特殊模式' : '普通模式'}</span>
                    <span>👥 ${lottery.max_participants || '不限'}人</span>
                </div>
            `;
            
            card.addEventListener('click', () => {
                if (lottery.access_code) {
                    const code = prompt('请输入抽奖口令：');
                    if (code !== lottery.access_code) {
                        alert('口令错误！');
                        return;
                    }
                }
                openLotteryDetail(lottery.id);
            });
            
            container.appendChild(card);
        });
    } catch (error) {
        console.error('加载抽奖列表失败:', error);
    }
}

// 打开抽奖详情
async function openLotteryDetail(lotteryId) {
    try {
        currentLottery = await LotteryAPI.getLottery(lotteryId);
        
        document.getElementById('detail-lottery-name').textContent = currentLottery.name;
        document.getElementById('detail-lottery-description').textContent = currentLottery.description;
        document.getElementById('detail-lottery-mode').textContent = 
            currentLottery.mode === 'special' ? '🎪 特殊转盘模式' : '🎲 普通模式';
        document.getElementById('detail-participant-count').textContent = 
            `👥 ${currentLottery.participant_count}人已参与`;
        document.getElementById('detail-draw-time').textContent = 
            currentLottery.draw_time ? `⏰ ${formatDate(currentLottery.draw_time)}` : '';
        document.getElementById('detail-redemption').textContent = currentLottery.prize_redemption || '无';
        
        // 奖品列表
        const prizesList = document.getElementById('detail-prizes-list');
        prizesList.innerHTML = '';
        currentLottery.prizes.forEach(prize => {
            const li = document.createElement('li');
            li.textContent = `${prize.name} (权重：${prize.weight})`;
            prizesList.appendChild(li);
        });
        
        // 初始化转盘
        if (currentWheel) {
            currentWheel = null;
        }
        
        if (currentLottery.prizes.length > 0) {
            setTimeout(() => {
                currentWheel = createWheel('wheel-canvas', currentLottery.prizes);
            }, 100);
        }
        
        showPage('lotteryDetail');
    } catch (error) {
        alert('加载抽奖详情失败：' + error.message);
    }
}

// 转盘抽奖按钮
document.getElementById('spin-btn')?.addEventListener('click', async () => {
    if (!currentWheel || currentWheel.isSpinning) return;
    
    const isLoggedIn = isAuthenticated();
    const user = getCurrentUser();
    
    try {
        // 先参与抽奖
        const joinData = {
            username: isLoggedIn ? user.username : '游客_' + Math.random().toString(36).substr(2, 6),
            user_id: isLoggedIn ? user.id : null,
        };
        
        await LotteryAPI.joinLottery(currentLottery.id, joinData);
        
        // 开始转盘
        const result = await currentWheel.spin();
        
        alert(`🎉 恭喜你抽中：${result.name}`);
        
        // 显示结果
        document.getElementById('result-container').style.display = 'block';
        document.getElementById('result-content').innerHTML = `
            <p>🎊 抽奖结果 🎊</p>
            <p style="font-size: 2rem; color: var(--primary-color);">${result.name}</p>
            <p>请耐心等待开奖...</p>
        `;
        
    } catch (error) {
        alert(error.message);
    }
});

// 创建抽奖表单
document.getElementById('create-lottery-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    if (!isAuthenticated()) {
        alert('请先登录！');
        showPage('auth');
        return;
    }
    
    const prizesText = document.getElementById('prizes-input').value;
    const prizes = prizesText.split('\n').filter(line => line.trim()).map(name => ({
        name: name.trim(),
        weight: 1,
    }));
    
    const lotteryData = {
        name: document.getElementById('lottery-name').value,
        description: document.getElementById('lottery-description').value,
        mode: document.getElementById('lottery-mode').value,
        prize_redemption: document.getElementById('lottery-redemption').value,
        access_code: document.getElementById('lottery-access-code').value || null,
        is_public: document.getElementById('lottery-is-public').checked,
        require_login: document.getElementById('lottery-require-login').checked,
        max_participants: parseInt(document.getElementById('lottery-max-participants').value) || null,
        draw_time: document.getElementById('lottery-draw-time').value || null,
        prizes: prizes,
    };
    
    try {
        const result = await LotteryAPI.createLottery(lotteryData);
        alert('创建成功！\n访问口令：' + (result.access_code || '无（公开）'));
        showPage('profile');
    } catch (error) {
        alert(error.message);
    }
});

// 随机生成口令
document.getElementById('generate-code-btn')?.addEventListener('click', () => {
    const code = Math.random().toString(36).substr(2, 8).toUpperCase();
    document.getElementById('lottery-access-code').value = code;
});

// 更新个人中心
function updateProfilePage() {
    if (!currentUser) {
        showPage('auth');
        return;
    }
}

// 管理员功能
document.getElementById('admin-panel-btn')?.addEventListener('click', () => {
    if (!isAdmin()) {
        alert('需要管理员权限！');
        return;
    }
    showPage('admin');
});

// 加载管理员数据
async function loadAdminData() {
    if (!isAdmin()) {
        showPage('home');
        return;
    }
    
    try {
        const users = await AdminAPI.getUsers();
        const tbody = document.getElementById('users-table-body');
        tbody.innerHTML = '';
        
        users.forEach(user => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${user.id}</td>
                <td>${escapeHtml(user.username)}</td>
                <td>${user.is_admin ? '👑 管理员' : '👤 用户'}</td>
                <td>${user.is_banned ? '❌ 已封禁' : '✅ 正常'}</td>
                <td>${formatDate(user.created_at)}</td>
                <td>
                    ${!user.is_admin ? `
                        <button class="btn btn-sm ${user.is_banned ? 'btn-success' : 'btn-danger'}" 
                                onclick="${user.is_banned ? 'unbanUser' : 'banUser'}(${user.id})">
                            ${user.is_banned ? '解封' : '封禁'}
                        </button>
                    ` : '-'}
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (error) {
        alert('加载用户列表失败：' + error.message);
    }
}

// 封禁/解封用户
window.banUser = async (userId) => {
    try {
        await AdminAPI.banUser(userId);
        alert('用户已封禁');
        loadAdminData();
    } catch (error) {
        alert(error.message);
    }
};

window.unbanUser = async (userId) => {
    try {
        await AdminAPI.unbanUser(userId);
        alert('用户已解封');
        loadAdminData();
    } catch (error) {
        alert(error.message);
    }
};

// 公告表单
document.getElementById('announcement-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const data = {
        title: document.getElementById('announcement-title').value,
        content: document.getElementById('announcement-content').value,
        is_markdown: document.getElementById('announcement-markdown').checked,
    };
    
    try {
        await AdminAPI.createAnnouncement(data);
        alert('公告发布成功！');
        document.getElementById('announcement-form').reset();
    } catch (error) {
        alert(error.message);
    }
});

// 系统设置表单
document.getElementById('settings-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const data = {
        rate_limit_enabled: document.getElementById('setting-rate-limit-enabled').value,
        rate_limit_per_hour: parseInt(document.getElementById('setting-rate-limit-hour').value),
        rate_limit_per_minute: parseInt(document.getElementById('setting-rate-limit-minute').value),
        maintenance_mode: document.getElementById('setting-maintenance-mode').value,
        maintenance_message: document.getElementById('setting-maintenance-message').value,
    };
    
    try {
        await AdminAPI.updateSettings(data);
        alert('设置保存成功！');
    } catch (error) {
        alert(error.message);
    }
});

// 工具函数
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatDate(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleString('zh-CN');
}

// 管理员标签页切换
document.querySelectorAll('.admin-tab').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.admin-tab-content').forEach(c => c.classList.remove('active'));
        
        tab.classList.add('active');
        const tabName = tab.dataset.adminTab;
        document.getElementById(`admin-${tabName}-tab`).classList.add('active');
    });
});
