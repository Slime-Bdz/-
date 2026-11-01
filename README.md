# -# 粉笔公考助手 BDslime (Fenbi Assistant)

> 一个运行在 Tampermonkey 上的粉笔网页端增强脚本：隐藏解析视频、收起侧栏、宽屏沉浸做题。

![version](https://img.shields.io/badge/version-6.2-blue)
![license](https://img.shields.io/badge/license-MIT-green)
![platform](https://img.shields.io/badge/platform-Tampermonkey-orange)

---

## 📖 项目简介

**粉笔公考助手 BDslime** 是一个轻量的用户脚本（UserScript），用于优化 [粉笔](https://www.fenbi.com) 网页端的做题与看解析体验。脚本融合了 `fenbi-helper` 的核心思路，提供视频净空、考点隐藏、自动收起侧边栏与宽屏沉浸布局四项可独立开关的功能，全部配置保存在浏览器本地，随时可切换。

脚本无后端、无网络请求、不收集任何数据，仅在页面内做 DOM 层面的调整。

---

## ✨ 功能特性

| 功能 | 默认 | 说明 |
| --- | --- | --- |
| 🎬 屏蔽视频解析 | 开启 | 自动隐藏「视频解析」版块并暂停其中正在播放的视频，避免加载卡顿与流量消耗 |
| 📌 屏蔽考点模块 | 关闭 | 按需隐藏标题为「考点」的版块，让解析页面更清爽 |
| 📐 自动收起侧栏 | 开启 | 进入题目/解析页时自动点击折叠按钮，收起左侧导航栏 |
| 🖥️ 宽屏沉浸布局 | 开启 | 将主内容区最大宽度放宽至 80%，减少左右留白，适合大屏做题 |

所有开关均可在页面右下角的悬浮面板中实时切换，**无需刷新页面**，配置自动持久化。

---

## 🚀 安装

### 前置条件

- 浏览器已安装 [Tampermonkey](https://www.tampermonkey.net/)（Chrome / Edge / Firefox / Safari 均可）
- 已登录粉笔网页端账号

### 安装步骤

1. **获取脚本**
   - 方式一：点击本仓库中的 `fenbi-helper.user.js`，选择 **Raw**，Tampermonkey 会自动弹出安装页；
   - 方式二：打开 Tampermonkey 管理面板 → 实用工具 → 从 URL 导入，粘贴 Raw 链接。

2. **确认安装**
   在安装页核对 `@name`、`@match` 无误后，点击「安装」。

3. **验证生效**
   打开任意粉笔题目解析页，右下角出现蓝色「⚙ 粉笔助手」按钮即安装成功。按 `F12` 打开控制台，也能看到启动 banner：

   ```
   BDslime  粉笔助手 v6.2 已加载 · by BD-Slime
   ```

---

## 🎮 使用方法

1. 进入粉笔网页端的**题目页或解析页**；
2. 点击右下角 **「⚙ 粉笔助手」** 展开控制面板；
3. 按需勾选或取消对应功能，改动即时生效并自动保存；
4. 再次点击按钮可收起面板。

> 面板位置固定在页面右下角，z-index 为 99999，通常不会遮挡题目内容。

---

## ⚙️ 配置说明

配置以 JSON 形式保存在浏览器 `localStorage` 中，键名为：

```
bd_slime_fenbi_helper_cfg
```

结构如下：

```json
{
  "hideVideo": true,
  "hideKeyPoint": false,
  "autoCollapse": true,
  "widenLayout": true
}
```

| 字段 | 类型 | 默认值 | 对应功能 |
| --- | --- | --- | --- |
| `hideVideo` | boolean | `true` | 屏蔽视频解析 |
| `hideKeyPoint` | boolean | `false` | 屏蔽考点模块 |
| `autoCollapse` | boolean | `true` | 自动收起侧栏 |
| `widenLayout` | boolean | `true` | 宽屏沉浸布局 |

**恢复默认设置**：在浏览器控制台执行 `localStorage.removeItem('bd_slime_fenbi_helper_cfg')` 后刷新页面即可。

---

## 🔍 工作原理

脚本在 `document-end` 阶段注入，主要包含三部分：

1. **动态 CSS 注入**：根据开关状态生成 `<style>`，对视频版块、考点版块和主内容区宽度做样式覆盖，实现「预拦截」，减少闪烁；
2. **定时巡检**：每 500ms 扫描一次 DOM，识别新渲染的「视频解析」「考点」版块并打上 `data-bd-hidden` 标记，同时监听 SPA 路由变化以重置自动收起状态；
3. **悬浮控制面板**：纯 DOM 构建，读写 `localStorage` 并触发样式重算。

脚本使用 `MutationObserver` 之外的全量轮询而非事件监听，是为了兼容粉笔页面基于 Angular 的异步渲染；代价是存在极低的常驻开销（每 500ms 一次选择器查询）。

---

## ❓ 常见问题

**Q：安装后右下角没有出现按钮？**
A：确认当前页面域名匹配 `*://*.fenbi.com/*`，并在 Tampermonkey 面板中检查脚本是否已启用。可打开控制台查看是否有 `BDslime` 相关报错。

**Q：视频被隐藏了但仍有声音？**
A：脚本会主动 `pause()` 已识别的 `<video>`。若仍有声音，多半是视频在 `<iframe>` 内，受同源策略限制无法操作，可在面板中临时关闭「屏蔽视频解析」。

**Q：更新脚本后出现两个控制面板？**
A：若修改过 `@name`，Tampermonkey 会将其识别为新脚本，旧版本不会被覆盖。请到 Tampermonkey 管理面板删除旧脚本后刷新页面。

**Q：会收集我的做题数据吗？**
A：不会。脚本无任何网络请求，所有逻辑在本地页面内完成，配置只写入你自己的 `localStorage`。

---

## 📝 更新日志

### v6.2
- 新增统一的 `BDslime` 水印标识，覆盖元数据、UI、控制台与 DOM 属性
- 控制面板增加 `© BDslime` 署名行
- 补充 `@license MIT` 与 `@copyright` 字段
- 脚本更名为「粉笔公考助手 BDslime (Fenbi Assistant)」

### v6.0
- 融合 `fenbi-helper` 特性：考点隐藏、自动收起侧栏、宽屏布局
- 配置迁移至 `localStorage`，移除对 `chrome.storage` 的依赖
- 新增右下角可视化控制面板

---

## ⚠️ 免责声明

- 本项目为**个人学习与技术研究**用途，与粉笔官方无任何关联；
- 脚本仅修改本地页面的显示层，不修改题目内容、不影响成绩与正常学习流程；
- 使用本脚本产生的任何后果由使用者自行承担，作者不对因网站改版导致的失效或异常负责；
- 请遵守目标网站的用户协议，合理使用。

---

## 📄 许可证

本项目基于 [MIT License](LICENSE) 开源。你可以自由使用、修改、分发，包括商业用途，但需保留原始版权声明。

---

## 👤 作者

**BD-Slime**

> 如果这个脚本帮到了你，欢迎点一个 ⭐ Star。
