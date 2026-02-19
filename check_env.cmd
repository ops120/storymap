@echo off
echo ========================================
echo   众生谱环境检查工具
echo ========================================
echo.

echo [1/5] 检查 Conda 是否安装...
where conda >nul 2>&1
if errorlevel 1 (
    echo ❌ Conda 未安装或未添加到 PATH
    echo 请安装 Anaconda 或 Miniconda
    goto :end
) else (
    echo ✓ Conda 已安装
    conda --version
)

echo.
echo [2/5] 检查 vevo 环境是否存在...
conda env list | findstr "vevo" >nul 2>&1
if errorlevel 1 (
    echo ❌ vevo 环境不存在
    echo.
    echo 创建 vevo 环境？(Y/N)
    set /p create_env=
    if /i "%create_env%"=="Y" (
        echo 正在创建 vevo 环境...
        conda env create -f environment.yml
        if errorlevel 1 (
            echo ❌ 创建失败
            goto :end
        )
        echo ✓ vevo 环境创建成功
    ) else (
        goto :end
    )
) else (
    echo ✓ vevo 环境已存在
)

echo.
echo [3/5] 激活 vevo 环境并检查 Python...
call conda activate vevo
if errorlevel 1 (
    echo ❌ 无法激活 vevo 环境
    goto :end
) else (
    echo ✓ vevo 环境已激活
    python --version
)

echo.
echo [4/5] 检查 Python 依赖...
echo 检查 fastapi...
python -c "import fastapi; print('✓ fastapi', fastapi.__version__)" 2>nul || echo ❌ fastapi 未安装

echo 检查 uvicorn...
python -c "import uvicorn; print('✓ uvicorn', uvicorn.__version__)" 2>nul || echo ❌ uvicorn 未安装

echo 检查 openai...
python -c "import openai; print('✓ openai', openai.__version__)" 2>nul || echo ❌ openai 未安装

echo 检查 pydantic...
python -c "import pydantic; print('✓ pydantic', pydantic.__version__)" 2>nul || echo ❌ pydantic 未安装

echo.
echo [5/5] 检查 Node.js 和前端依赖...
where node >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js 未安装
) else (
    echo ✓ Node.js 已安装
    node --version
    npm --version
)

if exist "frontend\node_modules" (
    echo ✓ 前端依赖已安装
) else (
    echo ❌ 前端依赖未安装
    echo 运行 'cd frontend && npm install' 安装依赖
)

echo.
echo ========================================
echo   环境检查完成
echo ========================================
echo.
echo 如果所有检查都通过，可以运行 start.cmd 启动服务
echo.

:end
pause
