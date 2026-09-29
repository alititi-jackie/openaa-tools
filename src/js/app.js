/**
 * OpenAA 工具库 - 主应用
 */

class OpenAAApp {
  constructor() {
    this.mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    this.mobileNav = document.querySelector('.openaa-nav');
    this.init();
  }

  init() {
    this.setupMobileMenu();
    this.loadFeaturedTools();
  }

  setupMobileMenu() {
    if (this.mobileMenuBtn) {
      this.mobileMenuBtn.addEventListener('click', () => {
        this.mobileNav.classList.toggle('active');
      });

      // 点击导航链接时关闭菜单
      const navLinks = this.mobileNav.querySelectorAll('a');
      navLinks.forEach(link => {
        link.addEventListener('click', () => {
          this.mobileNav.classList.remove('active');
        });
      });
    }
  }

  async loadFeaturedTools() {
    const featuredContainer = document.getElementById('featured-tools');
    if (!featuredContainer) return;

    try {
      // 加载工具配置
      const tools = await this.getFeaturedTools();
      this.renderTools(tools, featuredContainer);
    } catch (error) {
      console.error('Error loading featured tools:', error);
    }
  }

  async getFeaturedTools() {
    // 特色工具列表
    return [
      {
        id: '401k-calculator',
        name: '401(k) 退休计算器',
        icon: '💰',
        description: '美国 401(k) 退休储蓄计算',
        path: '/tools/401k-calculator/',
        category: 'finance'
      },
      {
        id: 'mortgage',
        name: '房屋贷款计算器',
        icon: '🏠',
        description: '快速计算房屋贷款月供',
        path: '/tools/mortgage/',
        category: 'finance'
      },
      {
        id: 'currency',
        name: '货币转换',
        icon: '💵',
        description: '实时汇率转换计算',
        path: '/tools/currency/',
        category: 'convert'
      },
      {
        id: 'salary-calculator',
        name: '薪资计算器',
        icon: '💼',
        description: '计算税后薪资和收入',
        path: '/tools/salary-calculator/',
        category: 'finance'
      },
      {
        id: 'tip-calculator',
        name: '小费计算器',
        icon: '🧮',
        description: '快速计算小费和账单',
        path: '/tools/tip-calculator/',
        category: 'lifestyle'
      },
      {
        id: 'temperature',
        name: '温度转换',
        icon: '🌡️',
        description: '摄氏度和华氏度转换',
        path: '/tools/temperature/',
        category: 'convert'
      }
    ];
  }

  renderTools(tools, container) {
    container.innerHTML = tools
      .map(tool => `
        <a href="${tool.path}" class="tool-card" style="text-decoration: none;">
          <div class="tool-icon">${tool.icon}</div>
          <div class="tool-name">${tool.name}</div>
          <div class="tool-desc">${tool.description}</div>
          <div class="tool-link">使用工具 →</div>
        </a>
      `)
      .join('');
  }

  // 工具页面初始化
  static initToolPage() {
    this.setupTabs();
    this.setupFormValidation();
  }

  static setupTabs() {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
      button.addEventListener('click', () => {
        const tabName = button.getAttribute('data-tab');

        // 隐藏所有标签内容
        tabContents.forEach(content => {
          content.classList.remove('active');
        });

        // 移除所有按钮的活动状态
        tabButtons.forEach(btn => {
          btn.classList.remove('active');
        });

        // 显示选中的标签
        const activeContent = document.querySelector(`.tab-content[data-tab="${tabName}"]`);
        if (activeContent) {
          activeContent.classList.add('active');
        }
        button.classList.add('active');
      });
    });

    // 默认激活第一个标签
    if (tabButtons.length > 0) {
      tabButtons[0].click();
    }
  }

  static setupFormValidation() {
    const forms = document.querySelectorAll('.tool-form');
    forms.forEach(form => {
      form.addEventListener('input', (e) => {
        const input = e.target;
        if (input.value.trim()) {
          input.style.borderColor = 'var(--color-primary)';
        }
      });
    });
  }
}

// 页面加载完成后初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new OpenAAApp();
  });
} else {
  new OpenAAApp();
}
