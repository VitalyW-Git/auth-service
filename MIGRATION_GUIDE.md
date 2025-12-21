### 1. Установлены пакеты MikroORM
- `@mikro-orm/core` - основной пакет
- `@mikro-orm/nestjs` - интеграция с NestJS
- `@mikro-orm/postgresql` - драйвер PostgreSQL
- `@mikro-orm/migrations` - поддержка миграций
- `@mikro-orm/cli` - CLI инструменты

### 2. Созданы Entity классы
Все Prisma модели преобразованы в MikroORM entities:
- `src/database/entities/user.entity.ts` - сущность пользователя
- `src/database/entities/account.entity.ts` - сущность аккаунта OAuth
- `src/database/entities/token.entity.ts` - сущность токенов

### 3. Созданы Enum файлы
- `src/database/enums/user-role.enum.ts` - роли пользователей
- `src/database/enums/auth-method.enum.ts` - методы аутентификации
- `src/database/enums/token-type.enum.ts` - типы токенов

### 4. Конфигурация MikroORM
- `src/config/mikro-orm.config.ts` - конфигурация для CLI
- `src/database/database.module.ts` - модуль NestJS с MikroORM:
  - Используется `driver: PostgreSqlDriver` (в v6 вместо `type`)
  - EntityManager доступен глобально после инициализации

## Unit of Work
MikroORM использует паттерн Unit of Work. Это значит:
- Изменения накапливаются в памяти
- `flush()` синхронизирует изменения с БД
- `persistAndFlush()` добавляет сущность и сразу сохраняет
- `removeAndFlush()` удаляет сущность и сразу сохраняет

**Важно:**
- Опция `type: 'postgresql'` удалена в v6, используйте `driver: PostgreSqlDriver`
- Регистрируйте entities только один раз (либо в root, либо через forFeature, но не оба)
- В данном проекте entities регистрируются в root конфигурации
- После вызова `forRootAsync()` EntityManager доступен для инъекции во все сервисы без необходимости экспорта модуля

## Команды для работы с миграциями

### Создание миграции

```bash
# Создать миграцию на основе изменений в Entity (автоматически определяет различия)
npm run migration:create

# Создать миграцию с указанным названием (только если есть изменения в схеме)
npm run migration:create -- --name=AddProductTable
npm run migration:create -- --n AddProductTable

# Создать пустую миграцию с указанным названием (даже если нет изменений)
npm run migration:create -- --blank --name=CustomMigration
npm run migration:create -- -b -n CustomMigration
```

Файл миграции будет создан с именем вида: `Migration20251215222808_AddProductTable.ts`

### Применение и управление миграциями

```bash
# Проверить различия между Entity и схемой БД
npm run migration:check

# Показать список всех миграций
npm run migration:list

# Показать список ожидающих миграций
npm run migration:pending

# Применить все ожидающие миграции
npm run migration:up

# Откатить последнюю примененную миграцию
npm run migration:down

# Пересоздать БД и применить все миграции (удалит все данные!)
npm run migration:fresh

# Удалить схему БД (удалит все таблицы!)
npm run schema:drop
```