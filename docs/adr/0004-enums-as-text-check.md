# 0004. Перечисления в БД — `text` + `check`

- **Статус:** принято
- **Дата:** 2026-10-11

## Контекст

Колонки с фиксированным набором значений: `users.role`, `users.method`, `tokens.type`,
`clinic_members.role`, `appointments.status`, `appointments.source`, `appointments.cancelled_by`,
`doctor_schedule_exceptions.kind`.

## Решение

- В базе — `text` с ограничением `check ("col" in (...))`. Имя ограничения — `<table>_<col>_check`.
- В коде — TypeScript-перечисление в `domain/common/enums/` контекста и `@Enum(() => X)` в сущности.

## Последствия

- Новое значение добавляется обычной миграцией: пересоздать `check`.
- Недопустимое значение база не примет так же, как с нативным типом.

## Отвергнутые варианты

- **Нативный `create type ... as enum`.** Значение из него нельзя удалить, переименование задевает все
  таблицы; MikroORM для `@Enum` строит `text` + `check` и сверяет именно его. Нативные типы, оставшиеся от
  Prisma, удалены (см. [0002](0002-legacy-schema-alignment.md)).
