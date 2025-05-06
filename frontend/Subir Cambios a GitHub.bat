@echo off
cd /d "%~dp0"

echo ================================
echo Subiendo cambios del FRONTEND...
echo ================================
git add .
git commit -m "Actualización general del frontend"
git pull origin main --rebase
git push origin main
pause
