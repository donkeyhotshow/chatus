# Удаление и безопасное хранение секретов

Этот документ описывает безопасную замену секретов, которые сейчас ошибочно присутствуют в репозитории (например, `studio-...-firebase-adminsdk-*.json`).

1) Немедленное действие (локально)
```bash
# Удалить файл из репозитория, но оставить локально
git rm --cached studio-*-firebase-adminsdk-*.json
echo "studio-*-firebase-adminsdk-*.json" >> .gitignore
git commit -m "chore: remove service account json from repo and ignore"
```

2) Удаление из истории Git (опционально, выполняется отдельно и аккуратно)
- Рекомендуемый инструмент: BFG Repo-Cleaner (https://rtyley.github.io/bfg-repo-cleaner/)

Пример (BFG):
```bash
# Сначала сделайте безопасную резервную копию репозитория
git clone --mirror git@github.com:your/repo.git repo.git
java -jar bfg.jar --delete-files 'studio-*-firebase-adminsdk-*.json' repo.git
cd repo.git
git reflog expire --expire=now --all && git gc --prune=now --aggressive
git push
```

Или используя git filter-repo (альтернатива):
```bash
git filter-repo --invert-paths --path studio-*-firebase-adminsdk-*.json
```

3) Хранение секретов
- Firebase service account JSON — сохранить в GitHub Secrets (Actions) или в Vercel environment (если требуется для runtime).
- Никогда не включать JSON в PR/issue/commit.

4) Настройка GitHub Actions / Vercel
- Поместите содержимое JSON в GitHub Secret `FIREBASE_SERVICE_ACCOUNT` (строка JSON), затем в workflow декодируйте в рантайме.

Пример использования в workflow:
```yaml
env:
  FIREBASE_SERVICE_ACCOUNT: ${{ secrets.FIREBASE_SERVICE_ACCOUNT }}
steps:
  - name: Write firebase service account
    run: echo "$FIREBASE_SERVICE_ACCOUNT" > service-account.json
```

5) Проверка
- Убедитесь, что секрет больше не доступен в истории коммитов (grep).


