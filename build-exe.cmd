@echo off
chcp 65001 > nul
echo ========================================
echo 众生谱 EXE 打包脚本 v1.0
echo ========================================
echo.

echo 检查环境...
where conda >nul 2>&1
if errorlevel 1 (
    echo 错误: 未找到 Conda，请先安装 Anaconda 或 Miniconda
    pause
    exit /b 1
)

where npm >nul 2>&1
if errorlevel 1 (
    echo 错误: 未找到 npm，请先安装 Node.js
    pause
    exit /b 1
)

echo.
echo [1/6] 激活 Conda 环境...
call conda activate vevo
if errorlevel 1 (
    echo 错误: 无法激活 vevo 环境
    echo 请先运行: conda env create -f environment.yml
    pause
    exit /b 1
)

echo.
echo [2/6] 安装打包工具...
pip show pyinstaller >nul 2>&1
if errorlevel 1 (
    echo 安装 PyInstaller...
    pip install pyinstaller
)

echo.
echo [3/6] 打包后端...
cd backend
if not exist main.spec (
    echo 创建 PyInstaller 配置文件...
    pyinstaller --name=storymap-backend --onefile --noconsole main.py
) else (
    pyinstaller main.spec --clean
)
if errorlevel 1 (
    echo 错误: 后端打包失败
    cd ..
    pause
    exit /b 1
)
cd ..

echo.
echo [4/6] 构建前端...
cd frontend
call npm run build
if errorlevel 1 (
    echo 错误: 前端构建失败
    cd ..
    pause
    exit /b 1
)
cd ..

echo.
echo [5/6] 组织文件结构...
if exist electron-build (
    echo 清理旧的构建目录...
    rmdir /s /q electron-build
)
mkdir electron-build

echo 复制 Electron 文件...
if exist electron (
    xcopy /E /I /Y electron electron-build
) else (
    echo 警告: electron 目录不存在，请先创建 Electron 项目
    echo 参考: 打包为EXE指南.md
)

echo 复制前端构建产物...
xcopy /E /I /Y frontend\dist electron-build\frontend

echo 复制后端可执行文件...
mkdir electron-build\backend
copy backend\dist\storymap-backend.exe electron-build\backend\

echo.
echo [6/6] 打包 Electron 应用...
cd electron-build
if exist package.json (
    call npm install
    call npm run build
    if errorlevel 1 (
        echo 错误: Electron 打包失败
        cd ..
        pause
        exit /b 1
    )
) else (
    echo 警告: 未找到 package.json，跳过 Electron 打包
    echo 请先创建 Electron 项目，参考: 打包为EXE指南.md
)
cd ..

echo.
echo ========================================
echo 打包完成！
echo ========================================
echo.
echo 输出文件:
if exist electron-build\dist (
    dir /B electron-build\dist\*.exe
    echo.
    echo 位置: electron-build\dist\
) else (
    echo 后端可执行文件: backend\dist\storymap-backend.exe
    echo 前端构建产物: frontend\dist\
    echo.
    echo 注意: 需要创建 Electron 项目才能生成最终的 EXE
    echo 请参考: 打包为EXE指南.md
)
echo.
echo ========================================
pause
