@echo off
chcp 65001 >nul
echo ========================================
echo 众生谱 v2.4 发布脚本
echo 作者：你们喜爱的老王
echo ========================================
echo.

echo [检查] 验证 .gitignore 配置...
findstr /C:"storymap.db" .gitignore >nul
if %errorlevel% equ 0 (
    echo ✓ .gitignore 已配置，数据库文件不会被上传
) else (
    echo ⚠ 警告：.gitignore 未配置数据库忽略！
    echo 请确认是否要继续...
    pause
)
echo.

echo [检查] 扫描数据库文件...
if exist storymap.db (
    echo ⚠ 发现数据库文件: storymap.db
    echo ✓ 该文件已在 .gitignore 中，不会被上传
) else (
    echo ✓ 未发现数据库文件
)
echo.

echo [1/5] 检查 Git 状态...
git status
echo.

echo [提示] 以下文件将被忽略（不会上传）：
echo   - storymap.db（数据库文件）
echo   - node_modules/（依赖包）
echo   - __pycache__/（Python 缓存）
echo   - *.log（日志文件）
echo.

set /p confirm_add="确认添加文件？(y/n): "
if /i not "%confirm_add%"=="y" (
    echo 取消操作。
    pause
    exit /b
)
echo.

echo [2/5] 添加所有更改...
git add .
echo.

echo [3/5] 提交更改...
git commit -m "Release v2.4: 快速切换优化、数据完整性修复

主要更新：
- 快速切换卷宗体验优化（立即响应 + 异步加载）
- 智能布局算法（根据数据量自动选择）
- 数据完整性修复（自动过滤无效边）
- 文本字数统计显示
- 作者信息界面优化
- 修复导入导出功能
- 修复图谱不显示问题

作者：你们喜爱的老王"
echo.

echo [4/5] 创建标签...
git tag -a v2.4 -m "Release v2.4 - 快速切换优化版本"
echo.

echo [5/5] 推送到 GitHub...
echo 即将推送到远程仓库，请确认：
echo   - 主分支: main
echo   - 标签: v2.4
echo   - 数据库文件: 不会上传（已忽略）
echo.
set /p confirm="确认推送？(y/n): "
if /i "%confirm%"=="y" (
    echo.
    echo 推送代码...
    git push origin main
    echo.
    echo 推送标签...
    git push origin v2.4
    echo.
    echo ========================================
    echo ✓ 发布成功！
    echo ========================================
    echo.
    echo 版本：v2.4
    echo 标签：v2.4
    echo 分支：main
    echo 数据库：未上传（已忽略）
    echo.
    echo 下一步：
    echo 1. 访问 GitHub 仓库查看更新
    echo 2. 在 Releases 页面创建正式发布
    echo 3. 上传打包的 EXE 文件（如果有）
    echo.
) else (
    echo.
    echo 取消推送。
    echo 提示：代码已提交到本地仓库，标签已创建。
    echo 如需推送，请手动执行：
    echo   git push origin main
    echo   git push origin v2.4
    echo.
)

pause
