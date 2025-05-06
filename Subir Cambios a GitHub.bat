@echo off
echo ===============================
echo Subiendo cambios del FRONTEND...
echo ===============================
cd frontend
git add .
git commit -m "🔒 Cambios de seguridad"
git push origin main
cd ..

echo ===============================
echo Subiendo cambios del BACKEND...
echo ===============================
cd backend
git add -A
git commit -m "🔒 Cambios de seguridad"
git push origin main
cd ..

echo ===============================
echo ✅ Cambios subidos con éxito
pause
