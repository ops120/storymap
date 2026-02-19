# 众生谱 v2.4 发布说明

**作者：你们喜爱的老王**  
**发布日期：2026-02-19**

---

## 🎉 重大更新

### ⚡ 快速切换体验
切换卷宗时不再需要等待，立即响应并显示加载状态！

- 立即切换（< 50ms 响应）
- 两阶段加载提示（数据加载 + 图谱渲染）
- 可视化加载动画（旋转图标 + 进度文字）

### 🎨 智能布局算法
根据数据量自动选择最优布局：

- 小数据（≤ 50 节点）：force 布局（更美观）
- 大数据（> 50 节点）：circular 布局（更快）

### 🔧 数据完整性
自动检测和修复数据问题：

- 前端自动过滤无效边
- 后端 API 数据验证
- 清理功能增强

### 📊 用户体验提升

- 文本输入区域显示总字数（实时更新）
- 作者信息左下角显示（紫色渐变，更显眼）
- 加载状态更友好

---

## 🐛 Bug 修复

### 前端修复
- ✅ 修复 `exportProject` 和 `importProject` 方法缺失
- ✅ 修复项目引用错误
- ✅ 修复图谱切换后不显示
- ✅ 修复加载动画不显示

### 后端修复
- ✅ 修复导入接口 SQL 列数不匹配
- ✅ 修复分析接口 INSERT 语句错误
- ✅ 增强数据验证和过滤

---

## 📦 下载

### 源码
- [Source code (zip)](https://github.com/你的用户名/story-map/archive/refs/tags/v2.4.zip)
- [Source code (tar.gz)](https://github.com/你的用户名/story-map/archive/refs/tags/v2.4.tar.gz)

### Windows EXE（可选）
如果你打包了 EXE 版本，可以在这里上传：
- `众生谱-v2.4-Windows-x64.zip` - Windows 独立可执行文件

---

## 🚀 快速开始

### 新用户

1. 下载源码并解压
2. 安装依赖：
   ```bash
   # 后端
   conda activate vevo
   pip install -r requirements.txt
   
   # 前端
   cd frontend
   npm install
   ```
3. 启动服务：
   ```bash
   start.cmd
   ```
4. 访问 `http://localhost:5173`

### 升级用户

1. 备份数据库 `storymap.db`
2. 拉取最新代码：
   ```bash
   git pull origin main
   ```
3. 重启服务
4. 建议运行"清理重复"功能

---

## 📚 文档

- [完整更新日志](https://github.com/你的用户名/story-map/blob/main/CHANGELOG-v2.4.md)
- [README](https://github.com/你的用户名/story-map/blob/main/README.md)
- [安装指南](https://github.com/你的用户名/story-map/blob/main/安装指南.md)
- [使用技巧](https://github.com/你的用户名/story-map/blob/main/使用技巧.md)

---

## 🔄 版本对比

| 功能 | v2.3 | v2.4 |
|------|------|------|
| 切换速度 | 慢（2-5秒） | 快（< 50ms） |
| 加载提示 | 无 | 有（两阶段） |
| 布局算法 | 固定 force | 智能选择 |
| 数据验证 | 无 | 前后端双重 |
| 字数统计 | 无 | 有 |
| 作者信息 | 右下角小字 | 左下角显眼 |

---

## 🙏 致谢

感谢所有用户的反馈和建议！

特别感谢：
- 提出切换速度优化建议的用户
- 报告数据问题的用户
- 所有支持本项目的朋友们

---

## 📝 下一版本计划

v2.5 可能包含：
- 数据预加载
- 图谱缓存
- 虚拟化渲染
- 导出图谱为图片

---

**众生谱 v2.4 - 让人物关系一目了然** 🎉

**作者：你们喜爱的老王**

---

## 💬 反馈

如有问题或建议，欢迎：
- 提交 [Issue](https://github.com/你的用户名/story-map/issues)
- 发起 [Discussion](https://github.com/你的用户名/story-map/discussions)
- 提交 [Pull Request](https://github.com/你的用户名/story-map/pulls)
