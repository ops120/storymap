@echo off
echo ========================================
echo   启动众生谱前端服务
echo ========================================
echo.

cd frontend

echo 正在启动前端服务...
echo 服务地址: http://localhost:5173
echo.
echo 按 Ctrl+C 停止服务
echo.

npm run dev

pause
