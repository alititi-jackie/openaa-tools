// OpenAA Tools - 主应用脚本

// 工具数据库
const TOOLS_DB = [
  {
    id: 'retire-401k',
    name: '401(k)退休计算器',
    icon: '📊',
    category: '财务',
    description: '美国401(k)退休账户计算器，帮你规划退休储蓄。',
    path: '/tools/401k-calculator/',
    tags: ['财务', '计算器'],
    features: ['实时计算', '多参数支持']
  }
];

// 工具分类
const CATEGORIES = {
  '财务': '💰',
  '计算': '🧮',
  '生活': '🏠',
  '开发': '💻'
};

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
  initializeNavigation();
  initializeSearch();
  initializeFilters();
});

// 初始化导航
function initializeNavigation() {
  const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
  const nav = document.querySelector('.nav');

  if (mobileMenuToggle && nav) {
    mobileMenuToggle.addEventListener('click', () => {
      nav.classList.toggle('active');
    });

    // 关闭菜单当点击链接时
    nav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        nav.classList.remove('active');
      });
    });
  }

  // 更新活跃导航项
  updateActiveNav();
}

// 更新活跃导航项
function updateActiveNav() {
  const currentPath = window.location.pathname;
  document.querySelectorAll('.nav a').forEach(link => {
    const href = link.getAttribute('href');
    if (href === '/' && currentPath === '/') {
      link.classList.add('active');
    } else if (href !== '/' && currentPath.startsWith(href)) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });
}

// 初始化搜索
function initializeSearch() {
  const searchInput = document.querySelector('[data-search-input]');
  const searchBtn = document.querySelector('[data-search-btn]');

  if (searchInput && searchBtn) {
    searchBtn.addEventListener('click', () => {
      const query = searchInput.value.trim();
      if (query) {
        // 重定向到工具列表页，带搜索参数
        window.location.href = `/tools/?search=${encodeURIComponent(query)}`;
      }
    });

    searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        searchBtn.click();
      }
    });
  }
}

// 初始化筛选
function initializeFilters() {
  const categoryFilter = document.querySelector('[data-category-filter]');
  const sortSelect = document.querySelector('[data-sort-select]');

  if (categoryFilter) {
    categoryFilter.addEventListener('change', filterTools);
  }

  if (sortSelect) {
    sortSelect.addEventListener('change', filterTools);
  }
}

// 筛选工具
function filterTools() {
  const category = document.querySelector('[data-category-filter]')?.value || 'all';
  const sort = document.querySelector('[data-sort-select]')?.value || 'name';
  const search = new URLSearchParams(window.location.search).get('search') || '';

  // 构造新的查询参数
  const params = new URLSearchParams();
  if (category !== 'all') params.set('category', category);
  if (search) params.set('search', search);
  if (sort !== 'name') params.set('sort', sort);

  // 重定向到新的 URL
  const newUrl = `/tools/${params.toString() ? '?' + params.toString() : ''}`;
  window.location.href = newUrl;
}

// 获取工具列表
function getTools(filter = {}) {
  let tools = [...TOOLS_DB];

  // 按分类筛选
  if (filter.category) {
    tools = tools.filter(tool => tool.category === filter.category);
  }

  // 按搜索词筛选
  if (filter.search) {
    const query = filter.search.toLowerCase();
    tools = tools.filter(tool =>
      tool.name.toLowerCase().includes(query) ||
      tool.description.toLowerCase().includes(query) ||
      tool.tags.some(tag => tag.toLowerCase().includes(query))
    );
  }

  // 排序
  if (filter.sort === 'new') {
    tools.reverse();
  } else if (filter.sort === 'popularity') {
    // 这里可以添加热度排序逻辑
  }

  return tools;
}

// 渲染工具卡片
function renderToolCard(tool) {
  const tagsHtml = tool.tags
    .map(tag => `<span class="tool-tag-small">${tag}</span>`)
    .join('');

  return `
    <a href="${tool.path}" class="tool-list-card">
      <div class="tool-header">
        <div class="tool-icon-large">${tool.icon}</div>
        <div class="tool-header-content">
          <h3>${tool.name}</h3>
          <span class="tool-category-badge">${tool.category}</span>
        </div>
      </div>
      <p class="tool-description">${tool.description}</p>
      <ul class="tool-features">
        ${tool.features.map(f => `<li>${f}</li>`).join('')}
      </ul>
      <div class="tool-footer">
        <div class="tool-tags-list">${tagsHtml}</div>
        <span class="tool-enter-btn">进入 →</span>
      </div>
    </a>
  `;
}

// 导出公共函数
window.openaaApp = {
  getTools,
  renderToolCard,
  TOOLS_DB,
  CATEGORIES
};
