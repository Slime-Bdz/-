// ==UserScript==
// @name         粉笔公考助手BDDslime (Fenbi Assistant)
// @namespace    http://tampermonkey.net/
// @version      6.2
// @description  融合 fenbi-helper 核心特性：彻底隐藏解析视频、可选隐藏考点、自动收起侧边栏与宽屏沉浸布局。
// @author       BD-Slime (BDslime)
// @match        *://*.fenbi.com/*
// @grant        none
// @run-at       document-end
// @license      MIT
// @copyright    BDslime
// ==/UserScript==

/*
 * ============================================================
 *  脚本作者 / Author    : BDslime
 *  水印标识 / Watermark : BDslime
 *  原始出处 / Origin    : fenbi-helper 系列
 *  本脚本以 MIT 协议发布，转载或二次修改请保留本署名与水印。
 * ============================================================
 */

(function () {
  'use strict';

  // ==================== 水印标识（统一引用，勿删） ====================
  const WATERMARK = 'BDslime';
  const AUTHOR = 'BD-Slime';

  // ==================== 0. 配置管理 (替代原插件 chrome.storage) ====================
  const STORAGE_KEY = 'bd_slime_fenbi_helper_cfg';
  const defaultConfig = {
    hideVideo: true,       // 隐藏视频解析 (原核心功能)
    hideKeyPoint: false,   // 隐藏考点版块 (fenbi-helper 特性)
    autoCollapse: true,    // 自动收起左侧栏 (fenbi-helper 特性)
    widenLayout: true      // 宽屏沉浸布局 (fenbi-helper 特性)
  };

  let config = Object.assign({}, defaultConfig, JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'));
  const saveConfig = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    updateDynamicStyles();
    restoreOrReapplyDOM();
  };

  // ==================== 1. 动态全局 CSS 注入 ====================
  const styleEl = document.createElement('style');
  document.head.appendChild(styleEl);

  function updateDynamicStyles() {
    let css = `
      /* ${WATERMARK} 悬浮控制面板样式 */
      #bd-helper-panel { position: fixed; bottom: 20px; right: 20px; z-index: 99999; font-family: system-ui, sans-serif; font-size: 13px; }
      #bd-helper-toggle { background: #1890ff; color: #fff; border: none; border-radius: 20px; padding: 6px 14px; cursor: pointer; box-shadow: 0 2px 8px rgba(0,0,0,0.2); font-weight: bold; transition: opacity 0.2s; opacity: 0.75; }
      #bd-helper-toggle:hover { opacity: 1; }
      #bd-helper-menu { display: none; background: #fff; border: 1px solid #e8e8e8; border-radius: 8px; padding: 12px; margin-bottom: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); min-width: 170px; color: #333; }
      #bd-helper-menu.open { display: block; }
      .bd-helper-item { display: flex; align-items: center; justify-content: space-between; margin: 6px 0; cursor: pointer; user-select: none; }
      .bd-helper-item input { cursor: pointer; }
      .bd-helper-title { font-weight: bold; border-bottom: 1px solid #f0f0f0; padding-bottom: 6px; margin-bottom: 8px; color: #1890ff; }
      .bd-helper-watermark { text-align: right; font-size: 11px; color: #999; margin-top: 8px; padding-top: 6px; border-top: 1px dashed #eee; letter-spacing: 0.5px; }
    `;

    // 原有视频 CSS 预拦截
    if (config.hideVideo) {
      css += `
        section[id^="section-video-"], [class*="video-item"], fb-ng-solution-detail-video, [data-bd-hidden="video"] {
          display: none !important;
        }
      `;
    }

    // 考点模块隐藏拦截
    if (config.hideKeyPoint) {
      css += `
        [data-bd-hidden="keypoint"] {
          display: none !important;
        }
      `;
    }

    // 宽屏沉浸模式
    if (config.widenLayout) {
      css += `
        main.exam-content, .exam-detail-container, .solution-detail-container, .tis-container {
          max-width: 80% !important;
        }
      `;
    }

    styleEl.textContent = css;
  }

  // 当开关切换时，恢复被隐藏的节点以便重新计算
  function restoreOrReapplyDOM() {
    if (!config.hideVideo) {
      document.querySelectorAll('[data-bd-hidden="video"]').forEach(el => {
        el.removeAttribute('data-bd-hidden');
        el.style.display = '';
      });
    }
    if (!config.hideKeyPoint) {
      document.querySelectorAll('[data-bd-hidden="keypoint"]').forEach(el => {
        el.removeAttribute('data-bd-hidden');
        el.style.display = '';
      });
    }
  }

  updateDynamicStyles();

  // ==================== 2. 定时巡检引擎 (视频净空 + 考点隐藏 + 自动折叠) ====================
  let lastUrl = '';
  let hasCollapsedForCurrentUrl = false;

  setInterval(() => {
    // 检测 SPA 路由切换，重置自动收起状态
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      hasCollapsedForCurrentUrl = false;
    }

    // --- A. 原有视频净空逻辑 + 考点隐藏逻辑 ---
    if (config.hideVideo) {
      const selectors = 'section[id^="section-video-"], [class*="video-item"], fb-ng-solution-detail-video';
      const videoSections = Array.from(document.querySelectorAll(selectors));

      document.querySelectorAll('section:not([data-bd-hidden])').forEach(sec => {
        const titleEl = sec.querySelector('h3, h4, .title, [class*="title"]');
        if (titleEl && titleEl.textContent.trim().includes('视频解析') && !videoSections.includes(sec)) {
          videoSections.push(sec);
        }
      });

      const activeTargets = videoSections.filter(el => el.dataset.bdHidden !== 'video');
      if (activeTargets.length > 0) {
        activeTargets.forEach(section => {
          section.dataset.bdHidden = 'video';
          section.style.display = 'none';
          section.querySelectorAll('video').forEach(v => v.pause());
        });
        console.log(`[${WATERMARK}] 粉笔脚本(v6.2): 本次检测并净空了 ${activeTargets.length} 个视频版块。`);
      }
    }

    if (config.hideKeyPoint) {
      document.querySelectorAll('section:not([data-bd-hidden])').forEach(sec => {
        const titleEl = sec.querySelector('h3, h4, .title, [class*="title"]');
        if (titleEl && titleEl.textContent.trim() === '考点') {
          sec.dataset.bdHidden = 'keypoint';
          sec.style.display = 'none';
        }
      });
    }

    // --- B. fenbi-helper 特性：自动收起左侧栏 ---
    if (config.autoCollapse && !hasCollapsedForCurrentUrl) {
      const collapseBtn = document.querySelector('.collapse-btn, .fb-collapse-btn, [class*="collapse-icon"]:not(.collapsed)');
      if (collapseBtn) {
        collapseBtn.click();
        hasCollapsedForCurrentUrl = true;
        console.log(`[${WATERMARK}] 已自动收起侧边栏。`);
      }
    }
  }, 500);

  // ==================== 3. 注入右下角可视化控制面板 ====================
  function initControlPanel() {
    const panel = document.createElement('div');
    panel.id = 'bd-helper-panel';
    panel.dataset.author = WATERMARK;                 // DOM 属性水印
    panel.innerHTML = `
      <div id="bd-helper-menu">
        <div class="bd-helper-title">BD-Slime 粉笔助手 v6.2</div>
        <label class="bd-helper-item"><span>屏蔽视频解析</span><input type="checkbox" data-key="hideVideo" ${config.hideVideo ? 'checked' : ''}></label>
        <label class="bd-helper-item"><span>屏蔽考点模块</span><input type="checkbox" data-key="hideKeyPoint" ${config.hideKeyPoint ? 'checked' : ''}></label>
        <label class="bd-helper-item"><span>自动收起侧栏</span><input type="checkbox" data-key="autoCollapse" ${config.autoCollapse ? 'checked' : ''}></label>
        <label class="bd-helper-item"><span>宽屏沉浸布局</span><input type="checkbox" data-key="widenLayout" ${config.widenLayout ? 'checked' : ''}></label>
        <div class="bd-helper-watermark">© ${WATERMARK}</div>
      </div>
      <button id="bd-helper-toggle">⚙ 粉笔助手</button>
    `;
    document.body.appendChild(panel);

    const toggleBtn = panel.querySelector('#bd-helper-toggle');
    const menu = panel.querySelector('#bd-helper-menu');
    toggleBtn.addEventListener('click', () => menu.classList.toggle('open'));

    panel.querySelectorAll('input[type="checkbox"]').forEach(input => {
      input.addEventListener('change', (e) => {
        const k = e.target.dataset.key;
        config[k] = e.target.checked;
        saveConfig();
      });
    });
  }

  if (document.body) {
    initControlPanel();
  } else {
    window.addEventListener('DOMContentLoaded', initControlPanel);
  }

  // ==================== 4. 控制台启动水印 ====================
  console.log(
    `%c ${WATERMARK} %c 粉笔助手 v6.2 已加载 · by ${AUTHOR} `,
    'background:#1890ff;color:#fff;padding:2px 6px;border-radius:3px 0 0 3px;font-weight:bold;',
    'background:#e6f7ff;color:#1890ff;padding:2px 6px;border-radius:0 3px 3px 0;'
  );

})();
