@echo off
chcp 65001 >nul
echo ========================================
echo 众生谱发布前检查工具
echo 作者：你们喜爱的老王
echo ========================================
echo.

set error_count=0

echo [1/6] 检查 .gitignore 配置...
if exist .gitignore (
    findstr /C:"storymap.db" .gitignore >nul
    if %errorlevel% equ 0 (
        echo ✓ .gitignore 已配置数据库忽略
    ) else (
        echo ✗ .gitignore 未配置数据库忽略
        set /a error_count+=1
    )
) else (
    echo ✗ .gitignore 文件不存在
    set /a error_count+=1
)
echo.

echo [2/6] 检查数据库文件...
if exist storymap.db (
    echo ⚠ 发现数据库文件: storymap.db
    echo   提示：该文件不应上传到 Git
    
    git ls-files storymap.db >nul 2>&1
    if %errorlevel% equ 0 (
        echo ✗ 警告：数据库文件已被 Git 跟踪！
        echo   请运行: git rm --cached storymap.db
        set /a error_count+=1
    ) else (
        echo ✓ 数据库文件未被 Git 跟踪
    )
) else (
    echo ✓ 未发现数据库文件
)
echo.

echo [3/6] 检查备份目录...
if exist backups (
    echo ✓ 备份目录存在
    dir /b backups\*.db 2>nul | find /c /v "" > temp.txt
    set /p backup_count=<temp.txt
    del temp.txt
    echo   备份文件数量: %backup_count%
) else (
    echo ⚠ 备份目录不存在
    echo   建议运行: backup-db.cmd
)
echo.

echo [4/6] 检查敏感文件...
set sensitive_found=0
if exist .env (
    echo ⚠ 发现 .env 文件
    set /a sensitive_found+=1
)
if exist *.key (
    echo ⚠ 发现 .key 文件
    set /a sensitive_found+=1
)
if exist *.pem (
    echo ⚠ 发现 .pem 文件
    set /a sensitive_found+=1
)
if %sensitive_found% equ 0 (
    echo ✓ 未发现敏感文件
) else (
    echo   提示：请确认这些文件已在 .gitignore 中
)
echo.

echo [5/6] 检查 Git 状态...
git status >nul 2>&1
if %errorlevel% equ 0 (
    echo ✓ Git 仓库正常
    
    REM 检查是否有未提交的更改
    git diff --quiet
    if %errorlevel% neq 0 (
        echo ⚠ 有未提交的更改
    ) else (
        echo ✓ 工作区干净
    )
) else (
    echo ✗ 不是 Git 仓库
    set /a error_count+=1
)
echo.

echo [6/6] 检查版本文件...
if exist VERSION.md (
    echo ✓ VERSION.md 存在
) else (
    echo ⚠ VERSION.md 不存在
)
if exist CHANGELOG-v2.4.md (
    echo ✓ CHANGELOG-v2.4.md 存在
) else (
    echo ⚠ CHANGELOG-v2.4.md 不存在
)
if exist RELEASE_NOTES_v2.4.md (
    echo ✓ RELEASE_NOTES_v2.4.md 存在
) else (
    echo ⚠ RELEASE_NOTES_v2.4.md 不存在
)
echo.

echo ========================================
if %error_count% equ 0 (
    echo ✓ 检查通过！可以发布
    echo.
    echo 下一步：
    echo 1. 备份数据库: backup-db.cmd
    echo 2. 运行发布脚本: release-v2.4.cmd
) else (
    echo ✗ 发现 %error_count% 个错误
    echo.
    echo 请修复错误后再发布
)
echo ========================================
echo.

pause
