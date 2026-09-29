// 公共头部交互脚本

(function() {
  'use strict';

  // 处理移动菜单
  const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
  const nav = document.querySelector('.nav');

  if (mobileMenuToggle && nav) {
    mobileMenuToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      nav.classList.toggle('mobile-active');
    });

    // 点击其他地方关闭菜单
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.openaa-header')) {
        nav.classList.remove('mobile-active');
      }
    });

    // 点击菜单项关闭菜单
    nav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        nav.classList.remove('mobile-active');
      });
    });
  }

  // 页面滚动时处理粘性头部效果
  let lastScroll = 0;
  const header = document.querySelector('.openaa-header');

  if (header && header.classList.contains('sticky')) {
    window.addEventListener('scroll', () => {
      const currentScroll = window.pageYOffset;

      if (currentScroll <= 0) {
        header.classList.remove('scrolled');
      } else {
        header.classList.add('scrolled');
      }

      lastScroll = currentScroll;
    });
  }

  // 设置主题切换（可选）
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
  function updateTheme(dark) {
    if (dark) {
      document.documentElement.classList.add('dark-mode');
    } else {
      document.documentElement.classList.remove('dark-mode');
    }
  }

  updateTheme(prefersDark.matches);
  prefersDark.addEventListener('change', (e) => updateTheme(e.matches));
})();
