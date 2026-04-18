from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
import sqlite3
import bcrypt
import os
import secrets
from datetime import datetime, timedelta
from functools import wraps

app = Flask(__name__, static_folder='../frontend/public', static_url_path='')
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev-secret-key-change-in-production')
app.config['JWT_SECRET_KEY'] = os.environ.get('JWT_SECRET_KEY', 'jwt-secret-key-change-in-production')
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=1)

# 初始化扩展
CORS(app, resources={r"/api/*": {"origins": "*"}})
jwt = JWTManager(app)

# 速率限制
limiter = Limiter(
    app=app,
    key_func=get_remote_address,
    default_limits=["100 per hour", "20 per minute"],
    storage_uri="memory://"
)

# 数据库路径
DB_PATH = os.path.join(os.path.dirname(__file__), 'lottery.db')

def get_db():
    """获取数据库连接"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def check_admin_activation():
    """检查管理员是否已激活"""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM users WHERE is_admin = TRUE AND is_first_login = FALSE")
    admin = cursor.fetchone()
    conn.close()
    return admin is not None

def get_setting(key):
    """获取系统设置"""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT value FROM settings WHERE key_name = ?", (key,))
    row = cursor.fetchone()
    conn.close()
    return row[0] if row else None

def require_admin(f):
    """管理员权限装饰器"""
    @wraps(f)
    @jwt_required()
    def decorated(*args, **kwargs):
        current_user = get_jwt_identity()
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("SELECT is_admin, is_banned FROM users WHERE username = ?", (current_user,))
        user = cursor.fetchone()
        conn.close()
        
        if not user:
            return jsonify({"error": "用户不存在"}), 404
        if user['is_banned']:
            return jsonify({"error": "账号已被封禁"}), 403
        if not user['is_admin']:
            return jsonify({"error": "需要管理员权限"}), 403
        
        return f(*args, **kwargs)
    return decorated

# ==================== 认证路由 ====================

@app.route('/api/register', methods=['POST'])
@limiter.limit("10 per hour")
def register():
    """用户注册"""
    # 检查管理员是否已激活
    if not check_admin_activation():
        return jsonify({"error": "系统尚未激活，请联系管理员"}), 403
    
    data = request.get_json()
    username = data.get('username', '').strip()
    password = data.get('password', '')
    
    if not username or not password:
        return jsonify({"error": "用户名和密码不能为空"}), 400
    
    if len(username) < 3 or len(username) > 20:
        return jsonify({"error": "用户名长度必须在 3-20 个字符之间"}), 400
    
    if len(password) < 6:
        return jsonify({"error": "密码长度至少为 6 个字符"}), 400
    
    conn = get_db()
    cursor = conn.cursor()
    
    # 检查用户名是否已存在
    cursor.execute("SELECT id FROM users WHERE username = ?", (username,))
    if cursor.fetchone():
        conn.close()
        return jsonify({"error": "用户名已存在"}), 409
    
    # 哈希密码
    password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    try:
        cursor.execute(
            "INSERT INTO users (username, password_hash) VALUES (?, ?)",
            (username, password_hash)
        )
        conn.commit()
        conn.close()
        return jsonify({"message": "注册成功"}), 201
    except Exception as e:
        conn.close()
        return jsonify({"error": str(e)}), 500

@app.route('/api/login', methods=['POST'])
@limiter.limit("20 per hour")
def login():
    """用户登录"""
    data = request.get_json()
    username = data.get('username', '').strip()
    password = data.get('password', '')
    
    if not username or not password:
        return jsonify({"error": "用户名和密码不能为空"}), 400
    
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE username = ?", (username,))
    user = cursor.fetchone()
    conn.close()
    
    if not user:
        return jsonify({"error": "用户名或密码错误"}), 401
    
    if user['is_banned']:
        return jsonify({"error": "账号已被封禁"}), 403
    
    if not bcrypt.checkpw(password.encode('utf-8'), user['password_hash'].encode('utf-8')):
        return jsonify({"error": "用户名或密码错误"}), 401
    
    # 生成 JWT token
    access_token = create_access_token(identity=username)
    
    return jsonify({
        "message": "登录成功",
        "access_token": access_token,
        "user": {
            "username": user['username'],
            "is_admin": bool(user['is_admin']),
            "is_first_login": bool(user['is_first_login'])
        }
    }), 200

@app.route('/api/user/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    """更新用户资料"""
    current_user = get_jwt_identity()
    data = request.get_json()
    
    conn = get_db()
    cursor = conn.cursor()
    
    if 'username' in data:
        new_username = data['username'].strip()
        if len(new_username) < 3 or len(new_username) > 20:
            conn.close()
            return jsonify({"error": "用户名长度必须在 3-20 个字符之间"}), 400
        
        cursor.execute("SELECT id FROM users WHERE username = ?", (new_username,))
        if cursor.fetchone():
            conn.close()
            return jsonify({"error": "用户名已存在"}), 409
        
        cursor.execute("UPDATE users SET username = ? WHERE username = ?", (new_username, current_user))
        current_user = new_username
    
    if 'password' in data:
        new_password = data['password']
        if len(new_password) < 6:
            conn.close()
            return jsonify({"error": "密码长度至少为 6 个字符"}), 400
        
        password_hash = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        cursor.execute("UPDATE users SET password_hash = ? WHERE username = ?", (password_hash, current_user))
    
    if 'is_first_login' in data:
        cursor.execute("UPDATE users SET is_first_login = FALSE WHERE username = ?", (current_user,))
    
    cursor.execute("UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE username = ?", (current_user,))
    conn.commit()
    conn.close()
    
    return jsonify({"message": "更新成功"}), 200

# ==================== 抽奖路由 ====================

@app.route('/api/lotteries', methods=['GET'])
def get_lotteries():
    """获取抽奖列表"""
    conn = get_db()
    cursor = conn.cursor()
    
    status = request.args.get('status')
    is_public = request.args.get('public')
    
    query = "SELECT * FROM lotteries WHERE 1=1"
    params = []
    
    if status:
        query += " AND status = ?"
        params.append(status)
    
    if is_public == 'true':
        query += " AND is_public = TRUE"
    
    query += " ORDER BY created_at DESC"
    
    cursor.execute(query, params)
    lotteries = cursor.fetchall()
    conn.close()
    
    result = []
    for lottery in lotteries:
        result.append({
            "id": lottery['id'],
            "name": lottery['name'],
            "description": lottery['description'],
            "mode": lottery['mode'],
            "is_public": bool(lottery['is_public']),
            "access_code": lottery['access_code'] if lottery['access_code'] else None,
            "max_participants": lottery['max_participants'],
            "draw_time": lottery['draw_time'],
            "require_login": bool(lottery['require_login']),
            "status": lottery['status'],
            "created_at": lottery['created_at']
        })
    
    return jsonify(result), 200

@app.route('/api/lotteries', methods=['POST'])
@jwt_required()
def create_lottery():
    """创建抽奖"""
    current_user = get_jwt_identity()
    data = request.get_json()
    
    conn = get_db()
    cursor = conn.cursor()
    
    # 获取创建者 ID
    cursor.execute("SELECT id FROM users WHERE username = ?", (current_user,))
    creator = cursor.fetchone()
    
    if not creator:
        conn.close()
        return jsonify({"error": "用户不存在"}), 404
    
    # 生成访问口令（如果需要）
    access_code = data.get('access_code')
    if access_code == 'random':
        access_code = secrets.token_hex(4)
    elif not access_code:
        access_code = None
    
    try:
        cursor.execute('''
            INSERT INTO lotteries 
            (name, description, mode, prize_redemption, access_code, is_public, 
             max_participants, draw_time, require_login, creator_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            data.get('name'),
            data.get('description'),
            data.get('mode', 'normal'),
            data.get('prize_redemption'),
            access_code,
            bool(data.get('is_public', False)),
            data.get('max_participants'),
            data.get('draw_time'),
            bool(data.get('require_login', False)),
            creator['id']
        ))
        
        lottery_id = cursor.lastrowid
        
        # 添加奖品
        prizes = data.get('prizes', [])
        for prize in prizes:
            cursor.execute(
                "INSERT INTO prizes (lottery_id, name, weight) VALUES (?, ?, ?)",
                (lottery_id, prize['name'], prize.get('weight', 1))
            )
        
        conn.commit()
        conn.close()
        
        return jsonify({
            "message": "创建成功",
            "lottery_id": lottery_id,
            "access_code": access_code
        }), 201
    except Exception as e:
        conn.close()
        return jsonify({"error": str(e)}), 500

@app.route('/api/lotteries/<int:lottery_id>', methods=['GET'])
def get_lottery(lottery_id):
    """获取抽奖详情"""
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute("SELECT * FROM lotteries WHERE id = ?", (lottery_id,))
    lottery = cursor.fetchone()
    
    if not lottery:
        conn.close()
        return jsonify({"error": "抽奖不存在"}), 404
    
    # 获取奖品列表
    cursor.execute("SELECT * FROM prizes WHERE lottery_id = ?", (lottery_id,))
    prizes = cursor.fetchall()
    
    # 获取参与者数量
    cursor.execute("SELECT COUNT(*) as count FROM participants WHERE lottery_id = ?", (lottery_id,))
    participant_count = cursor.fetchone()['count']
    
    conn.close()
    
    return jsonify({
        "id": lottery['id'],
        "name": lottery['name'],
        "description": lottery['description'],
        "mode": lottery['mode'],
        "prize_redemption": lottery['prize_redemption'],
        "is_public": bool(lottery['is_public']),
        "max_participants": lottery['max_participants'],
        "draw_time": lottery['draw_time'],
        "require_login": bool(lottery['require_login']),
        "status": lottery['status'],
        "prizes": [{"id": p['id'], "name": p['name'], "weight": p['weight']} for p in prizes],
        "participant_count": participant_count,
        "created_at": lottery['created_at']
    }), 200

# ==================== 参与抽奖路由 ====================

@app.route('/api/lotteries/<int:lottery_id>/join', methods=['POST'])
def join_lottery(lottery_id):
    """参与抽奖"""
    data = request.get_json()
    username = data.get('username', '游客')
    user_id = data.get('user_id')
    
    conn = get_db()
    cursor = conn.cursor()
    
    # 检查抽奖是否存在
    cursor.execute("SELECT * FROM lotteries WHERE id = ?", (lottery_id,))
    lottery = cursor.fetchone()
    
    if not lottery:
        conn.close()
        return jsonify({"error": "抽奖不存在"}), 404
    
    # 检查是否需要登录
    if lottery['require_login'] and not user_id:
        conn.close()
        return jsonify({"error": "此抽奖需要登录后参与"}), 403
    
    # 检查参与人数
    if lottery['max_participants']:
        cursor.execute("SELECT COUNT(*) as count FROM participants WHERE lottery_id = ?", (lottery_id,))
        count = cursor.fetchone()['count']
        if count >= lottery['max_participants']:
            conn.close()
            return jsonify({"error": "参与人数已达上限"}), 400
    
    # 检查是否已参与
    if user_id:
        cursor.execute("SELECT id FROM participants WHERE lottery_id = ? AND user_id = ?", (lottery_id, user_id))
    else:
        cursor.execute("SELECT id FROM participants WHERE lottery_id = ? AND username = ?", (lottery_id, username))
    
    if cursor.fetchone():
        conn.close()
        return jsonify({"error": "您已经参与过此抽奖"}), 400
    
    try:
        cursor.execute(
            "INSERT INTO participants (lottery_id, user_id, username) VALUES (?, ?, ?)",
            (lottery_id, user_id, username)
        )
        conn.commit()
        conn.close()
        
        return jsonify({"message": "参与成功"}), 201
    except Exception as e:
        conn.close()
        return jsonify({"error": str(e)}), 500

@app.route('/api/lotteries/<int:lottery_id>/spin', methods=['POST'])
def spin_lottery(lottery_id):
    """转盘抽奖"""
    data = request.get_json()
    participant_id = data.get('participant_id')
    
    conn = get_db()
    cursor = conn.cursor()
    
    # 获取参与者信息
    cursor.execute("SELECT * FROM participants WHERE id = ? AND lottery_id = ?", (participant_id, lottery_id))
    participant = cursor.fetchone()
    
    if not participant:
        conn.close()
        return jsonify({"error": "参与者不存在"}), 404
    
    # 获取奖品列表
    cursor.execute("SELECT * FROM prizes WHERE lottery_id = ?", (lottery_id,))
    prizes = cursor.fetchall()
    
    if not prizes:
        conn.close()
        return jsonify({"error": "没有可抽的奖品"}), 400
    
    # 根据权重随机选择奖品
    total_weight = sum(p['weight'] for p in prizes)
    import random
    rand_num = random.uniform(0, total_weight)
    cumulative = 0
    selected_prize = prizes[0]
    
    for prize in prizes:
        cumulative += prize['weight']
        if rand_num <= cumulative:
            selected_prize = prize
            break
    
    # 更新参与者的抽奖结果
    spin_count = participant['spin_count'] + 1
    cursor.execute(
        "UPDATE participants SET spin_result = ?, spin_count = ? WHERE id = ?",
        (selected_prize['name'], spin_count, participant_id)
    )
    conn.commit()
    conn.close()
    
    return jsonify({
        "message": "抽奖完成",
        "result": selected_prize['name'],
        "spin_count": spin_count
    }), 200

# ==================== 管理员路由 ====================

@app.route('/api/admin/users', methods=['GET'])
@require_admin
def get_all_users():
    """获取所有用户"""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT id, username, is_admin, is_banned, is_first_login, created_at FROM users ORDER BY created_at DESC")
    users = cursor.fetchall()
    conn.close()
    
    result = [{
        "id": u['id'],
        "username": u['username'],
        "is_admin": bool(u['is_admin']),
        "is_banned": bool(u['is_banned']),
        "is_first_login": bool(u['is_first_login']),
        "created_at": u['created_at']
    } for u in users]
    
    return jsonify(result), 200

@app.route('/api/admin/users/<int:user_id>/ban', methods=['PUT'])
@require_admin
def ban_user(user_id):
    """封禁用户"""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("UPDATE users SET is_banned = TRUE WHERE id = ?", (user_id,))
    conn.commit()
    conn.close()
    return jsonify({"message": "用户已封禁"}), 200

@app.route('/api/admin/users/<int:user_id>/unban', methods=['PUT'])
@require_admin
def unban_user(user_id):
    """解封用户"""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("UPDATE users SET is_banned = FALSE WHERE id = ?", (user_id,))
    conn.commit()
    conn.close()
    return jsonify({"message": "用户已解封"}), 200

@app.route('/api/admin/announcements', methods=['POST'])
@require_admin
def create_announcement():
    """创建公告"""
    current_user = get_jwt_identity()
    data = request.get_json()
    
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute("SELECT id FROM users WHERE username = ?", (current_user,))
    admin = cursor.fetchone()
    
    cursor.execute('''
        INSERT INTO announcements (title, content, is_markdown, created_by)
        VALUES (?, ?, ?, ?)
    ''', (data.get('title'), data.get('content'), data.get('is_markdown', True), admin['id']))
    
    conn.commit()
    conn.close()
    
    return jsonify({"message": "公告创建成功"}), 201

@app.route('/api/admin/settings', methods=['PUT'])
@require_admin
def update_settings():
    """更新系统设置"""
    data = request.get_json()
    
    conn = get_db()
    cursor = conn.cursor()
    
    for key, value in data.items():
        cursor.execute(
            "UPDATE settings SET value = ?, updated_at = CURRENT_TIMESTAMP WHERE key_name = ?",
            (str(value), key)
        )
    
    conn.commit()
    conn.close()
    
    return jsonify({"message": "设置更新成功"}), 200

# ==================== 前端路由 ====================

@app.route('/')
def serve_frontend():
    """提供前端页面"""
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    """提供静态文件"""
    if os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    return send_from_directory(app.static_folder, 'index.html')

if __name__ == '__main__':
    # 检查数据库是否存在
    if not os.path.exists(DB_PATH):
        print("数据库不存在，正在初始化...")
        from init_db import init_db
        init_db()
    
    app.run(host='0.0.0.0', port=5000, debug=True)
