@echo off
cd /d "%~dp0"
echo ===========================
echo SUBIENDO CAMBIOS A GITHUB
echo ===========================
git add .
git commit -m "Actualización automática desde script"
git push origin main
pause
