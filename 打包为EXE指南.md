# 众生谱打包为 EXE 指南

**作者：你们喜爱的老王**

---

## 📦 打包方案概述

将众生谱打包成独立的 Windows 可执行文件，用户无需安装 Python、Node.js 等环境即可使用。

---

## 🎯 推荐方案

### 方案对比

| 方案 | 优点 | 缺点 | 推荐度 |
|------|------|------|--------|
| **PyInstaller + Electron** | 成熟稳定，兼容性好 | 体积较大（~150MB） | ⭐⭐⭐⭐⭐ |
| **PyInstaller + Tauri** | 体积小（~50MB），性能好 | 需要 Rust 环境 | ⭐⭐⭐⭐ |
| **Nuitka + Electron** | 性能最好 | 编译时间长 | ⭐⭐⭐ |

**推荐使用：PyInstaller + Electron**（最成熟，最容易实现）

---

## 🚀 方案一：PyInstaller + Electron（推荐）

### 架构说明

```
众生谱.exe
├── electron 主进程
│   ├── 启动 Python 后端（内嵌）
│   └── 创建浏览器窗口
└── 前端资源（打包后的静态文件）
```

### 实现步骤

#### 1. 安装依赖

```bash
# 后端打包工具
pip install pyinstaller

# 前端打包工具
npm install -g electron-builder
```

#### 2. 打包后端

创建 `backend/main.spec` 文件（PyInstaller 配置）：

```python
# -*- mode: python ; coding: utf-8 -*-

block_cipher = None

a = Analysis(
    ['main.py'],
    pathex=[],
    binaries=[],
    datas=[],
    hiddenimports=[
        'uvicorn.logging',
        'uvicorn.loops',
        'uvicorn.loops.auto',
        'uvicorn.protocols',
        'uvicorn.protocols.http',
        'uvicorn.protocols.http.auto',
        'uvicorn.protocols.websockets',
        'uvicorn.protocols.websockets.auto',
        'uvicorn.lifespan',
        'uvicorn.lifespan.on',
    ],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.zipfiles,
    a.datas,
    [],
    name='storymap-backend',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=False,  # 不显示控制台窗口
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    icon='icon.ico'  # 应用图标
)
```

打包命令：

```bash
cd backend
pyinstaller main.spec
# 生成 dist/storymap-backend.exe
```

#### 3. 构建前端

```bash
cd frontend
npm run build
# 生成 dist/ 目录
```

#### 4. 创建 Electron 应用

创建 `electron/` 目录结构：

```
electron/
├── main.js           # Electron 主进程
├── preload.js        # 预加载脚本
├── package.json      # Electron 配置
└── icon.ico          # 应用图标
```

**electron/package.json**：

```json
{
  "name": "storymap",
  "version": "1.0.0",
  "description": "众生谱 - 叙事关系分析工具",
  "main": "main.js",
  "scripts": {
    "start": "electron .",
    "build": "electron-builder"
  },
  "build": {
    "appId": "com.storymap.app",
    "productName": "众生谱",
    "directories": {
      "output": "dist"
    },
    "files": [
      "main.js",
      "preload.js",
      "frontend/**/*",
      "backend/**/*"
    ],
    "win": {
      "target": "nsis",
      "icon": "icon.ico"
    },
    "nsis": {
      "oneClick": false,
      "allowToChangeInstallationDirectory": true,
      "createDesktopShortcut": true,
      "createStartMenuShortcut": true
    }
  },
  "devDependencies": {
    "electron": "^28.0.0",
    "electron-builder": "^24.9.1"
  }
}
```

**electron/main.js**：

```javascript
const { app, BrowserWindow } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let mainWindow;
let backendProcess;

// 启动后端服务
function startBackend() {
  const backendPath = path.join(
    process.resourcesPath,
    'backend',
    'storymap-backend.exe'
  );
  
  backendProcess = spawn(backendPath, [], {
    cwd: path.dirname(backendPath),
    windowsHide: true
  });

  backendProcess.stdout.on('data', (data) => {
    console.log(`Backend: ${data}`);
  });

  backendProcess.stderr.on('data', (data) => {
    console.error(`Backend Error: ${data}`);
  });

  // 等待后端启动
  return new Promise((resolve) => {
    setTimeout(resolve, 3000);
  });
}

// 创建主窗口
async function createWindow() {
  // 先启动后端
  await startBackend();

  mainWindow = new BrowserWindow({
    width: 1920,
    height: 1080,
    icon: path.join(__dirname, 'icon.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  // 加载前端页面
  const frontendPath = path.join(__dirname, 'frontend', 'index.html');
  mainWindow.loadFile(frontendPath);

  // 开发模式下打开开发者工具
  // mainWindow.webContents.openDevTools();

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  // 关闭后端进程
  if (backendProcess) {
    backendProcess.kill();
  }
  
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});
```

**electron/preload.js**：

```javascript
// 预加载脚本（如需要）
window.addEventListener('DOMContentLoaded', () => {
  console.log('Electron preload script loaded');
});
```

#### 5. 组织文件结构

```bash
# 创建打包目录
mkdir electron-build
cd electron-build

# 复制 Electron 文件
cp -r ../electron/* .

# 复制前端构建产物
mkdir frontend
cp -r ../frontend/dist/* frontend/

# 复制后端可执行文件
mkdir backend
cp ../backend/dist/storymap-backend.exe backend/

# 复制数据库初始化文件（如需要）
# cp ../storymap.db backend/
```

