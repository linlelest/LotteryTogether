import sqlite3
import os
import secrets
import bcrypt
from datetime import datetime

# 数据库文件路径
DB_PATH = os.path.join(os.path.dirname(__file__), 'lottery.db')

def init_db():
    """初始化数据库，创建所有表"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # 创建用户表
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            is_admin BOOLEAN DEFAULT FALSE,
            is_banned BOOLEAN DEFAULT FALSE,
            is_first_login BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # 创建抽奖表
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS lotteries (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            description TEXT,
            mode TEXT DEFAULT 'normal',
            prize_redemption TEXT,
            access_code TEXT,
            is_public BOOLEAN DEFAULT FALSE,
            max_participants INTEGER,
            draw_time TIMESTAMP,
            require_login BOOLEAN DEFAULT FALSE,
            creator_id INTEGER NOT NULL,
            status TEXT DEFAULT 'pending',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (creator_id) REFERENCES users(id)
        )
    ''')
    
    # 创建奖品表
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS prizes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            lottery_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            weight INTEGER DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (lottery_id) REFERENCES lotteries(id) ON DELETE CASCADE
        )
    ''')
    
    # 创建参与者表
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS participants (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            lottery_id INTEGER NOT NULL,
            user_id INTEGER,
            username TEXT,
            joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            spin_result TEXT,
            spin_count INTEGER DEFAULT 0,
            FOREIGN KEY (lottery_id) REFERENCES lotteries(id) ON DELETE CASCADE,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    ''')
    
    # 创建开奖结果表
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS results (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            lottery_id INTEGER NOT NULL,
            winner_username TEXT NOT NULL,
            prize_name TEXT NOT NULL,
            announced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (lottery_id) REFERENCES lotteries(id) ON DELETE CASCADE
        )
    ''')
    
    # 创建公告表
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS announcements (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            is_markdown BOOLEAN DEFAULT TRUE,
            is_active BOOLEAN DEFAULT TRUE,
            created_by INTEGER NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (created_by) REFERENCES users(id)
        )
    ''')
    
    # 创建通知表
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS notifications (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            is_read BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    ''')
    
    # 创建系统设置表
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS settings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            key_name TEXT UNIQUE NOT NULL,
            value TEXT,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # 创建访问日志表（用于速率限制）
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS access_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            ip_address TEXT NOT NULL,
            user_id INTEGER,
            endpoint TEXT NOT NULL,
            accessed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # 插入默认管理员账号（如果不存在）
    default_password = 'admin123'
    password_hash = bcrypt.hashpw(default_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    cursor.execute('''
        INSERT OR IGNORE INTO users (username, password_hash, is_admin, is_first_login)
        VALUES (?, ?, ?, ?)
    ''', ('admin', password_hash, True, True))
    
    # 插入默认系统设置
    default_settings = [
        ('rate_limit_enabled', 'true'),
        ('rate_limit_per_hour', '100'),
        ('rate_limit_per_minute', '20'),
        ('maintenance_mode', 'false'),
        ('maintenance_message', '系统正在维护中，请稍后再试。')
    ]
    
    for key, value in default_settings:
        cursor.execute('''
            INSERT OR IGNORE INTO settings (key_name, value)
            VALUES (?, ?)
        ''', (key, value))
    
    conn.commit()
    conn.close()
    
    print("数据库初始化完成！")
    print("默认管理员账号：")
    print("  用户名：admin")
    print("  密码：admin123")
    print("\n请首次登录后立即修改管理员密码！")

if __name__ == '__main__':
    init_db()
