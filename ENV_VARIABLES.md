# Переменные окружения

## Настройка .env файла

Создайте файл `.env` в корне проекта со следующими переменными:

```env
# Application
APPLICATION_PORT=4200
ALLOWED_ORIGIN=http://localhost:3000

# PostgreSQL Database
POSTGRES_DB=auth_db
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres

# Redis
REDIS_HOST=localhost
REDIS_PORT=6381
REDIS_USER=default
REDIS_PASSWORD=pass123456

# Session
SESSION_SECRET=your-session-secret-key-here
SESSION_NAME=session_id
SESSION_DOMAIN=localhost
SESSION_MAX_AGE=7d
SESSION_HTTP_ONLY=true
SESSION_SECURE=false
SESSION_FOLDER=sessions:

# Cookies
COOKIES_SECRET=your-cookies-secret-key-here

# Mail (для отправки email)
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=your-email@gmail.com
MAIL_PASSWORD=your-app-password
MAIL_FROM=noreply@yourapp.com

# OAuth Providers
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:4200/auth/oauth/callback/google

YANDEX_CLIENT_ID=your-yandex-client-id
YANDEX_CLIENT_SECRET=your-yandex-client-secret
YANDEX_CALLBACK_URL=http://localhost:4200/auth/oauth/callback/yandex

# Google reCAPTCHA
RECAPTCHA_SECRET_KEY=your-recaptcha-secret-key
```

## Важные замечания

### PostgreSQL и Redis конфигурация

После миграции на MikroORM проект использует **отдельные переменные** для настройки подключений:

**PostgreSQL:**
- `POSTGRES_DB` - имя базы данных
- `POSTGRES_HOST` - хост БД
- `POSTGRES_PORT` - порт БД
- `POSTGRES_USER` - пользователь
- `POSTGRES_PASSWORD` - пароль

**Redis:**
- `REDIS_HOST` - хост Redis
- `REDIS_PORT` - порт Redis  
- `REDIS_USER` - пользователь (опционально)
- `REDIS_PASSWORD` - пароль

### ⚠️ Интерполяция переменных НЕ работает

В файле `.env` **НЕ** используйте синтаксис подстановки переменных:

```env
# ❌ НЕПРАВИЛЬНО - не будет работать
REDIS_URI='redis://${REDIS_USER}:${REDIS_PASSWORD}@${REDIS_HOST}:${REDIS_PORT}'
POSTGRES_URI='postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${POSTGRES_HOST}:${POSTGRES_PORT}/${POSTGRES_DB}'

# ✅ ПРАВИЛЬНО - используйте конкретные значения
REDIS_HOST=localhost
REDIS_PORT=6381
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
```

Конфигурация подключений собирается программно в `src/main.ts` (для Redis) и `src/database/database.module.ts` (для PostgreSQL).

## Обязательные переменные

Минимальный набор для запуска приложения:

1. **База данных:** `POSTGRES_*` переменные
2. **Redis:** `REDIS_*` переменные
3. **Session:** `SESSION_SECRET`, `SESSION_NAME`
4. **Cookies:** `COOKIES_SECRET`
5. **Application:** `APPLICATION_PORT`, `ALLOWED_ORIGIN`

## Опциональные переменные

Для полной функциональности:

- **Mail** - для отправки email подтверждений и 2FA кодов
- **OAuth** - для входа через Google/Yandex
- **reCAPTCHA** - для защиты от ботов

