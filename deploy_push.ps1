# PowerShell скрипт для отправки на сервер деплоя
# Использование: .\deploy_push.ps1

Write-Host "Отправка на сервер деплоя..." -ForegroundColor Green

# Принудительная отправка с перезаписью удаленной ветки
git push --force deploy HEAD:refs/heads/main

Write-Host "Отправка завершена!" -ForegroundColor Green
