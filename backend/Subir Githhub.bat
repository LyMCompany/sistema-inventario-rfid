@echo off
cd /d "%~dp0"
echo ===========================
echo SUBIENDO CAMBIOS BACKEND
echo ===========================
git add .
git commit -m "Actualización backend automática desde script"
git push origin main
pause
