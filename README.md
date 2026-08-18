# Кабинет партнёра

Макет личного кабинета партнёра: вход, регистрация и API.

## Запуск

```bash
npm install
npm run dev
```

Откройте http://localhost:5173 или http://localhost:3001

- `/` — вход по телефону `+375` и коду оператора `29`, `33` или `44`
- `/register` — регистрация партнёра
- `/api/health` — проверка API

Входить можно только после регистрации. Логотип и картинки кладите в папку `image` (файл `image/logo.png` подхватится автоматически).

## GitHub Pages

Сайт: https://antonminich.github.io/lk/

В настройках репозитория: **Settings → Pages → Source: GitHub Actions**.  
Либо **Deploy from a branch**: `main` / папка `/docs`.
