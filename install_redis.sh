#!/usr/bin/expect -f

set timeout 30
set host "115.190.213.0"
set user "root"
set password "Direnjie@0326"

# 连接到服务器
spawn ssh $user@$host

# 等待密码提示
expect "password:" {
    send "$password\r"
}

# 等待shell提示符
expect "# " {
    send "echo 'SSH连接成功，开始安装Redis'\r"
}

# 检查系统类型
expect "# " {
    send "cat /etc/os-release\r"
}

expect "# " {
    send "echo '=== 开始更新系统软件包 ==='\r"
}

# 更新系统包
expect "# " {
    send "apt update -y\r"
}

expect "# " {
    send "apt upgrade -y\r"
}

expect "# " {
    send "echo '=== 安装Redis服务器 ==='\r"
}

# 安装Redis
expect "# " {
    send "apt install redis-server -y\r"
}

expect "# " {
    send "echo '=== 启动并启用Redis服务 ==='\r"
}

# 启动并启用Redis
expect "# " {
    send "systemctl start redis-server\r"
}

expect "# " {
    send "systemctl enable redis-server\r"
}

expect "# " {
    send "systemctl status redis-server\r"
}

expect "# " {
    send "echo '=== 配置Redis远程访问 ==='\r"
}

# 备份配置文件
expect "# " {
    send "cp /etc/redis/redis.conf /etc/redis/redis.conf.backup\r"
}

# 修改配置文件允许远程访问
expect "# " {
    send "sed -i 's/bind 127.0.0.1/bind 0.0.0.0/' /etc/redis/redis.conf\r"
}

# 禁用保护模式（生产环境建议启用密码）
expect "# " {
    send "sed -i 's/protected-mode yes/protected-mode no/' /etc/redis/redis.conf\r"
}

expect "# " {
    send "echo '=== 重启Redis服务 ==='\r"
}

# 重启Redis
expect "# " {
    send "systemctl restart redis-server\r"
}

expect "# " {
    send "echo '=== 检查Redis服务状态 ==='\r"
}

# 检查服务状态
expect "# " {
    send "systemctl status redis-server --no-pager\r"
}

expect "# " {
    send "echo '=== 测试Redis连接 ==='\r"
}

# 测试Redis连接
expect "# " {
    send "redis-cli ping\r"
}

expect "# " {
    send "echo '=== 检查Redis监听端口 ==='\r"
}

# 检查端口监听
expect "# " {
    send "netstat -tlnp | grep :6379\r"
}

expect "# " {
    send "echo '=== 检查Redis版本 ==='\r"
}

# 检查Redis版本
expect "# " {
    send "redis-server --version\r"
}

expect "# " {
    send "echo '=== Redis安装完成！ ==='\r"
}

expect "# " {
    send "echo 'Redis服务器信息:'\r"
}

expect "# " {
    send "echo 'IP地址: 115.190.213.0'\r"
}

expect "# " {
    send "echo '端口: 6379'\r"
}

expect "# " {
    send "echo '状态: 运行中'\r"
}

expect "# " {
    send "exit\r"
}

expect eof