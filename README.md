# FABIANO Store

Премиальный интернет-магазин одежды FABIANO: Next.js + PostgreSQL + Prisma.

**Текущий статус:** PHASE 1 (архитектура и схема БД). План и решения — [docs/PHASE-1-ARCHITECTURE.md](docs/PHASE-1-ARCHITECTURE.md).

## Локальный запуск (по мере готовности фаз)

```bash
cp .env.example .env          # заполнить SESSION_SECRET, CART_COOKIE_SECRET
docker compose up -d          # PostgreSQL 16, MinIO, Redis
npm install
npm run db:migrate            # init + prisma/sql/001_constraints.sql
npm run db:seed
npm run dev
```

## Тесты

```bash
npm run test:db    # ограничения целостности и складская логика на PostgreSQL
npm test           # unit / integration
npm run test:e2e   # Playwright, desktop + mobile
```

## Интеграции, которые требуют настройки

| Интеграция | Переменные | Без них |
|---|---|---|
| Payme | `PAYME_MERCHANT_ID`, `PAYME_SECRET_KEY` | метод скрыт в checkout |
| Click | `CLICK_SERVICE_ID`, `CLICK_MERCHANT_ID`, `CLICK_MERCHANT_USER_ID`, `CLICK_SECRET_KEY` | метод скрыт в checkout |
| Fabiano Try-On | `FEATURE_TRY_ON`, `TRY_ON_*` + пакет SDK | кнопка TRY IT ON LIVE неактивна |
| Email | `SMTP_*` | сброс пароля и подтверждения не отправляются |
