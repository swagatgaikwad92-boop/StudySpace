/**
 * Critical bootstrap — runs without modules so buttons always work.
 * Full module app enhances this when it loads.
 */
(function () {
  'use strict';

  function $(id) { return document.getElementById(id); }

  function toast(msg) {
    var c = $('toast-container');
    if (!c) return;
    var t = document.createElement('div');
    t.className = 'toast show';
    t.textContent = msg;
    t.style.cssText = 'padding:12px 18px;font-size:13px;color:#2c2a26;border-radius:12px;background:rgba(255,255,255,.92);box-shadow:0 4px 20px rgba(44,42,38,.1);margin-top:8px';
    c.appendChild(t);
    setTimeout(function () { t.remove(); }, 2600);
  }

  function openMenu(menu, anchor) {
    if (!menu || !anchor) return;
    // close others
    closeAll();
    menu.hidden = false;
    var rect = anchor.getBoundingClientRect();
    if (menu.id === 'add-menu') {
      menu.style.left = (rect.left + rect.width / 2) + 'px';
      menu.style.bottom = (window.innerHeight - rect.top + 12) + 'px';
      menu.style.top = 'auto';
      menu.style.right = 'auto';
      menu.style.transform = 'translateX(-50%)';
    } else {
      menu.style.right = Math.max(12, window.innerWidth - rect.right) + 'px';
      menu.style.bottom = (window.innerHeight - rect.top + 12) + 'px';
      menu.style.left = 'auto';
      menu.style.top = 'auto';
      menu.style.transform = 'none';
    }
    requestAnimationFrame(function () { menu.classList.add('open'); });
  }

  function closeMenu(menu) {
    if (!menu) return;
    menu.classList.remove('open');
    setTimeout(function () { menu.hidden = true; }, 180);
  }

  function closeAll() {
    closeMenu($('add-menu'));
    closeMenu($('tools-menu'));
  }

  function triggerFile(id) {
    var input = $(id);
    if (input) input.click();
  }

  // Expose for module app to take over
  window.__studySpaceBootstrap = {
    openMenu: openMenu,
    closeAll: closeAll,
    toast: toast,
    ready: false
  };

  function onReady() {
    var addBtn = $('add-btn');
    var toolsBtn = $('tools-btn');
    var addMenu = $('add-menu');
    var toolsMenu = $('tools-menu');

    if (addBtn) {
      addBtn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        if (addMenu && addMenu.classList.contains('open')) closeMenu(addMenu);
        else openMenu(addMenu, addBtn);
      });
    }

    if (toolsBtn) {
      toolsBtn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        if (toolsMenu && toolsMenu.classList.contains('open')) closeMenu(toolsMenu);
        else openMenu(toolsMenu, toolsBtn);
      });
    }

    // Add menu actions — dispatch custom events the module app listens to
    if (addMenu) {
      addMenu.addEventListener('click', function (e) {
        var item = e.target.closest('[data-action]');
        if (!item) return;
        // Module app owns routing once ready
        if (window.__studySpaceApp) return;
        e.preventDefault();
        e.stopPropagation();
        closeAll();
        var action = item.getAttribute('data-action');
        if (action === 'add-pdf') triggerFile('file-pdf');
        else if (action === 'add-image') triggerFile('file-image');
        else if (action === 'add-file') triggerFile('file-any');
        else if (action === 'add-camera') triggerFile('file-camera');
        else if (action === 'add-video') {
          var url = prompt('Paste a YouTube URL:');
          if (url) window.dispatchEvent(new CustomEvent('ss:add-video', { detail: { url: url } }));
        } else if (action === 'add-text') {
          window.dispatchEvent(new CustomEvent('ss:add-text'));
        }
      });
    }

    if (toolsMenu) {
      toolsMenu.addEventListener('click', function (e) {
        var item = e.target.closest('[data-action]');
        if (!item) return;
        if (window.__studySpaceApp) return;
        e.preventDefault();
        e.stopPropagation();
        closeAll();
        toast('Loading tools… try again in a moment');
      });
    }

    // Dismiss menus on outside tap
    document.addEventListener('pointerdown', function (e) {
      if (
        !e.target.closest('#add-menu') &&
        !e.target.closest('#tools-menu') &&
        !e.target.closest('#add-btn') &&
        !e.target.closest('#tools-btn')
      ) {
        closeAll();
      }
    });

    // Register service worker early
    if ('serviceWorker' in navigator) {
      var swUrl = new URL('sw.js', window.location.href).href;
      navigator.serviceWorker.register(swUrl).then(
        function (reg) { console.info('[SS] SW ok', reg.scope); },
        function (err) { console.warn('[SS] SW fail', err); }
      );
    }

    // Press feedback on floating buttons
    [addBtn, toolsBtn].forEach(function (btn) {
      if (!btn) return;
      btn.addEventListener('pointerdown', function () { btn.style.transform = btn.id === 'add-btn' ? 'translateX(-50%) scale(0.92)' : 'scale(0.92)'; });
      btn.addEventListener('pointerup', function () { btn.style.transform = btn.id === 'add-btn' ? 'translateX(-50%)' : ''; });
      btn.addEventListener('pointerleave', function () { btn.style.transform = btn.id === 'add-btn' ? 'translateX(-50%)' : ''; });
    });

    window.__studySpaceBootstrap.ready = true;
    console.info('[SS] Bootstrap ready');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', onReady);
  } else {
    onReady();
  }
})();
