# Архитектура проекта

## Обзор

Проект построен на основе принципов **Clean Architecture**, **Domain-Driven Design (DDD)** и **CQRS (Command Query Responsibility Segregation)** с использованием фреймворка **NestJS**.

Архитектура обеспечивает:
- Разделение ответственности между слоями
- Независимость бизнес-логики от инфраструктуры
- Масштабируемость и поддерживаемость кода
- Тестируемость компонентов

## Структура каталогов

```
src/
├── main.ts                    # Точка входа приложения
├── app.module.ts              # Корневой модуль приложения
├── modules/                   # Бизнес-модули (DDD структура)
│   └── user/                  # Модуль управления пользователями
├── auth/                      # Модуль аутентификации и авторизации
├── database/                  # Модуль работы с базой данных
├── config/                    # Конфигурационные файлы
└── libs/                      # Общие библиотеки и утилиты
```

---

## 1. Корневой уровень (`src/`)

### `main.ts`
**Назначение:** Точка входа приложения, инициализация NestJS приложения.

**Содержит:**
- Создание экземпляра приложения
- Настройка глобальных pipes (валидация)
- Настройка middleware (cookie-parser, session)
- Настройка CORS
- Запуск сервера

### `app.module.ts`
**Назначение:** Корневой модуль, объединяющий все модули приложения.

**Импортирует:**
- `ConfigModule` - глобальная конфигурация
- `DatabaseModule` - модуль базы данных
- `SessionModule` - модуль сессий
- `AuthModule` - модуль аутентификации
- `UserModule` - модуль пользователей (DDD)
- `ProviderModule` - модуль OAuth провайдеров
- `MailModule` - модуль отправки email
- `EmailConfirmationModule` - модуль подтверждения email
- `PasswordRecoveryModule` - модуль восстановления пароля
- `TwoFactorAuthModule` - модуль двухфакторной аутентификации

---

## 2. Модули (`src/modules/`)

### `modules/user/` - Модуль управления пользователями (DDD)

Модуль реализован по принципам **Domain-Driven Design** и разделен на четыре слоя:

#### Структура модуля:

```
modules/user/
├── domain/                    # Доменный слой (бизнес-логика)
│   ├── entities/             # Доменные сущности
│   ├── value-objects/        # Объекты-значения
│   ├── domain-events/        # Доменные события
│   └── repository-interfaces/ # Интерфейсы репозиториев
├── application/              # Слой приложения (use cases)
│   ├── commands/             # Команды (изменение состояния)
│   └── queries/              # Запросы (чтение данных)
├── infrastructure/           # Инфраструктурный слой
│   ├── persistence/          # ORM сущности
│   └── repositories/         # Реализации репозиториев
├── presentation/             # Слой представления
│   ├── controllers/          # HTTP контроллеры
│   └── dto/                  # Data Transfer Objects
└── user.module.ts            # Модуль NestJS
```

#### 2.1. Domain Layer (`domain/`)

**Назначение:** Содержит чистую бизнес-логику, независимую от фреймворков и инфраструктуры.

##### `domain/entities/user.entity.ts`
**Назначение:** Доменная сущность пользователя.

**Особенности:**
- Наследуется от `AggregateRoot` (CQRS)
- Инкапсулирует бизнес-правила
- Содержит методы для изменения состояния (verify, updateEmail, enableTwoFactor и т.д.)
- Использует value objects для валидации данных
- Публикует domain events через метод `apply()`

**Методы:**
- `create()` - фабричный метод для создания нового пользователя
- `restore()` - восстановление сущности из персистентного хранилища
- `verify()` - подтверждение email пользователя
- `updateEmail()` - обновление email
- `updateDisplayName()` - обновление имени
- `enableTwoFactor()` / `disableTwoFactor()` - управление 2FA
- `updatePassword()` - обновление пароля

##### `domain/value-objects/`
**Назначение:** Объекты-значения, инкапсулирующие валидацию и бизнес-правила.

**Файлы:**
- `user-email.value-object.ts` - валидация email адреса
- `password.value-object.ts` - инкапсуляция пароля (хэшированного)

**Особенности:**
- Неизменяемые (immutable)
- Содержат валидацию при создании
- Реализуют метод `equals()` для сравнения

##### `domain/domain-events/`
**Назначение:** События, представляющие важные изменения в домене.

**Файлы:**
- `user-created.event.ts` - событие создания пользователя
- `user-verified.event.ts` - событие подтверждения email

