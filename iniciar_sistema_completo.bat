@echo off
start "" iniciar_backend.bat
start "" iniciar_websocket.bat
start "" iniciar_ngrok.bat
timeout /t 2 > nul
start "" actualiza_env.bat
timeout /t 3 > nul
start "" iniciar_frontend.bat
exit
