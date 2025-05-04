@echo off
cd /d "D:\Sistema Inventario RFID"

:: Descargar JSON desde la API local de Ngrok
curl -s http://127.0.0.1:4040/api/tunnels > ngrok_api.json

:: Usar PowerShell para leer y extraer el public_url
for /f "delims=" %%i in ('powershell -Command "(Get-Content ngrok_api.json | ConvertFrom-Json).tunnels[0].public_url"') do (
    set "NGROK_URL=%%i"
)

:: Validar que obtuvimos la URL
if "%NGROK_URL%"=="" (
    echo ❌ No se pudo obtener la URL pública de Ngrok.
    pause
    exit /b 1
)

:: Guardar en .env
(
    echo REACT_APP_API_URL=%NGROK_URL%
    echo PORT=3000
) > "D:\Sistema Inventario RFID\frontend\.env"

echo Direccion actualizada correctamente: %NGROK_URL%
exit
