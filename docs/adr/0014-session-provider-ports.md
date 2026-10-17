# 0014. Сессия и OAuth-провайдер за доменными портами

- **Статус:** принято
- **Дата:** 2026-10-18

## Контекст

Репозитории и внешние сервисы в auth-контексте внедряются через строковые DI-токены и доменные
интерфейсы (`TokenRepositoryInterface`, `SmsSenderInterface` из [ADR 0013](0013-sms-ru-provider.md),
`TokenHasherInterface`). Но `SessionService` и `ProviderService` обработчики команд, контроллер и
`AuthProviderGuard` внедряли как **конкретные классы из `infrastructure/`**. Это зависимость слоёв
`application` / `presentation` наружу, в обход домена, — нарушение правила направления зависимостей
при том, что для остальной инфраструктуры порты уже были.

## Решение

- **Порты в `domain/common/interfaces/`:**
  - `SessionServiceInterface` — `saveSession`, `destroyUserSessions`. Тип `express.Request` в сигнатуре
    оставлен осознанно: сессия привязана к HTTP-запросу, а адаптер живёт в `infrastructure/session/`.
  - `ProviderServiceInterface` — `findByService(service): OAuthProviderInterface | null`.
  - `OAuthProviderInterface` — `getAuthUrl`, `findUserByCode`; описывает один OAuth-провайдер для
    `application` / `presentation`.
  - `OAuthUserInfoInterface` — нормализованный профиль, контракт границы. Прежний
    `infrastructure/.../types/user-info.types.ts` (`TypeUserInfo`) удалён; сырые формы ответов
    (`GoogleProfile`, `YandexProfile`) остаются в `infrastructure/`.
- **Адаптеры реализуют порты:** `SessionService implements SessionServiceInterface`,
  `ProviderService implements ProviderServiceInterface`, `BaseOAuthService implements OAuthProviderInterface`.
- **Проводка строковыми токенами:** `'SessionServiceInterface'` (`useClass` в `AuthModule`) и
  `'ProviderServiceInterface'` (`useExisting: ProviderService` в `ProviderModule`, чтобы сохранить
  `OnModuleInit`; наружу экспортируется только токен). Потребители внедряют через `@Inject('...')`
  с типом-интерфейсом.

## Последствия

- `application` и `presentation` больше не импортируют конкретные `SessionService` / `ProviderService`
  из `infrastructure/`; направление зависимостей выдержано для всей инфраструктуры auth.
- Новый OAuth-провайдер или другая реализация сессии подключается заменой адаптера под токеном, без
  правок обработчиков.
- Остаточная связность: `SessionServiceInterface` ссылается на `express.Request`. Полностью развязать
  — отдельная задача (абстрагировать источник сессии от HTTP), пока не оправдано.

## Отвергнутые варианты

- **Оставить как есть.** Рабочее, но непоследовательно: часть инфраструктуры за портами, часть — нет.
- **Вернуть `TypeUserInfo` в `infrastructure/` и возвращать его из порта.** Порт в домене тянул бы
  инфраструктурный тип — та же протечка, только в типах.
