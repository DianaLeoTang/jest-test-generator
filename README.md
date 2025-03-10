<!--
 * @Author: Diana Tang
 * @Date: 2025-03-10 12:41:40
 * @LastEditors: Diana Tang
 * @Description: some description
 * @FilePath: /jest-test-generator/README.md
-->
# jest-test-generator

VSCode 扩展，自动为 JavaScript 和 TypeScript 文件生成 Jest 单元测试代码。

## 特性

- 🔍 智能分析源代码，提取函数、类和模块导出
- ✅ 自动生成符合 Jest 最佳实践的测试用例
- 🛠️ 支持 JavaScript、TypeScript、JSX 和 TSX 文件
- ⚙️ 灵活配置测试文件位置和命名规则
- 🧩 可轻松集成到现有项目工作流程中

## 安装

在 VSCode 扩展市场搜索 "Jest Test Generator" 或手动安装 VSIX 文件。

## 快速开始

1. 打开任意 JavaScript 或 TypeScript 文件
2. 右键点击编辑器并选择 "Generate Jest Test"
3. 扩展将创建并打开匹配的测试文件

<img src="images/demo.gif" alt="演示" width="600"/>

## 功能演示

### 为函数生成测试

```javascript
// utils.js
export function calculate(a, b, operation) {
  switch (operation) {
    case 'add': return a + b;
    case 'subtract': return a - b;
    case 'multiply': return a * b;
    case 'divide': return b !== 0 ? a / b : null;
    default: return null;
  }
}
```

生成的测试:

```javascript
// utils.test.js
import { calculate } from '../utils';

describe('utils', () => {
  describe('calculate', () => {
    test('should be defined', () => {
      expect(calculate).toBeDefined();
    });

    test('should return the expected result', () => {
      // Arrange
      const a = 5;
      const b = 3;
      const operation = 'add';
      
      // Act
      const result = calculate(a, b, operation);
      
      // Assert
      expect(result).toBeDefined();
      expect(result).toBe(8);
    });

    test('should handle edge cases', () => {
      expect(calculate(10, 0, 'divide')).toBeNull();
      expect(calculate(10, 5, 'unknown')).toBeNull();
    });
  });
});
```

## 贡献

欢迎通过 Issues 或 Pull Requests 参与贡献。