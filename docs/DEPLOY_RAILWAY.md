# Railway 部署指南

## 前置条件
- GitHub 账号
- Railway 账号（https://railway.app）

## 步骤

### 1. 注册 Railway 账号
前往 https://railway.app 用 GitHub 登录。

### 2. 创建项目
1. 点击 **New Project**
2. 选择 **Deploy from GitHub repo**
3. 选择 `legendfz/pickleballhq` 仓库
4. 点击 **Deploy Now**

### 3. 配置 Root Directory
1. 点击刚创建的服务
2. 进入 **Settings** → **Source**
3. 设置 **Root Directory** 为 `repo/server`
4. Railway 会自动重新部署

### 4. 添加 PostgreSQL 数据库
1. 在项目中点击 **+ New**
2. 选择 **Database** → **PostgreSQL**
3. Railway 会自动创建数据库并提供连接字符串

### 5. 设置环境变量
在服务的 **Variables** 标签页添加：

| 变量名 | 值 |
|--------|-----|
| `NODE_ENV` | `production` |
| `PORT` | `3001` |
| `DATABASE_URL` | `${{Postgres.DATABASE_URL}}`（引用 Railway PostgreSQL 的连接字符串） |
| `CORS_ORIGIN` | `https://your-app-url.com` |

> 💡 在 Railway 中，`${{Postgres.DATABASE_URL}}` 会自动引用同项目中 PostgreSQL 服务的连接字符串。

### 6. 初始化数据库
部署成功后，需要初始化数据库表：

1. 在 Railway 的服务页面，点击 **Settings** → **Deploy**
2. 在 **Deploy Hooks** 中可以设置启动命令：
   ```
   npx prisma db push && node dist/server/src/index.js
   ```
3. 或者通过 Railway CLI：
   ```bash
   npm install -g @railway/cli
   railway login
   railway link
   railway run npx prisma db push
   ```

### 7. 部署完成
- Railway 会自动分配一个 `*.up.railway.app` 域名
- 访问 `https://your-service.railway.app/api/health` 确认服务正常运行
- 可以在 **Settings** → **Networking** 中绑定自定义域名

## 常见问题

### Q: 部署失败，提示找不到 shared 模块？
确保 Root Directory 设为 `repo/server`，Dockerfile 的 build context 是 `.`（即 `repo/` 目录）。

### Q: 数据库连接失败？
确认 `DATABASE_URL` 环境变量正确引用了 Railway PostgreSQL 的连接字符串。

### Q: 如何查看日志？
在 Railway 服务页面点击 **Deployments** → 选择最新的部署 → **View Logs**。

## 成本
- Railway 提供 $5/月的免费额度
- 小型项目（<1GB 数据库 + 偶尔请求）通常在免费额度内
