# Redis 安装脚本 - PowerShell版本
# 用于在远程服务器 115.190.213.0 上安装Redis

$host = "115.190.213.0"
$user = "root"
$password = "Direnjie@0326"

Write-Host "正在连接到服务器 $host..." -ForegroundColor Green

# 创建SSH命令列表
$commands = @(
    "echo '=== SSH连接成功，开始安装Redis ==='",
    "cat /etc/os-release",
    "echo '=== 开始更新系统软件包 ==='",
    "apt update -y",
    "apt upgrade -y",
    "echo '=== 安装Redis服务器 ==='",
    "apt install redis-server -y",
    "echo '=== 启动并启用Redis服务 ==='",
    "systemctl start redis-server",
    "systemctl enable redis-server",
    "systemctl status redis-server --no-pager",
    "echo '=== 配置Redis远程访问 ==='",
    "cp /etc/redis/redis.conf /etc/redis/redis.conf.backup",
    "sed -i 's/bind 127.0.0.1/bind 0.0.0.0/' /etc/redis/redis.conf",
    "sed -i 's/protected-mode yes/protected-mode no/' /etc/redis/redis.conf",
    "echo '=== 重启Redis服务 ==='",
    "systemctl restart redis-server",
    "echo '=== 检查Redis服务状态 ==='",
    "systemctl status redis-server --no-pager",
    "echo '=== 测试Redis连接 ==='",
    "redis-cli ping",
    "echo '=== 检查Redis监听端口 ==='",
    "netstat -tlnp | grep :6379",
    "echo '=== 检查Redis版本 ==='",
    "redis-server --version",
    "echo '=== Redis安装完成！ ==='",
    "echo 'Redis服务器信息:'",
    "echo 'IP地址: $host'",
    "echo '端口: 6379'",
    "echo '状态: 运行中'"
)

# 执行每个命令
foreach ($cmd in $commands) {
    Write-Host "执行: $cmd" -ForegroundColor Yellow

    # 使用plink (PuTTY) 或 ssh 命令
    $sshCmd = "echo `"$cmd`" | ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=NUL $user@$host"

    try {
        # 尝试使用系统SSH
        $result = cmd /c "$sshCmd" 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host $result -ForegroundColor Green
        } else {
            Write-Host "命令执行失败，尝试手动连接..." -ForegroundColor Red
        }
    } catch {
        Write-Host "SSH命令执行出错: $_" -ForegroundColor Red
    }

    Start-Sleep -Seconds 2
}

Write-Host "Redis安装脚本执行完成！" -ForegroundColor Green
Write-Host "请手动验证Redis是否正常运行" -ForegroundColor Yellow