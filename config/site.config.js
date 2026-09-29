/**
 * OpenAA 工具库 - 网站配置
 */

const SITE_CONFIG = {
  // 基本信息
  site: {
    name: 'OpenAA 工具库',
    shortName: 'Tools',
    domain: 'tools.openaa.com',
    url: 'https://tools.openaa.com',
    description: '40+ 专业实用工具集合，助力工作和生活',
    keywords: 'OpenAA,工具,计算器,转换器,财务工具,生活工具',
    logo: '/assets/logo.svg',
    favicon: '/favicon.ico',
    language: 'zh-CN',
    timezone: 'UTC'
  },

  // 品牌设置
  branding: {
    colors: {
      primary: '#0066FF',
      secondary: '#00D9FF',
      accent: '#FF6B35',
      success: '#00D084',
      warning: '#FFA500',
      error: '#FF3B30',
      background: '#FFFFFF',
      backgroundSecondary: '#F8F9FB',
      backgroundDark: '#0F1419',
      textPrimary: '#1A1A1A',
      textSecondary: '#666666',
      border: '#E5E7EB'
    },
    typography: {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, sans-serif',
      fontMono: '"Monaco", "Courier New", monospace',
      fontBrand: '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    }
  },

  // SEO
  seo: {
    defaultLocale: 'zh-CN',
    alternateLocales: ['en-US', 'zh-TW'],
    enableSitemap: true,
    enableRobots: true,
    ogImage: '/assets/og-image.png',
    twitterHandle: '@openaa',
    googleVerification: ''
  },

  // 社交媒体
  social: {
    github: 'https://github.com/alititi-jackie/openaa-tools',
    twitter: 'https://twitter.com/openaa',
    homepage: 'https://www.openaa.com/',
    email: 'contact@openaa.com'
  },

  // 功能开关
  features: {
    analytics: true,
    comments: false,
    darkMode: false,
    multiLanguage: true,
    serviceWorker: true,
    offlineMode: true
  },

  // 页面配置
  pages: {
    home: {
      title: 'OpenAA 工具库',
      description: '40+ 专业实用工具集合',
      keywords: 'OpenAA,工具,计算器'
    },
    tools: {
      title: '全部工具 | OpenAA 工具库',
      description: '浏览我们的全部工具',
      pageSize: 12
    }
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = SITE_CONFIG;
}
