@echo off
echo === Redis 远程安装脚本 ===
echo 服务器: 115.190.213.0
echo 用户: root
echo.

echo 请按照以下步骤手动安装Redis:
echo.
echo 1. 打开命令提示符或PowerShell
echo 2. 连接到服务器:
echo    ssh root@115.190.213.0
echo 3. 输入密码: Direnjie@0326
echo 4. 复制并运行以下命令:
echo.

echo === 更新系统 ===
echo apt update -y ^&^& apt upgrade -y
echo.
echo === 安装Redis ===
echo apt install redis-server -y
echo.
echo === 启动服务 ===
echo systemctl start redis-server ^&^& systemctl enable redis-server
echo.
echo === 配置远程访问 ===
echo cp /etc/redis/redis.conf /etc/redis/redis.conf.backup
echo sed -i 's/bind 127.0.0.1/bind 0.0.0.0/' /etc/redis/redis.conf
echo sed -i 's/protected-mode yes/protected-mode no/' /etc/redis/redis.conf
echo.
echo === 重启服务 ===
echo systemctl restart redis-server
echo.
echo === 验证安装 ===
echo systemctl status redis-server --no-pager
echo redis-cli ping
echo netstat -tlnp ^| grep :6379
echo redis-server --version
echo.

echo 或者使用一键安装脚本:
echo.
echo curl -sSL https://raw.githubusercontent.com/redis/redis/main/utils/install_server.sh ^| bash
echo.

pause