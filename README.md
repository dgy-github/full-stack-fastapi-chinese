# 全栈 FastAPI 中文项目

<a href="https://github.com/fastapi/full-stack-fastapi-template/actions?query=workflow%3ATest" target="_blank">
    <img src="https://github.com/fastapi/full-stack-fastapi-template/workflows/Test/badge.svg" alt="测试状态">
</a>
<a href="https://coverage-badge.samuelcolvin.workers.dev/redirect/fastapi/full-stack-fastapi-template" target="_blank">
    <img src="https://coverage-badge.samuelcolvin.workers.dev/fastapi/full-stack-fastapi-template.svg" alt="代码覆盖率">
</a>

> 基于 FastAPI 全栈模板的中文本地化项目，集成 DeepSeek AI 对话功能，支持双语界面。

## 🛠️ 技术栈与特性

### 后端技术栈
- ⚡ **[FastAPI](https://fastapi.tiangolo.com)** - Python 后端 API 框架
- 🧰 **[SQLModel](https://sqlmodel.tiangolo.com)** - Python SQL 数据库交互 (ORM)
- 🔍 **[Pydantic](https://docs.pydantic.dev)** - 数据验证和配置管理
- 💾 **[PostgreSQL](https://www.postgresql.org)** - 关系型数据库
- 🤖 **[LangChain](https://python.langchain.com)** - AI 应用开发框架
- 🧠 **[DeepSeek](https://platform.deepseek.com/)** - AI 对话服务 (OpenAI 兼容)

### 前端技术栈
- 🚀 **[React](https://react.dev)** - 现代化前端框架
- 💃 **[TypeScript](https://www.typescriptlang.org/)** - 类型安全的 JavaScript
- 🎨 **[Chakra UI](https://chakra-ui.com)** - 现代化 UI 组件库
- 🔄 **[TanStack Router](https://tanrouter.com)** - 路由管理
- 📊 **[TanStack Query](https://tanstack.com/query)** - 服务端状态管理
- 🌐 **[i18next](https://www.i18next.com/)** - 国际化支持 (中英双语)
- 🧪 **[Playwright](https://playwright.dev)** - 端到端测试
- 🌙 **深色模式** - 支持明暗主题切换
- 🤖 **自动生成客户端** - 基于 OpenAPI 规范

### 开发运维
- 🐋 **[Docker Compose](https://www.docker.com)** - 容器化部署
- 🔒 **安全密码哈希** - 默认启用
- 🔑 **JWT 认证** - JSON Web Token 身份验证
- 📧 **邮件密码恢复** - 基于邮件的密码找回
- ✅ **测试覆盖** - 基于 Pytest 的测试套件
- 📡 **[Traefik](https://traefik.io)** - 反向代理/负载均衡
- 🚢 **部署指南** - Docker Compose 自动 HTTPS 证书
- 🏭 **CI/CD** - 基于 GitHub Actions 的持续集成与部署

## 🎯 项目特色

- 🇨🇳 **中文本地化** - 完整的中文界面和 i18n 支持
- 🤖 **AI 集成** - 内置 DeepSeek AI 对话功能
- 🎨 **现代化设计** - 响应式 UI，支持明暗主题
- 📱 **移动端友好** - 自适应各种屏幕尺寸
- 🛡️ **企业级安全** - 完整的认证授权体系
- 🚀 **开箱即用** - 预配置的开发环境

## 📸 项目预览

### 登录界面
[![登录界面](img/login.png)](img/login.png)

### 管理后台
[![管理后台](img/dashboard.png)](img/dashboard.png)

### 创建用户
[![创建用户](img/dashboard-create.png)](img/dashboard-create.png)

### 项目管理
[![项目管理](img/dashboard-items.png)](img/dashboard-items.png)

### 用户设置
[![用户设置](img/dashboard-user-settings.png)](img/dashboard-user-settings.png)

### 深色模式
[![深色模式](img/dashboard-dark.png)](img/dashboard-dark.png)

### API 文档
[![API 文档](img/docs.png)](img/docs.png)

## 🚀 快速开始

### 方式一：直接克隆

你可以 **直接 Fork 或克隆** 此仓库并使用：

```bash
git clone https://github.com/your-username/full-stack-fastapi-chinese.git
cd full-stack-fastapi-chinese
```

✨ 开箱即用！✨

### 方式二：使用 Copier (推荐)

使用 [Copier](https://copier.readthedocs.io) 创建新项目：

```bash
# 安装 Copier
pipx install copier

# 创建项目
copier copy https://github.com/your-username/full-stack-fastapi-chinese my-awesome-project --trust
```

Copier 将会：
- 📋 复制所有项目文件
- ❓ 询问配置信息
- ⚙️ 自动更新 `.env` 配置文件

## ⚙️ 配置说明

在部署前，请务必修改以下配置项：

### 必须修改的安全配置
- `SECRET_KEY` - JWT 密钥
- `FIRST_SUPERUSER_PASSWORD` - 管理员密码
- `POSTGRES_PASSWORD` - 数据库密码

### AI 功能配置 (可选)
- `OPENAI_API_KEY` - DeepSeek API 密钥
- `OPENAI_BASE_URL` - DeepSeek API 地址

### 生成安全密钥

使用以下命令生成安全密钥：

```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

## 📖 详细文档

- **[🚀 部署指南](./deployment.md)** - 生产环境部署说明
- **[🔧 开发指南](./development.md)** - 本地开发环境配置
- **[⚙️ 后端开发](./backend/README.md)** - 后端 API 开发文档
- **[🎨 前端开发](./frontend/README.md)** - 前端界面开发文档
- **[📋 更新日志](./release-notes.md)** - 版本更新记录

## 🛠️ 开发环境设置

### 使用 Docker Compose (推荐)

```bash
# 启动开发环境
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

### 本地开发

```bash
# 后端
cd backend
pip install -e .
uvicorn app.main:app --reload

# 前端
cd frontend
npm install
npm run dev
```

## 🧪 测试

```bash
# 后端测试
cd backend
pytest

# 前端测试
cd frontend
npm test

# E2E 测试
npm run test:e2e
```

## 📦 部署

支持多种部署方式：

- **Docker Compose** - 单机部署推荐
- **Kubernetes** - 生产集群部署
- **云平台** - 支持 AWS、阿里云、腾讯云等

详细部署说明请参考 [deployment.md](./deployment.md)

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 创建特性分支: `git checkout -b feature/amazing-feature`
3. 提交更改: `git commit -m 'Add some amazing feature'`
4. 推送分支: `git push origin feature/amazing-feature`
5. 提交 Pull Request

## 📄 许可证

本项目基于 **MIT 许可证** 开源。

## 🙏 致谢

- 感谢 [FastAPI](https://fastapi.tiangolo.com) 提供优秀的后端框架
- 感谢 [React](https://react.dev) 提供强大的前端框架
- 感谢 [DeepSeek](https://platform.deepseek.com/) 提供 AI 服务支持

---

> 💡 **提示**: 这是一个生产就绪的全栈项目模板，特别适合需要 AI 功能的中文 Web 应用开发。