**Использование:**
- Публикуются через `AggregateRoot.apply()`
- Обрабатываются event handlers в application слое
- Используются для side effects (отправка email, логирование и т.д.)

##### `domain/repository-interfaces/user.repository.interface.ts`
**Назначение:** Интерфейс репозитория, определяющий контракт для работы с пользователями.

**Методы:**
- `findById(id: string)` - поиск по ID
- `findByEmail(email: string)` - поиск по email
- `save(user: User)` - сохранение пользователя

**Принцип:** Зависимость от абстракций, а не от конкретных реализаций (Dependency Inversion Principle).

#### 2.2. Application Layer (`application/`)

**Назначение:** Координирует выполнение use cases, не содержит бизнес-логики.

##### `application/commands/`
**Назначение:** Команды для изменения состояния системы.

**Структура:**
```
commands/
├── create-user.command.ts
├── update-user.command.ts
├── verify-user.command.ts
└── handlers/
    ├── create-user.handler.ts
    ├── update-user.handler.ts
    └── verify-user.handler.ts
```

**Команды:**
- `CreateUserCommand` - создание нового пользователя
- `UpdateUserCommand` - обновление данных пользователя
- `VerifyUserCommand` - подтверждение email пользователя

**Handlers:**
- Реализуют интерфейс `ICommandHandler<TCommand>`
- Загружают агрегат через репозиторий
- Вызывают методы доменной сущности
- Сохраняют изменения через репозиторий
- Публикуют domain events через EventPublisher

##### `application/queries/`
**Назначение:** Запросы для чтения данных без изменения состояния.

**Структура:**
```
queries/
├── get-user.query.ts
├── get-user-by-email.query.ts
└── handlers/
    ├── get-user.handler.ts
    └── get-user-by-email.handler.ts
```

**Queries:**
- `GetUserQuery` - получение пользователя по ID
- `GetUserByEmailQuery` - получение пользователя по email

**Handlers:**
- Реализуют интерфейс `IQueryHandler<TQuery>`
- Возвращают DTO, а не доменные сущности
- Не изменяют состояние системы

#### 2.3. Infrastructure Layer (`infrastructure/`)

**Назначение:** Реализация технических деталей (база данных, внешние сервисы).

##### `infrastructure/persistence/entities/user.entity.ts`
**Назначение:** ORM сущность для MikroORM.

**Особенности:**
- Отделена от доменной сущности
- Содержит декораторы MikroORM (`@Entity`, `@Property`, `@PrimaryKey`)
- Используется только для маппинга в БД
- Не содержит бизнес-логики

##### `infrastructure/repositories/user.repository.ts`
**Назначение:** Реализация интерфейса `IUserRepository`.

**Функции:**
- Маппинг между ORM сущностями и доменными сущностями
- Реализация методов `findById`, `findByEmail`, `save`
- Можно будет добавить`EventPublisher`
- Работа с EntityManager MikroORM

**Методы маппинга:**
- `toDomain()` - преобразование ORM entity → Domain entity
- `toEntity()` - преобразование Domain entity → ORM entity
- `updateEntity()` - обновление существующей ORM entity

#### 2.4. Presentation Layer (`presentation/`)

**Назначение:** Обработка HTTP запросов и формирование ответов.

##### `presentation/controllers/user.controller.ts`
**Назначение:** HTTP контроллер для работы с пользователями.

**Особенности:**
- Использует `CommandBus` и `QueryBus` вместо прямого вызова сервисов
- Не содержит бизнес-логики
- Только маршрутизация и валидация входных данных

**Endpoints:**
- `GET /users/profile` - получение профиля текущего пользователя
- `GET /users/by-id/:id` - получение пользователя по ID (только для админов)
- `PATCH /users/profile` - обновление профиля пользователя

##### `presentation/dto/update-user.dto.ts`
**Назначение:** Data Transfer Object для обновления пользователя.

**Особенности:**
- Валидация через `class-validator`
- Используется только на уровне presentation
- Не проникает в domain слой

---

## 3. Модуль аутентификации (`src/auth/`)

**Назначение:** Управление аутентификацией, авторизацией и связанными процессами. Нужно ПЕРЕДЕЛАТЬ на DDD CQRS

### Структура:

