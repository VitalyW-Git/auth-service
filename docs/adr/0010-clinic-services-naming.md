# 0010. Таблица услуг называется `clinic_services`

- **Статус:** принято
- **Дата:** 2026-10-11
- **Миграция:** `Migration20261011182609_RenameServicesToClinicServices`

## Контекст

Таблица услуг клиники была создана как `services`, сущность — `ServiceEntity`.

## Решение

Таблица переименована в `clinic_services`, сущность — `ClinicServiceEntity` (`clinic-service.entity.ts`).
Колонка `appointments.service_id` осталась прежней.

Причины: слово «service» в NestJS занято классами `@Injectable()` (`SessionService`, `TokenGenerationService`),
а в продукте будут и услуги самого сервиса (тариф); из имени видно, что строка принадлежит клинике.

## Последствия

Миграция переименовала таблицу, ограничения и индекс по схеме имён MikroORM и обновила комментарий
`appointments.service_id`. `doctors` и `patients` префикса не получают — их имена однозначны.

## Отвергнутые варианты

- **Откатить `ScheduleSchema` и поправить её.** Выбрана отдельная миграция переименования.
