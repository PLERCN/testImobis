# Imobis Campaign Manager

Система управления рекламными кампаниями для различных каналов коммуникации (VK, Telegram, WhatsApp, SMS).

## Технологии

- Frontend: Vue.js 3, Nuxt 3
- Backend: Node.js, Express
- База данных: PostgreSQL
- Стилизация: CSS3

## Требования

- Node.js 16+
- PostgreSQL 12+
- npm или yarn

## Установка

1. Клонируйте репозиторий.

2. Установите зависимости:
```bash
# Установка зависимостей
npm install
```

3. Создайте файл `.env`, скопировав всё из `.env.example` в корневой директории.

4. Создайте базу данных PostgreSQL, внесите данные базы данных в `.env`.

5. Инициализирейте базу данных:
```bash
npm run db:init
```

6. При ниобходимости, можно сделать миграцию:
```bash
npm run db:migrate
```

## Запуск

1. Запустите backend сервер:
```bash
npm run dev:api
```

2. В отдельном терминале запустите frontend:
```bash
npm run dev:frontend
```

Приложение будет доступно по адресу: http://localhost:3000
Бэк будет доступен по адресу: http://localhost:3001

## Структура проекта

```
├── assets/              # Статические ресурсы
│   └── css/            # CSS файлы
├── components/         # Vue компоненты
├── pages/             # Страницы приложения
├── server/            # Backend сервер
│   ├── api/          # API endpoints
│   ├── db/           # Настройки базы данных
│   └── index.js      # Точка входа сервера
└── types/            # Типы
```

## API Endpoints

### Кампании

- `GET /api/campaigns` - Получить список кампаний
- `POST /api/campaigns` - Создать новую кампанию
- `PUT /api/campaigns/:id` - Обновить кампанию
- `DELETE /api/campaigns/:id` - Удалить кампанию

## Безопасность

- Реализована защита от CSRF атак
- Настроены заголовки безопасности
- Ограничение запросов (rate limiting)
- Валидация входных данных