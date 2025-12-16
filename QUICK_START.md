## Запуск проекта

1. Установить зависимости:
```bash
npm install
```

2. Применить миграции:
```bash
npm run migration:up
```

3. Запустить в режиме разработки:
```bash
npm run start:dev
```

# MailHog (для тестирования email)
docker run -d -p 1025:1025 -p 8025:8025 mailhog/mailhog
# Web UI: http://localhost:8025/