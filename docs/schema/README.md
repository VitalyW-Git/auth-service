# Справочник схемы БД

Содержимое этого каталога (кроме этого файла) **генерируется** из живой базы и руками не правится.
Описания колонок берутся из комментариев БД (`comment on column`), см. [ADR 0003](../adr/0003-column-comments-only.md).

## Генерация

Используется [tbls](https://github.com/k1LoW/tbls): читает базу и выдаёт markdown по таблицам с
комментариями колонок, индексами, ограничениями и ER-диаграммой.

Установка (один раз): `go install github.com/k1LoW/tbls@latest` или бинарник из релизов.

Запуск из каталога `nestjs-server` при поднятой базе с применёнными миграциями:

```bash
set -a; . ./.env; set +a
tbls doc --rm-dist \
  "postgres://$POSTGRES_USER:$POSTGRES_PASSWORD@localhost:5444/$POSTGRES_DB?sslmode=disable" \
  docs/schema
```

После генерации этот `README.md` будет перезаписан — верните его из git (`git checkout docs/schema/README.md`)
или генерируйте в подкаталог `docs/schema/generated`.

**Когда перегенерировать:** после каждой применённой миграции, в том же коммите, что и миграция.
