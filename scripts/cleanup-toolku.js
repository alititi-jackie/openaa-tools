/* ToolKu => OpenAA 统一清理脚本 */
const fs = require('fs');
const path = require('path');

const REPLACE_MAP = {
  'ToolKu': 'OpenAA 工具库',
  'toolku': 'OpenAA',
  'toolku.com': 'tools.openaa.com',
  'https://toolku.com': 'https://tools.openaa.com',
  'ToolKu工具库': 'OpenAA 工具库',
  '"111827"': '"0066FF"',
  '#111827': '#0066FF',
};

function cleanHtmlFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    Object.entries(REPLACE_MAP).forEach(([old, newVal]) => {
      const regex = new RegExp(old, 'g');
      if (regex.test(content)) {
        content = content.replace(regex, newVal);
        modified = true;
      }
    });

    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✓ 已清理: ${filePath}`);
    }
    return modified;
  } catch (error) {
    console.error(`✗ 错误 ${filePath}: ${error.message}`);
    return false;
  }
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  let count = 0;

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      count += walkDir(filePath);
    } else if (file.endsWith('.html')) {
      if (cleanHtmlFile(filePath)) {
        count++;
      }
    }
  });

  return count;
}

const projectRoot = path.dirname(__dirname);
const count = walkDir(projectRoot);
console.log(`\n总计清理了 ${count} 个文件`);
