# V-Mirror SPF 上线前 TODO

> 最后更新: 2026-01-30

---

## 🔴 Blockers (必须完成)

### 1. 数据库生产配置
- [ ] 创建 PostgreSQL 生产数据库
- [ ] 更新 `prisma/schema.prisma`:
  ```prisma
  datasource db {
    provider = "postgresql"
    url      = env("DATABASE_URL")
  }
  ```
- [ ] 运行 `prisma migrate deploy`

### 2. 更新 shopify.app.toml
- [ ] 替换 `application_url` 为正式域名
- [ ] 替换 `app_proxy.url` 为正式域名
- [ ] 更新 `auth.redirect_urls`

### 3. 配置环境变量
- [ ] `DATABASE_URL` - PostgreSQL 连接字符串
- [ ] `SHOPIFY_API_KEY` - 生产 API Key
- [ ] `SHOPIFY_API_SECRET` - 生产 API Secret
- [ ] `SHOPIFY_APP_URL` - 应用域名
- [ ] `GOOGLE_CLOUD_PROJECT` - GCP 项目 ID
- [ ] `GOOGLE_APPLICATION_CREDENTIALS` - 服务账号文件路径

---

## ✅ 已完成 (本次会话)

- [x] API Version 更新为稳定版 `2025-01`
- [x] CORS 动态白名单验证 (`getCorsHeaders`)
- [x] Usage 周期自动重置 (30天检查)
- [x] Apply Discount 二次确认弹窗
- [x] UpgradePlanModal 按钮逻辑修复 (ID比较)
- [x] 折扣确认 i18n (EN/ZH/JA/ES)

---

## 🟡 建议优化 (非阻塞)

- [ ] 生产环境使用 Redis 替代内存 Rate Limiting
- [ ] 添加更多监控 (Sentry/DataDog)
- [ ] CDN 图片压缩优化
- [ ] 添加 E2E 测试

---

## 📋 上线步骤

1. 完成所有 Blockers
2. 部署到 Staging 环境
3. 验证计费流程 (test mode)
4. 验证 Webhook 回调
5. 提交 Shopify App Review
6. 切换到 Production
