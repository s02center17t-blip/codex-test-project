// ==UserScript==
// @name         Social Comment Quick Reply Helper (Manual Send)
// @namespace    https://example.local/
// @version      1.1.0
// @description  Assist with faster replies on YouTube/TikTok. Supports one-click bulk draft preparation while requiring manual send.
// @match        https://www.youtube.com/*
// @match        https://*.tiktok.com/*
// @grant        none
// ==/UserScript==

(function () {
  'use strict';

  const UI_ID = 'scqrh-panel';
  const HIGHLIGHT_CLASS = 'scqrh-highlight';

  const state = {
    message: localStorage.getItem('scqrh_message') || 'Thanks for your comment!',
    batchLimit: Number(localStorage.getItem('scqrh_batch_limit') || 20),
  };

  function injectStyles() {
    const style = document.createElement('style');
    style.textContent = `
      #${UI_ID} {
        position: fixed;
        right: 16px;
        bottom: 16px;
        z-index: 2147483647;
        width: 340px;
        background: #111;
        color: #fff;
        border: 1px solid #444;
        border-radius: 10px;
        box-shadow: 0 6px 20px rgba(0,0,0,.4);
        padding: 12px;
        font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
      }
      #${UI_ID} textarea {
        width: 100%;
        min-height: 80px;
        resize: vertical;
        border-radius: 8px;
        border: 1px solid #444;
        background: #1b1b1b;
        color: #fff;
        padding: 8px;
        box-sizing: border-box;
      }
      #${UI_ID} input[type="number"] {
        width: 100%;
        border-radius: 8px;
        border: 1px solid #444;
        background: #1b1b1b;
        color: #fff;
        padding: 8px;
        box-sizing: border-box;
      }
      #${UI_ID} .row {
        display: flex;
        gap: 8px;
        margin-top: 8px;
      }
      #${UI_ID} button {
        flex: 1;
        border: 0;
        border-radius: 8px;
        padding: 8px 10px;
        cursor: pointer;
        background: #2f6feb;
        color: #fff;
      }
      #${UI_ID} button.secondary {
        background: #333;
      }
      #${UI_ID} small {
        display: block;
        margin-top: 8px;
        color: #bbb;
      }
      .${HIGHLIGHT_CLASS} {
        outline: 2px solid #2f6feb !important;
        outline-offset: 2px !important;
      }
    `;
    document.head.appendChild(style);
  }

  function createPanel() {
    if (document.getElementById(UI_ID)) return;

    const panel = document.createElement('div');
    panel.id = UI_ID;
    panel.innerHTML = `
      <div style="font-weight:700; margin-bottom:6px;">快速回复助手（手动发送）</div>
      <textarea id="scqrh-msg" placeholder="输入你常用的回复模板"></textarea>
      <div class="row">
        <button id="scqrh-highlight">高亮可回复评论</button>
        <button id="scqrh-open" class="secondary">尝试打开回复框</button>
      </div>
      <div class="row">
        <button id="scqrh-batch">一键批量准备（不发送）</button>
      </div>
      <div class="row" style="display:block;">
        <label for="scqrh-limit" style="font-size:12px;color:#bbb;display:block;margin-bottom:4px;">单次处理上限（1-50）</label>
        <input id="scqrh-limit" type="number" min="1" max="50" />
      </div>
      <div class="row">
        <button id="scqrh-fill">填入到当前激活输入框</button>
        <button id="scqrh-copy" class="secondary">复制模板</button>
      </div>
      <small>
        说明：本工具不会自动点击“发送”。你必须逐条手动确认发送。
      </small>
    `;

    document.body.appendChild(panel);

    const textarea = panel.querySelector('#scqrh-msg');
    textarea.value = state.message;
    textarea.addEventListener('input', () => {
      state.message = textarea.value;
      localStorage.setItem('scqrh_message', state.message);
    });

    const limitInput = panel.querySelector('#scqrh-limit');
    limitInput.value = String(state.batchLimit);
    limitInput.addEventListener('change', () => {
      const next = Math.max(1, Math.min(50, Number(limitInput.value) || 20));
      state.batchLimit = next;
      limitInput.value = String(next);
      localStorage.setItem('scqrh_batch_limit', String(next));
    });

    panel.querySelector('#scqrh-highlight').addEventListener('click', highlightReplyTargets);
    panel.querySelector('#scqrh-open').addEventListener('click', openReplyBoxes);
    panel.querySelector('#scqrh-batch').addEventListener('click', batchPrepareReplies);
    panel.querySelector('#scqrh-fill').addEventListener('click', fillFocusedInput);
    panel.querySelector('#scqrh-copy').addEventListener('click', copyTemplate);
  }

  function getReplyButtons() {
    const selectors = [
      // YouTube
      'ytd-comment-thread-renderer #reply-button-end button',
      'ytd-comment-renderer #reply-button-end button',
      // TikTok (selector may vary by locale/version)
      'button[data-e2e*="comment-reply" i]',
      'button[class*="reply" i]',
      '[role="button"][aria-label*="reply" i]'
    ];

    const nodes = selectors.flatMap((sel) => Array.from(document.querySelectorAll(sel)));
    return Array.from(new Set(nodes)).filter((el) => isVisible(el));
  }

  function isVisible(el) {
    const rect = el.getBoundingClientRect();
    return rect.width > 0 && rect.height > 0;
  }

  function highlightReplyTargets() {
    document.querySelectorAll(`.${HIGHLIGHT_CLASS}`).forEach((el) => el.classList.remove(HIGHLIGHT_CLASS));
    const buttons = getReplyButtons();
    buttons.forEach((btn) => {
      const commentCard = btn.closest('ytd-comment-thread-renderer, ytd-comment-renderer, li, div');
      if (commentCard) commentCard.classList.add(HIGHLIGHT_CLASS);
    });
    alert(`找到 ${buttons.length} 个可回复入口（已高亮）。`);
  }

  function openReplyBoxes() {
    const buttons = getReplyButtons();
    let clicked = 0;
    buttons.slice(0, state.batchLimit).forEach((btn) => {
      btn.click();
      clicked += 1;
    });
    alert(`已尝试打开 ${clicked} 个回复框。请逐条人工检查后发送。`);
  }

  function getReplyEditors() {
    const selectors = [
      // YouTube editable reply area
      'ytd-comment-replies-renderer [contenteditable="true"]',
      // TikTok possible text inputs
      '[data-e2e*="comment-reply-input" i]',
      'div[contenteditable="true"][class*="comment" i]',
      'textarea[class*="comment" i]',
      'textarea[placeholder*="reply" i]',
    ];
    const nodes = selectors.flatMap((sel) => Array.from(document.querySelectorAll(sel)));
    return Array.from(new Set(nodes)).filter((el) => isVisible(el));
  }

  function setEditorText(editor, text) {
    if (!editor || !text) return false;

    if (editor.isContentEditable) {
      editor.focus();
      editor.dispatchEvent(new FocusEvent('focus', { bubbles: true }));
      document.execCommand('selectAll', false, null);
      document.execCommand('insertText', false, text);
      editor.dispatchEvent(new Event('input', { bubbles: true }));
      return true;
    }

    if (editor.tagName === 'TEXTAREA' || editor.tagName === 'INPUT') {
      editor.focus();
      editor.value = text;
      editor.dispatchEvent(new Event('input', { bubbles: true }));
      return true;
    }

    return false;
  }

  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async function batchPrepareReplies() {
    const text = state.message.trim();
    if (!text) {
      alert('请先输入回复模板。');
      return;
    }

    const replyButtons = getReplyButtons().slice(0, state.batchLimit);
    if (replyButtons.length === 0) {
      alert('未找到可回复入口。请先滚动到评论区。');
      return;
    }

    for (const button of replyButtons) {
      button.click();
      await sleep(180);
    }

    await sleep(300);

    const editors = getReplyEditors().slice(0, state.batchLimit);
    let filled = 0;
    editors.forEach((editor) => {
      if (setEditorText(editor, text)) filled += 1;
    });

    const firstSendHint = findLikelySendButton();
    if (firstSendHint) {
      firstSendHint.scrollIntoView({ behavior: 'smooth', block: 'center' });
      firstSendHint.classList.add(HIGHLIGHT_CLASS);
      setTimeout(() => firstSendHint.classList.remove(HIGHLIGHT_CLASS), 1200);
    }

    alert(`已批量准备 ${filled} 条回复草稿。请你逐条手动点击发送。`);
  }

  function findLikelySendButton() {
    const selectors = [
      'ytd-comment-replies-renderer #submit-button button',
      'button[data-e2e*="comment-post" i]',
      'button[aria-label*="reply" i][type="submit"]',
      'button[type="submit"]',
    ];
    for (const sel of selectors) {
      const found = Array.from(document.querySelectorAll(sel)).find((el) => isVisible(el));
      if (found) return found;
    }
    return null;
  }

  function fillFocusedInput() {
    const active = document.activeElement;
    const text = state.message.trim();
    if (!text) {
      alert('请先输入回复模板。');
      return;
    }

    if (!active) {
      alert('请先点击一个评论回复输入框。');
      return;
    }

    if (active.isContentEditable) {
      active.focus();
      document.execCommand('selectAll', false, null);
      document.execCommand('insertText', false, text);
      return;
    }

    if (active.tagName === 'TEXTAREA' || active.tagName === 'INPUT') {
      active.value = text;
      active.dispatchEvent(new Event('input', { bubbles: true }));
      return;
    }

    alert('当前激活元素不是可输入的回复框，请先点击回复输入框。');
  }

  async function copyTemplate() {
    try {
      await navigator.clipboard.writeText(state.message);
      alert('已复制模板，可粘贴到回复框。');
    } catch {
      alert('复制失败：浏览器可能阻止了剪贴板访问。');
    }
  }

  const boot = () => {
    injectStyles();
    createPanel();
  };

  if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
})();
