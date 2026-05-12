# Prompt 工作台重构方案

保持现有 Claude Console 风格（橙色主题、侧边栏、卡片、字体），仅重构主区域结构与命名为中文。

## 路由结构

```
/                       → Prompt 工作台（默认进入，左侧 Prompt 列表 + 右侧编辑/测试）
/evaluate               → 保留旧的"测试集管理"入口（已存在）
```

主页 `/` 改为三栏布局：

```
┌──────────┬─────────────────── 主区域 ───────────────────┬───────────┐
│ 左侧栏    │  顶部：Prompt 名称 + 操作菜单 + Tab 切换      │ 右侧抽屉  │
│ (原有)    │ ┌──────────────────────────────────────────┐ │ (按需弹出)│
│          │ │ Prompt 列表面板  │  Tab 内容区域           │ │ 模型/工具 │
│          │ │ (固定 280px)     │  ① Prompt 编辑          │ │ /记忆/版本│
│          │ │                  │  ② 效果测试             │ │ 历史/对比 │
│          │ └──────────────────────────────────────────┘ │           │
└──────────┴───────────────────────────────────────────────┴───────────┘
```

## 核心功能一：Prompt 列表（左上角固定）

新组件 `PromptListPanel.tsx`：
- 顶部两个按钮："＋ 新建文件夹"、"＋ 新建 Prompt"
- 树状列表：一级文件夹（可折叠）→ 二级 Prompt 项（显示名称、最后编辑时间、所有者）
- 选中 Prompt 后高亮，向父组件回调
- 新建文件夹：行内输入命名
- 新建 Prompt：弹窗输入「名称、描述、所属文件夹」

顶部信息条：当前 Prompt 名称（点击展开下拉菜单：重命名 / 保存 / 版本历史 / 创建副本 / 删除）+ 最近编辑时间。

版本历史：右侧抽屉列出（编辑名称、时间、操作人）。

## 核心功能二：Prompt 编辑（Tab ①「Prompt 编辑」）

左半部分（编辑区）：
- 工具条：关联 Prompt（不关联/搜索关联）、选择模型（按钮 → 右抽屉）、最大轮次（数字输入）、工具（按钮 → 右抽屉）、记忆（按钮 → 右抽屉，多选：时间/地理位置/用户UID/设备平台/短期记忆/长期记忆）、改善 Prompt（按钮 → 弹窗对话）
- System Prompt 编辑框
- User Prompt 编辑框
- 「＋ 增加后处理」按钮：点击后向下追加同结构编辑块（数组 state）
- 关联其他 Prompt 时编辑框置灰禁用

右半部分（Agent 效果预览区）：
- 查询输入：文本框 + 图片/笔记/Excel 上传按钮
- "运行测试" 按钮
- 历史轨迹列表（卡片形式展示运行步骤）

## 核心功能三：效果测试（Tab ②「效果测试」）

顶部控制条：
- 关联测试集（下拉）
- 显示 Prompt 配置（开关）→ 在表头下追加一行展示模型/工具/描述
- 显示测试集字段（开关）→ 在「输入文字」「效果」列后追加测试集字段列

表格列（中文表头，每列可搜索筛选）：
1. 编号
2. 输入文字
3. 当前 Prompt 名称（运行结果）
4. ＋ 增加 Prompt 对比（点击表头→右抽屉选择，最多 3 个对比版本）
5. 大模型评估（每版本三子列：分数 / 问题类型 / 备注，单格可编辑，整列可筛选）

## 技术细节

- 全部用本地 React state + mock 数据（无后端）
- 新建组件：
  - `src/components/console/PromptListPanel.tsx`
  - `src/components/console/PromptInfoBar.tsx`（名称 + 操作菜单 + 最近编辑时间）
  - `src/components/console/PromptEditor.tsx`（编辑区 + 后处理数组）
  - `src/components/console/AgentPreview.tsx`（运行预览）
  - `src/components/console/EvalTable.tsx`（效果测试表格）
  - `src/components/console/RightDrawer.tsx`（统一右抽屉，承载：模型选择/工具选择/记忆选择/版本历史/对比 Prompt 选择）
  - `src/components/console/NewPromptDialog.tsx`、`ImprovePromptDialog.tsx`
- `src/routes/index.tsx` 重构为三栏布局，使用 `Tabs` 切换编辑/测试
- `WorkbenchHeader.tsx` 内 tab 标签改中文："Prompt 编辑" / "效果测试"
- `Sidebar.tsx`：所有可见标签替换为中文（工作台、测试集、文件、管理、分析等）
- 删除 `src/routes/evaluate.tsx` 不再需要的内容（保留路由作为"测试集管理"占位中文页面）
- 保留现有 CSS 变量与橙色主题，不动 `styles.css`

## 实施步骤

1. 新建 `RightDrawer` 通用组件（Sheet 包装）+ 各个内容面板
2. 新建 `PromptListPanel`、`PromptInfoBar`、`NewPromptDialog`
3. 新建 `PromptEditor`（含工具条 + 后处理数组）+ `ImprovePromptDialog`
4. 新建 `AgentPreview`
5. 新建 `EvalTable`
6. 重写 `src/routes/index.tsx` 集成上述组件 + Tabs
7. 中文化 `Sidebar.tsx` 与 `WorkbenchHeader.tsx`
8. 中文化 `/evaluate` 页面为「测试集管理」
9. 类型检查