```
auth/
├── auth.module.ts            # Главный модуль аутентификации
├── auth.controller.ts        # Контроллер аутентификации
├── auth.service.ts           # Сервис аутентификации
├── decorators/              # Декораторы для авторизации
├── dto/                     # DTO для аутентификации
├── guards/                  # Guards для защиты маршрутов
├── email-confirmation/      # Подтверждение email
├── password-recovery/       # Восстановление пароля
├── provider/                # OAuth провайдеры
└── two-factor-auth/         # Двухфакторная аутентификация
```

### `auth.service.ts`
**Назначение:** Основной сервис аутентификации.

**Функции:**
- Регистрация пользователей (`register()`)
- Вход в систему (`login()`)
- OAuth аутентификация (`extractProfileFromCode()`)
- Выход из системы (`logout()`)
- Управление сессиями (`saveSession()`)

**Особенности:**
- Использует `CommandBus` и `QueryBus` для работы с пользователями
- Интегрирован с модулями email-confirmation и two-factor-auth

### `guards/`
**Назначение:** Защита маршрутов и проверка прав доступа.

**Guards:**
- `auth.guard.ts` - проверка аутентификации пользователя
- `roles.guard.ts` - проверка ролей пользователя
- `provider.guard.ts` - валидация OAuth провайдеров

### `decorators/`
**Назначение:** Декораторы для упрощения работы с авторизацией.

**Декораторы:**
- `@Authorization()` - проверка авторизации
- `@Authorized()` - получение данных текущего пользователя
- `@Roles()` - проверка ролей

### Подмодули:

#### `email-confirmation/`
**Назначение:** Подтверждение email адреса пользователя.

**Компоненты:**
- `EmailConfirmationService` - генерация и валидация токенов
- `EmailConfirmationController` - обработка HTTP запросов
- Использует `VerifyUserCommand` для подтверждения пользователя

#### `password-recovery/`
**Назначение:** Восстановление забытого пароля.

**Компоненты:**
- `PasswordRecoveryService` - генерация токенов восстановления
- `PasswordRecoveryController` - обработка запросов
- Использует `GetUserByEmailQuery` и `IUserRepository`

#### `provider/`
**Назначение:** Интеграция с OAuth провайдерами (Google, Yandex).

**Структура:**
```
provider/
├── provider.service.ts       # Основной сервис
├── services/
│   ├── base-oauth.service.ts # Базовый класс для OAuth
│   ├── google.provider.ts    # Google OAuth
│   └── yandex.provider.ts    # Yandex OAuth
└── types/                    # Типы для OAuth
```

#### `two-factor-auth/`
**Назначение:** Двухфакторная аутентификация через email.

**Компоненты:**
- `TwoFactorAuthService` - генерация и валидация 2FA кодов
- Интегрирован с процессом входа в систему

---

## 4. Модуль базы данных (`src/database/`)

**Назначение:** Конфигурация и работа с базой данных. Будет разбита на модули.

### Структура:

```
database/
├── database.module.ts        # Модуль базы данных
├── entities/                 # Общие ORM сущности
├── enums/                    # Перечисления
└── migrations/               # Миграции базы данных
```

### `database.module.ts`
**Назначение:** Настройка MikroORM.

**Функции:**
- Инициализация подключения к PostgreSQL
- Регистрация entities
- Настройка миграций

### `entities/`
**Назначение:** Общие ORM сущности, используемые несколькими модулями.

**Сущности:**
- `user.entity.ts` - сущность пользователя (legacy, используется в auth)
- `account.entity.ts` - сущность OAuth аккаунта
- `token.entity.ts` - сущность токенов (email confirmation, password recovery)

**Примечание:** В DDD модуле `modules/user/` используется отдельная ORM сущность в `infrastructure/persistence/`.

### `enums/`
**Назначение:** Перечисления для типизации.

**Enums:**
- `user-role.enum.ts` - роли пользователей (REGULAR, ADMIN)
- `auth-method.enum.ts` - методы аутентификации (CREDENTIALS, GOOGLE, YANDEX)
- `token-type.enum.ts` - типы токенов (VERIFICATION, PASSWORD_RESET, TWO_FACTOR)

### `migrations/`
**Назначение:** Миграции базы данных.

**Использование:**
- Создание: `npm run migration:create`
- Применение: `npm run migration:up`
- Откат: `npm run migration:down`

---

## 5. Конфигурация (`src/config/`)

**Назначение:** Конфигурационные файлы для различных модулей.

### Файлы:

