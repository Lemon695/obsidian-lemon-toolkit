# Lemon Toolkit

一个为 Obsidian 设计的个人效率工具包插件，提供实用的辅助功能。

## 功能特性

### 复制路径命令

通过键盘快捷键快速复制各种格式的文件路径：

- **复制相对路径** - 复制相对于仓库根目录的文件路径
- **复制绝对路径** - 复制完整的系统路径（仅桌面端）
- **复制文件名** - 复制带扩展名的文件名
- **复制文件名（无扩展名）** - 复制不带扩展名的文件名

所有命令都会显示确认通知，展示已复制的内容。

### 删除文件命令

提供两种文件删除选项：

- **永久删除文件** - 从仓库中永久删除当前文件
- **删除文件到回收站** - 将当前文件移动到 Obsidian 回收站（.trash 文件夹）

### 文件管理命令

- **复制文件** - 复制当前文件并弹出重命名对话框。默认文件名包含后缀（如时间戳：`filename-1733234567890.md` 或 UUID：`filename-a1b2c3d4.md`），可在确认前修改

## 使用方法

1. 在仓库中打开任意文件
2. 打开命令面板（Ctrl/Cmd + P）
3. 搜索 "Lemon Toolkit" 命令
4. 选择需要的复制命令
5. 内容将被复制到剪贴板，并显示确认通知

### 命令列表

| 命令 | 说明 |
|------|------|
| `Lemon Toolkit: Copy relative path` | 复制相对于仓库根目录的文件路径 |
| `Lemon Toolkit: Copy absolute path` | 复制完整的系统路径 |
| `Lemon Toolkit: Copy file name` | 复制带扩展名的文件名 |
| `Lemon Toolkit: Copy file name (no extension)` | 复制不带扩展名的文件名 |
| `Lemon Toolkit: Delete file permanently` | 永久删除当前文件 |
| `Lemon Toolkit: Delete file to trash` | 将当前文件移动到 Obsidian 回收站 |
| `Lemon Toolkit: Duplicate file` | 复制当前文件并弹出重命名对话框 |

## 安装方法

### 从 Obsidian 社区插件安装

1. 打开 **设置** → **第三方插件**
2. 选择 **浏览** 并搜索 "Lemon Toolkit"
3. 选择 **安装**
4. 安装完成后，选择 **启用**

### 手动安装

1. 从 [Releases](https://github.com/yourusername/lemon-toolkit/releases) 页面下载最新版本
2. 将文件解压到仓库的插件文件夹：`<vault>/.obsidian/plugins/lemon-toolkit/`
3. 重新加载 Obsidian
4. 在 **设置** → **第三方插件** 中启用该插件

## 设置

在 **设置** → **Lemon Toolkit** 中可以配置：

- **复制文件后缀类型** - 选择复制文件时添加的后缀格式
  - 时间戳（默认）：`filename-1733234567890.md`
  - UUID：`filename-a1b2c3d4.md`

## 兼容性

- 最低 Obsidian 版本：1.0.0
- 支持桌面端（Windows、macOS、Linux）
- 支持移动端（iOS、Android），部分功能受限
  - 注意：移动设备上无法使用绝对路径复制功能

## 开发

本插件使用 TypeScript 构建，采用模块化架构，易于扩展。

### 构建插件

```bash
# 安装依赖
npm install

# 开发模式（带监听）
npm run dev

# 生产构建
npm run build
```

### 项目结构

```
src/
├── main.ts              # 插件入口
├── settings.ts          # 插件设置接口
├── commands/
│   ├── index.ts         # 命令注册
│   ├── copyPath.ts      # 复制路径功能实现
│   ├── deleteFile.ts    # 删除文件功能实现
│   └── duplicateFile.ts # 复制文件功能实现
├── ui/
│   ├── DuplicateFileModal.ts # 重命名复制文件的弹窗
│   └── SettingTab.ts    # 插件设置面板
└── utils/
    ├── clipboard.ts     # 剪贴板工具
    └── suffix.ts        # 后缀生成工具
```

## 支持

如果遇到任何问题或有功能建议，请在 GitHub 上[提交 issue](https://github.com/yourusername/lemon-toolkit/issues)。

## 许可证

MIT 许可证 - 详见 [LICENSE](LICENSE) 文件。

## 致谢

基于 [Obsidian API](https://docs.obsidian.md) 构建。
