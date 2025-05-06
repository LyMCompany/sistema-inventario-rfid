@echo off
cd /d "%~dp0"

echo ================================
echo Subiendo cambios del BACKEND...
echo ================================
git add .
git commit -m "Actualización general del backend"
git pull origin main --rebase
git push origin main
pause
