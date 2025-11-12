# Redis 服务器安装指南

## 服务器信息
- **IP地址**: 115.190.213.0
- **用户**: root
- **密码**: Direnjie@0326

## 手动安装步骤

### 1. 连接到服务器
```bash
ssh root@115.190.213.0
# 输入密码: Direnjie@0326
```

### 2. 更新系统软件包
```bash
apt update -y
apt upgrade -y
```

### 3. 安装Redis服务器
```bash
apt install redis-server -y
```

### 4. 启动并启用Redis服务
```bash
systemctl start redis-server
systemctl enable redis-server
systemctl status redis-server
```

### 5. 配置Redis远程访问
```bash
# 备份配置文件
cp /etc/redis/redis.conf /etc/redis/redis.conf.backup

# 编辑配置文件
nano /etc/redis/redis.conf
```

在配置文件中修改以下设置：
```bash
# 将这行:
bind 127.0.0.1

# 改为:
bind 0.0.0.0

# 将这行（如果存在）:
protected-mode yes

# 改为:
protected-mode no
```

### 6. 重启Redis服务
```bash
systemctl restart redis-server
```

### 7. 验证Redis安装
```bash
# 检查服务状态
systemctl status redis-server

# 测试Redis连接
redis-cli ping
# 应该返回: PONG

# 检查监听端口
netstat -tlnp | grep :6379
# 应该显示 Redis 监听在 0.0.0.0:6379

# 检查Redis版本
redis-server --version
```

## 一键安装脚本（复制粘贴到服务器）

连接到服务器后，可以运行以下一键安装脚本：

```bash
#!/bin/bash

echo "=== 开始安装Redis ==="

# 更新系统
apt update -y
apt upgrade -y

# 安装Redis
apt install redis-server -y

# 启动服务
systemctl start redis-server
systemctl enable redis-server

# 配置远程访问
cp /etc/redis/redis.conf /etc/redis/redis.conf.backup
sed -i 's/bind 127.0.0.1/bind 0.0.0.0/' /etc/redis/redis.conf
sed -i 's/protected-mode yes/protected-mode no/' /etc/redis/redis.conf

# 重启服务
systemctl restart redis-server

# 验证安装
echo "=== Redis安装信息 ==="
echo "服务状态:"
systemctl status redis-server --no-pager
echo "Redis测试:"
redis-cli ping
echo "监听端口:"
netstat -tlnp | grep :6379
echo "Redis版本:"
redis-server --version

echo "=== Redis安装完成! ==="
echo "IP: 115.190.213.0"
echo "端口: 6379"
echo "状态: 运行中"
```

## 防火墙配置（如果需要）

如果服务器有防火墙，需要开放6379端口：

```bash
# UFW防火墙
ufw allow 6379/tcp
ufw reload

# 或者 iptables
iptables -A INPUT -p tcp --dport 6379 -j ACCEPT
iptables-save
```

## 测试连接

从本地机器测试Redis连接：

```bash
# 安装redis-cli (如果没有)
# Windows: 下载 Redis for Windows
# Linux: apt install redis-tools
# Mac: brew install redis

# 测试连接
redis-cli -h 115.190.213.0 -p 6379 ping
# 应该返回: PONG
```

## 安全建议

1. **生产环境建议**:
   - 启用Redis密码认证
   - 限制可访问的IP地址
   - 启用防火墙规则

2. **Redis密码配置**:
```bash
# 在 redis.conf 中添加:
requirepass your_secure_password

# 重启Redis后使用密码连接:
redis-cli -h 115.190.213.0 -p 6379 -a your_secure_password
```

安装完成后，Redis将在你的服务器上运行，可以被后端应用程序访问！