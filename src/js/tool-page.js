/**
 * OpenAA 工具库 - 工具页面统一样式及交互
 */

class OpenAAToolPage {
  constructor() {
    this.init();
  }

  init() {
    this.setupMobileMenu();
    this.setupCopyButton();
    this.setupFormHandlers();
  }

  setupMobileMenu() {
    const menuBtn = document.querySelector('.mobile-menu-btn');
    const nav = document.querySelector('.openaa-nav');
    
    if (menuBtn && nav) {
      menuBtn.addEventListener('click', () => {
        nav.classList.toggle('active');
      });
      
      nav.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
          nav.classList.remove('active');
        });
      });
    }
  }

  setupCopyButton() {
    const copyBtns = document.querySelectorAll('[data-copy]');
    copyBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const text = btn.getAttribute('data-copy');
        navigator.clipboard.writeText(text).then(() => {
          const original = btn.textContent;
          btn.textContent = '已复制';
          setTimeout(() => {
            btn.textContent = original;
          }, 2000);
        });
      });
    });
  }

  setupFormHandlers() {
    const forms = document.querySelectorAll('.tool-form');
    forms.forEach(form => {
      form.addEventListener('input', (e) => {
        const input = e.target;
        if (input.value) {
          input.classList.add('filled');
        } else {
          input.classList.remove('filled');
        }
      });
    });
  }

  static formatNumber(num, decimals = 2) {
    return parseFloat(num).toFixed(decimals);
  }

  static formatCurrency(num, currency = 'USD') {
    const formatter = new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: currency
    });
    return formatter.format(num);
  }
}

// 初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new OpenAAToolPage();
  });
} else {
  new OpenAAToolPage();
}
