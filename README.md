# codex-test-project

## Social Comment Quick Reply Helper (Manual Send)

本仓库提供一个 **Tampermonkey 用户脚本**：`comment-helper.user.js`。

### 作用
- 在 YouTube / TikTok 页面右下角添加“快速回复助手”面板。
- 支持设置统一回复模板并本地保存。
- 可高亮当前页面可回复的评论入口。
- 可尝试批量打开回复框（仅打开，不发送）。
- 可把模板填入当前激活的回复输入框，或复制到剪贴板。

### 重要限制
- **不会自动点击发送按钮。**
- 你需要逐条人工确认并手动发送。
- 请遵守各平台规则，避免垃圾信息或骚扰行为。

### 使用方法
1. 安装浏览器扩展 Tampermonkey。
2. 新建脚本，粘贴 `comment-helper.user.js` 全部内容并保存。
3. 打开 YouTube 或 TikTok 评论页面。
4. 在右下角面板里输入模板，点击对应功能按钮辅助回复。

### 兼容性说明
- TikTok/YouTube 经常更新 DOM 结构，部分选择器可能失效。
- 如遇失效，请根据最新页面结构调整脚本中的选择器。
