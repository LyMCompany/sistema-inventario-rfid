@echo off
cd /d "%~dp0"

echo ================================
echo Subiendo cambios del BACKEND...
echo ================================

REM Agrega y guarda todos los cambios
git add .
git commit -m "Actualización general del backend"

REM Trae cambios remotos antes de subir (resuelve conflictos si hay)
git pull origin main --rebase

REM Sube los cambios al repositorio
git push origin main

pause
