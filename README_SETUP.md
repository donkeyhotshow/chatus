Локальная подготовка окружения — краткая инструкция

1) Проверка окружения
- Убедитесь, что Node.js >=20, npm установлен.
- Если есть backend на Python — Python >=3.11.

Требования к версиям:
- Node.js: 20.x или новее
- npm: актуальная стабильная версия
- Python (опционально, backend): 3.11 или новее
Интерактивное создание `.env.local`
- Скрипты `scripts/setup.sh` и `scripts/setup.ps1` предложат интерактивно создать `.env.local`, если файла нет.
- По умолчанию будут подставлены локальные значения (ws://localhost:3001, http://localhost:8000); вы можете ввести свои.
- Скрипты верифицируют базовый формат URL и предупредят при подозрительных значениях.
- Файл создаётся с правами, ограничивающими доступ (POSIX: chmod 600), и скрипты напоминают не коммитить `.env.local`.

2) Запуск скриптов
- Unix (macOS / Linux / WSL): `bash scripts/setup.sh`
- Windows PowerShell (администратор/обычный): `.\scripts\setup.ps1`

3) Файлы env
- Пример: `docs/ENV_LOCAL_EXAMPLE.md`. Скопируйте содержимое в `.env.local` и заполните реальные значения.
- Никогда не добавляйте реальные секреты в VCS.

4) Проверка портов
- Проверьте, что порты `3000` (фронтенд) и `8000` (backend) свободны:
- Unix: `lsof -i :3000 || lsof -i :8000` или `ss -ltnp | grep :3000`
- Windows PowerShell: `netstat -ano | findstr :3000`

5) Сборка
- Перед деплоем или проверкой production-like сборки выполните:
- `npm run build`
- Для `functions` (если есть): `cd functions && npm run build && cd ..`

4) Запуск приложений
- Фронтенд: `npm run dev` (http://localhost:3000)
- Backend (если есть): создать и активировать `.venv`, `pip install -r requirements.txt`, затем `uvicorn server_coop_puzzle:app --reload --port 8000` (http://localhost:8000/docs)

5) Тесты
- Unit: `npm run test:unit` (если есть)
- Интеграционные: `npx vitest run tests/integration --run`

6) Проверки WebSocket
- Откройте `public/coop/*.html` и мониторьте WS в DevTools → Network → WS.

Если нужна автоматизация через Docker Compose — могу подготовить экспериментальный `docker-compose.yml` и инструкцию отдельно.


