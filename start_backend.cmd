@echo off
echo ========================================
echo   启动众生谱后端服务
echo   Conda 环境: vevo
echo ========================================
echo.

echo 正在激活 conda 环境 vevo...
call conda activate vevo

echo.
echo 正在启动后端服务...
echo 服务地址: http://127.0.0.1:8000
echo API 文档: http://127.0.0.1:8000/docs
echo.
echo 按 Ctrl+C 停止服务
echo.

python backend/main.py

pause
