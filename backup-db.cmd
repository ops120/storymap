@echo off
chcp 65001 >nul
echo ========================================
echo 众生谱数据库备份工具
echo 作者：你们喜爱的老王
echo ========================================
echo.

if not exist storymap.db (
    echo ✗ 错误：未找到数据库文件 storymap.db
    echo.
    pause
    exit /b 1
)

echo [检查] 发现数据库文件: storymap.db
for %%A in (storymap.db) do (
    set size=%%~zA
    set /a sizeMB=!size! / 1024 / 1024
)
echo 文件大小: %size% 字节
echo.

REM 创建备份目录
if not exist backups mkdir backups

REM 生成备份文件名（带时间戳）
for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /value') do set datetime=%%I
set datetime=%datetime:~0,8%-%datetime:~8,6%
set backup_file=backups\storymap_%datetime%.db

echo [备份] 正在备份数据库...
copy storymap.db "%backup_file%" >nul

if %errorlevel% equ 0 (
    echo ✓ 备份成功！
    echo.
    echo 备份文件: %backup_file%
    echo 原始文件: storymap.db
    echo.
    echo [提示] 备份文件不会被上传到 Git
    echo        （backups/ 目录已在 .gitignore 中）
    echo.
) else (
    echo ✗ 备份失败！
    echo.
)

echo [信息] 现有备份文件：
dir /b backups\*.db 2>nul
if %errorlevel% neq 0 (
    echo   （无）
)
echo.

pause