#### 6. 打包成 EXE

```bash
cd electron-build
npm install
npm run build
```

生成的文件在 `electron-build/dist/` 目录：
- `众生谱 Setup 1.0.0.exe` - 安装程序
- `众生谱-1.0.0.exe` - 便携版（可选）

---

## 🎨 方案二：Tauri（体积更小）

### 优势
- 体积小（约 50MB）
- 性能好（使用系统 WebView）
- 资源占用少

### 实现步骤

#### 1. 安装 Tauri CLI

```bash
npm install -g @tauri-apps/cli
```

#### 2. 初始化 Tauri 项目

```bash
cd frontend
npm install @tauri-apps/api
tauri init
```

#### 3. 配置 tauri.conf.json

```json
{
  "build": {
    "beforeBuildCommand": "npm run build",
    "beforeDevCommand": "npm run dev",
    "devPath": "http://localhost:5173",
    "distDir": "../dist"
  },
  "package": {
    "productName": "众生谱",
    "version": "1.0.0"
  },
  "tauri": {
    "allowlist": {
      "all": true
    },
    "bundle": {
      "active": true,
      "targets": "all",
      "identifier": "com.storymap.app",
      "icon": [
        "icons/icon.ico"
      ]
    },
    "windows": [
      {
        "title": "众生谱",
        "width": 1920,
        "height": 1080
      }
    ]
  }
}
```

#### 4. 创建 Rust 后端启动代码

在 `src-tauri/src/main.rs` 中添加启动 Python 后端的代码。

#### 5. 打包

```bash
tauri build
```

---

## 📝 自动化打包脚本

创建 `build-exe.cmd` 脚本：

```batch
@echo off
chcp 65001 > nul
echo ========================================
echo 众生谱 EXE 打包脚本
echo ========================================
echo.

echo [1/5] 激活 Conda 环境...
call conda activate vevo
if errorlevel 1 (
    echo 错误: 无法激活 vevo 环境
    pause
    exit /b 1
)

echo [2/5] 打包后端...
cd backend
pyinstaller main.spec
if errorlevel 1 (
    echo 错误: 后端打包失败
    pause
    exit /b 1
)
cd ..

echo [3/5] 构建前端...
cd frontend
call npm run build
if errorlevel 1 (
    echo 错误: 前端构建失败
    pause
    exit /b 1
)
cd ..

echo [4/5] 组织文件...
if exist electron-build rmdir /s /q electron-build
mkdir electron-build
xcopy /E /I electron electron-build
xcopy /E /I frontend\dist electron-build\frontend
xcopy /E /I backend\dist electron-build\backend

echo [5/5] 打包 Electron...
cd electron-build
call npm install
call npm run build
if errorlevel 1 (
    echo 错误: Electron 打包失败
    pause
    exit /b 1
)
cd ..

echo.
echo ========================================
echo 打包完成！
echo 输出目录: electron-build\dist\
echo ========================================
pause
```

---

## 🎯 使用打包后的 EXE

### 安装版
1. 双击 `众生谱 Setup 1.0.0.exe`
2. 选择安装目录
3. 完成安装
4. 从开始菜单或桌面快捷方式启动

### 便携版
1. 解压到任意目录
2. 双击 `众生谱.exe` 启动
3. 数据库文件会在同目录下生成

---

## 📊 打包后文件大小

| 方案 | 大小 | 说明 |
|------|------|------|
| PyInstaller + Electron | ~150MB | 包含完整 Python 运行时 |
| PyInstaller + Tauri | ~50MB | 使用系统 WebView |
| 压缩后（7z） | ~50MB / ~20MB | 可进一步压缩 |

---

## ⚠️ 注意事项

### 1. 数据库位置
- 开发版：项目根目录
- 打包版：用户数据目录（`%APPDATA%/storymap/`）

需要修改 `backend/main.py` 中的数据库路径：

```python
import os
from pathlib import Path

# 获取用户数据目录
if getattr(sys, 'frozen', False):
    # 打包后的环境
    app_data = Path(os.getenv('APPDATA')) / 'storymap'
    app_data.mkdir(exist_ok=True)
    DB_PATH = app_data / 'storymap.db'
else:
    # 开发环境
    DB_PATH = 'storymap.db'
```

### 2. 端口冲突
打包版应使用随机端口或检测端口是否被占用。

### 3. 防火墙
首次运行可能需要允许防火墙访问。

### 4. 杀毒软件
某些杀毒软件可能误报，需要添加信任。

### 5. 更新机制
建议添加自动更新功能（Electron 的 autoUpdater）。

---

## 🔄 更新和维护

### 版本更新
1. 修改 `package.json` 中的版本号
2. 重新打包
3. 发布新版本

### 自动更新
使用 `electron-updater` 实现：

```javascript
const { autoUpdater } = require('electron-updater');

autoUpdater.checkForUpdatesAndNotify();
```

---

## 📚 相关资源

- [PyInstaller 文档](https://pyinstaller.org/)
- [Electron 文档](https://www.electronjs.org/)
- [Tauri 文档](https://tauri.app/)
- [electron-builder 文档](https://www.electron.build/)

---

## 🎉 下一步

1. 按照本指南完成打包
2. 测试打包后的 EXE
3. 创建安装程序
4. 发布到 GitHub Releases
5. 编写用户使用文档

---

**众生谱 v1.0 - 一键启动，开箱即用** 🚀  
**作者：你们喜爱的老王**
