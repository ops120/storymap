# 发布到 GitHub 指南

**作者：你们喜爱的老王**

---

## 📋 发布前检查清单

- [ ] 所有功能测试通过
- [ ] 更新日志已编写（CHANGELOG-v2.4.md）
- [ ] README 已更新版本号
- [ ] VERSION.md 已更新
- [ ] 代码已清理（删除调试代码、console.log 等）
- [ ] 数据库已备份（运行 backup-db.cmd）
- [ ] .gitignore 已配置（确保数据库不会上传）
- [ ] 敏感信息已移除（API Keys、密码等）

---

## 🔒 数据库安全

### 为什么不上传数据库？

1. **隐私保护**：数据库可能包含用户数据
2. **文件大小**：数据库文件可能很大
3. **版本控制**：数据库不适合用 Git 管理
4. **安全性**：避免泄露敏感信息

### 备份数据库

发布前务必备份：

```bash
# 使用备份脚本（推荐）
backup-db.cmd

# 或手动备份
copy storymap.db backups\storymap_backup.db
```

### 验证 .gitignore

确认数据库已被忽略：

```bash
# 检查 Git 状态
git status

# 确认 storymap.db 不在列表中
```

如果数据库出现在列表中：

```bash
# 从 Git 缓存中移除
git rm --cached storymap.db

# 提交更改
git commit -m "Remove database from Git"
```

---

## 🚀 方式一：使用自动脚本（推荐）

### 1. 运行发布脚本

```bash
release-v2.4.cmd
```

### 2. 脚本会自动执行

1. 检查 Git 状态
2. 添加所有更改
3. 提交更改（带详细说明）
4. 创建标签 v2.4
5. 询问是否推送到 GitHub

### 3. 确认推送

输入 `y` 确认推送，脚本会：
- 推送代码到 main 分支
- 推送标签 v2.4

---

## 🔧 方式二：手动操作

### 1. 初始化 Git 仓库（如果是新项目）

```bash
git init
git branch -M main
```

### 2. 添加远程仓库

```bash
# 替换为你的 GitHub 仓库地址
git remote add origin https://github.com/你的用户名/story-map.git
```

### 3. 添加文件

```bash
git add .
```

### 4. 提交更改

```bash
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
```

### 5. 创建标签

```bash
git tag -a v2.4 -m "Release v2.4 - 快速切换优化版本"
```

### 6. 推送到 GitHub

```bash
# 推送代码
git push -u origin main

# 推送标签
git push origin v2.4
```

---

## 📦 创建 GitHub Release

### 1. 访问 GitHub 仓库

打开你的仓库页面：`https://github.com/你的用户名/story-map`

### 2. 进入 Releases 页面

点击右侧的 "Releases" → "Create a new release"

### 3. 选择标签

- Tag: 选择 `v2.4`
- Target: `main` 分支

### 4. 填写发布信息

- Release title: `众生谱 v2.4 - 快速切换优化版本`
- Description: 复制 `RELEASE_NOTES_v2.4.md` 的内容

### 5. 上传文件（可选）

如果你打包了 EXE 版本：
- 上传 `众生谱-v2.4-Windows-x64.zip`

### 6. 发布

- 勾选 "Set as the latest release"
- 点击 "Publish release"

---

## 🔍 验证发布

### 1. 检查代码

访问：`https://github.com/你的用户名/story-map`

确认：
- 代码已更新
- README 显示 v2.4
- 文件完整

### 2. 检查标签

访问：`https://github.com/你的用户名/story-map/tags`

确认：
- v2.4 标签存在
- 标签指向正确的提交

### 3. 检查 Release

访问：`https://github.com/你的用户名/story-map/releases`

确认：
- v2.4 Release 存在
- 发布说明完整
- 文件已上传（如果有）

---

## 🎯 后续步骤

### 1. 更新项目主页

如果有项目主页或文档站点，更新版本信息。

### 2. 通知用户

- 在 GitHub Discussions 发布公告
- 在 README 添加更新提示
- 在社交媒体分享（如果有）

### 3. 监控反馈

- 关注 GitHub Issues
- 回复用户问题
- 收集改进建议

---

## 🐛 常见问题

### Q: 推送失败，提示 "rejected"

A: 可能是远程仓库有更新，先拉取：
```bash
git pull origin main --rebase
git push origin main
```

### Q: 忘记创建标签

A: 补充创建并推送：
```bash
git tag -a v2.4 -m "Release v2.4"
git push origin v2.4
```

### Q: 想修改已推送的提交信息

A: 不建议修改已推送的提交。如需修改，可以：
1. 创建新的提交修正
2. 或使用 `git revert` 回退

### Q: 如何删除错误的标签

A: 
```bash
# 删除本地标签
git tag -d v2.4

# 删除远程标签
git push origin :refs/tags/v2.4
```

---

## 📝 提交信息规范

### 格式

```
<类型>: <简短描述>

<详细描述>

<作者信息>
```

### 类型

- `feat`: 新功能
- `fix`: Bug 修复
- `docs`: 文档更新
- `style`: 代码格式调整
- `refactor`: 代码重构
- `perf`: 性能优化
- `test`: 测试相关
- `chore`: 构建/工具相关

### 示例

```
feat: 添加快速切换功能

- 实现立即响应切换
- 添加加载状态提示
- 优化图谱渲染性能

作者：你们喜爱的老王
```

---

## 🔐 安全提示

### 不要提交敏感信息

- API Keys
- 密码
- 个人数据
- 数据库文件（如包含用户数据）

### 使用 .gitignore

确保 `.gitignore` 包含：
```
.env
*.key
*.pem
storymap.db  # 如果包含敏感数据
```

### 检查提交历史

提交前检查：
```bash
git diff --cached
```

---

## 📚 参考资源

- [Git 官方文档](https://git-scm.com/doc)
- [GitHub 文档](https://docs.github.com/)
- [语义化版本](https://semver.org/lang/zh-CN/)
- [约定式提交](https://www.conventionalcommits.org/zh-hans/)

---

**祝发布顺利！** 🎉

**作者：你们喜爱的老王**