- `mikro-orm.config.ts` - конфигурация MikroORM
- `mailer.config.ts` - конфигурация отправки email
- `redis.config.ts` - конфигурация Redis
- `session.config.ts` - конфигурация сессий
- `providers.config.ts` - конфигурация OAuth провайдеров
- `recaptcha.config.ts` - конфигурация Google reCAPTCHA

**Особенности:**
- Используют `ConfigService` для получения переменных окружения
- Экспортируются как factory функции для async модулей

---

## 6. Общие библиотеки (`src/libs/`)

**Назначение:** Переиспользуемые компоненты и утилиты.

### Структура:

```
libs/
├── common/                   # Общие утилиты
│   ├── decorators/          # Кастомные декораторы валидации
│   └── utils/               # Утилитарные функции
├── mail/                    # Модуль отправки email
└── session/                 # Модуль управления сессиями
```

### `libs/common/`
**Назначение:** Общие утилиты и декораторы.

**Компоненты:**
- `is-passwords-matching-constraint.decorator.ts` - валидация совпадения паролей
- `is-dev.util.ts` - проверка окружения разработки
- `ms.util.ts` - конвертация времени
- `parse-boolean.util.ts` - парсинг булевых значений

### `libs/mail/`
**Назначение:** Отправка email сообщений.

**Компоненты:**
- `mail.service.ts` - сервис отправки email
- `mail.module.ts` - модуль NestJS
- `templates/` - React Email шаблоны:
  - `confirmation.template.tsx` - подтверждение email
  - `reset-password.template.tsx` - восстановление пароля
  - `two-factor-auth.template.tsx` - код 2FA

### `libs/session/`
**Назначение:** Управление сессиями через Redis.

**Компоненты:**
- `session.module.ts` - модуль сессий
- `session.middleware.ts` - middleware для обработки сессий
- Использует `connect-redis` и `express-session`

---

## Принципы архитектуры будущей реализации

### 1. Clean Architecture

Проект следует принципам Clean Architecture с разделением на слои:

1. **Domain Layer** - чистая бизнес-логика, без зависимостей
2. **Application Layer** - use cases и координация
3. **Infrastructure Layer** - технические детали (БД, внешние API)
4. **Presentation Layer** - интерфейсы (HTTP, CLI и т.д.)

**Правило зависимостей:** Внешние слои зависят от внутренних, но не наоборот.

### 2. Domain-Driven Design (DDD)

- **Aggregates** - `User` как агрегат с четкими границами
- **Value Objects** - `UserEmail`, `Password` для инкапсуляции валидации
- **Domain Events** - события для асинхронной обработки
- **Repository Pattern** - абстракция доступа к данным

### 3. CQRS (Command Query Responsibility Segregation)

- **Commands** - изменение состояния (CreateUser, UpdateUser)
- **Queries** - чтение данных (GetUser, GetUserByEmail)
- Разделение ответственности между запись и чтение

### 4. SOLID Principles

- **Single Responsibility** - каждый класс имеет одну ответственность
- **Open/Closed** - открыт для расширения, закрыт для модификации
- **Liskov Substitution** - подтипы заменяемы базовыми типами
- **Interface Segregation** - маленькие, специфичные интерфейсы
- **Dependency Inversion** - зависимость от абстракций

---

## Зависимости между модулями

```
AppModule
├── DatabaseModule (инфраструктура)
├── SessionModule (инфраструктура)
├── MailModule (инфраструктура)
├── UserModule (DDD модуль)
│   └── Используется AuthModule
├── AuthModule
│   ├── EmailConfirmationModule
│   ├── PasswordRecoveryModule
│   ├── TwoFactorAuthModule
│   └── ProviderModule
└── ConfigModule (глобальный)
```

**Правило:** Модули верхнего уровня могут зависеть от нижних, но не наоборот.

---
## Миграция и развитие

### Добавление нового функционала

1. **Новая команда/запрос:**
   - Создать command/query в `application/`
   - Создать handler в `application/.../handlers/`
   - Зарегистрировать в модуле

2. **Новая доменная логика:**
   - Добавить методы в domain entity
   - Создать value objects при необходимости
   - Добавить domain events

3. **Новый endpoint:**
   - Добавить метод в controller
   - Использовать CommandBus/QueryBus
   - Добавить DTO для валидации

---

## Заключение

Архитектура проекта обеспечивает:
- ✅ Четкое разделение ответственности
- ✅ Независимость бизнес-логики от инфраструктуры
- ✅ Масштабируемость
- ✅ Поддерживаемость кода


