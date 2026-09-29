/**
 * OpenAA 工具库 - 工具注册表
 */

const TOOLS_CONFIG = {
  categories: [
    {
      id: 'finance',
      name: '💰 财务工具',
      description: '贷款计算、投资回报、税务规划',
      color: '#0066FF'
    },
    {
      id: 'convert',
      name: '🔄 单位转换',
      description: '长度、面积、重量、温度',
      color: '#00D9FF'
    },
    {
      id: 'usa',
      name: '🇺🇸 美国专用',
      description: 'DMV、税务、时差',
      color: '#FF6B35'
    },
    {
      id: 'lifestyle',
      name: '🛠️ 生活工具',
      description: '购物、账单、提示',
      color: '#00D084'
    }
  ],

  tools: [
    // 财务工具
    {
      id: '401k-calculator',
      name: '401(k) 退休计算器',
      category: 'finance',
      icon: '💰',
      description: '美国 401(k) 退休储蓄计算',
      path: '/tools/401k-calculator/',
      featured: true
    },
    {
      id: 'mortgage',
      name: '房屋贷款计算器',
      category: 'finance',
      icon: '🏠',
      description: '计算房屋贷款月供和利息',
      path: '/tools/mortgage/',
      featured: true
    },
    {
      id: 'salary-calculator',
      name: '薪资计算器',
      category: 'finance',
      icon: '💼',
      description: '计算税后薪资和收入',
      path: '/tools/salary-calculator/',
      featured: true
    },
    {
      id: 'credit-card-payoff',
      name: '信用卡还款计划',
      category: 'finance',
      icon: '💳',
      description: '制定信用卡还款策略',
      path: '/tools/credit-card-payoff/',
      featured: false
    },
    {
      id: 'compound-interest',
      name: '复利计算器',
      category: 'finance',
      icon: '📈',
      description: '计算复利投资回报',
      path: '/tools/compound-interest/',
      featured: false
    },
    {
      id: 'rent-vs-buy',
      name: '租 vs 买房',
      category: 'finance',
      icon: '🔄',
      description: '比较租房和买房的成本',
      path: '/tools/rent-vs-buy/',
      featured: false
    },

    // 转换工具
    {
      id: 'currency',
      name: '货币转换',
      category: 'convert',
      icon: '💵',
      description: '实时汇率转换计算',
      path: '/tools/currency/',
      featured: true
    },
    {
      id: 'temperature',
      name: '温度转换',
      category: 'convert',
      icon: '🌡️',
      description: '摄氏度和华氏度转换',
      path: '/tools/temperature/',
      featured: true
    },
    {
      id: 'length',
      name: '长度转换',
      category: 'convert',
      icon: '📏',
      description: '米、英寸、英尺等单位转换',
      path: '/tools/length/',
      featured: false
    },
    {
      id: 'weight',
      name: '重量转换',
      category: 'convert',
      icon: '⚖️',
      description: '公斤、磅、克等单位转换',
      path: '/tools/weight/',
      featured: false
    },
    {
      id: 'area',
      name: '面积转换',
      category: 'convert',
      icon: '📐',
      description: '平方米、英尺等单位转换',
      path: '/tools/area/',
      featured: false
    },
    {
      id: 'distance',
      name: '距离转换',
      category: 'convert',
      icon: '🚗',
      description: '公里、英里等单位转换',
      path: '/tools/distance/',
      featured: false
    },

    // 生活工具
    {
      id: 'tip-calculator',
      name: '小费计算器',
      category: 'lifestyle',
      icon: '🧮',
      description: '快速计算小费和账单',
      path: '/tools/tip-calculator/',
      featured: true
    },
    {
      id: 'split-bill',
      name: '账单分割',
      category: 'lifestyle',
      icon: '👥',
      description: '平均分割账单金额',
      path: '/tools/split-bill/',
      featured: false
    },
    {
      id: 'sales-tax',
      name: '销售税计算',
      category: 'lifestyle',
      icon: '🛍️',
      description: '计算产品的最终价格',
      path: '/tools/sales-tax/',
      featured: false
    },
    {
      id: 'discount',
      name: '折扣计算器',
      category: 'lifestyle',
      icon: '🏷️',
      description: '计算折扣后的价格',
      path: '/tools/discount/',
      featured: false
    },

    // 美国专用工具
    {
      id: 'dmv-real-id',
      name: 'DMV Real ID 检查',
      category: 'usa',
      icon: '🪪',
      description: '检查您的州身份证是否符合 Real ID',
      path: '/usa/dmv/real-id-checker.html',
      featured: false
    }
  ],

  getFeaturedTools() {
    return this.tools.filter(tool => tool.featured);
  },

  getToolsByCategory(categoryId) {
    return this.tools.filter(tool => tool.category === categoryId);
  },

  getToolById(toolId) {
    return this.tools.find(tool => tool.id === toolId);
  },

  getCategory(categoryId) {
    return this.categories.find(cat => cat.id === categoryId);
  }
};

// 导出配置
if (typeof module !== 'undefined' && module.exports) {
  module.exports = TOOLS_CONFIG;
}
