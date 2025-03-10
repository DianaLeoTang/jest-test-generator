import { AnalysisResult, FunctionInfo, ClassInfo, ModuleExportInfo } from './analyzer';

export function generateTestFile(analysisResult: AnalysisResult, sourceFileName: string): string {
  let importStatements = generateImports(analysisResult, sourceFileName);
  let testCases = '';

  // Generate test cases for functions
  analysisResult.functions.forEach(func => {
    testCases += generateFunctionTest(func);
  });

  // Generate test cases for classes
  analysisResult.classes.forEach(classInfo => {
    testCases += generateClassTest(classInfo);
  });

  // Generate test cases for exports (if specific functions/classes weren't already covered)
  const exportedNames = new Set(analysisResult.exports.map(exp => exp.name));
  const coveredNames = new Set([
    ...analysisResult.functions.map(f => f.name),
    ...analysisResult.classes.map(c => c.name)
  ]);

  analysisResult.exports.forEach(exp => {
    if (exp.name !== 'default' && !coveredNames.has(exp.name)) {
      testCases += generateExportTest(exp);
    }
  });

  // If there's a default export but it's not a specific function/class we've covered
  const hasDefaultExport = analysisResult.exports.some(exp => exp.name === 'default');
  if (hasDefaultExport) {
    testCases += generateDefaultExportTest(sourceFileName);
  }

  // If we didn't generate any tests yet, create a sample test
  if (!testCases) {
    testCases = generatePlaceholderTest(sourceFileName);
  }

  return `${importStatements}

describe('${sourceFileName}', () => {
${testCases}
});
`;
}

function generateImports(analysisResult: AnalysisResult, sourceFileName: string): string {
  const baseName = sourceFileName.replace(/\.(js|ts|jsx|tsx)$/, '');
  
  let imports = `// Import Jest matchers for extended assertions
import '@testing-library/jest-dom';\n`;
  
  // Add import for the module under test
  imports += `// Import the module under test
import `;
  
  // Check if there's a default export
  const hasDefaultExport = analysisResult.exports.some(exp => exp.name === 'default');
  
  if (hasDefaultExport) {
    const defaultExport = analysisResult.exports.find(exp => exp.name === 'default');
    const defaultName = defaultExport?.type === 'class' ? baseName : 
                       (defaultExport?.type === 'function' ? `${baseName}Function` : baseName);
    
    imports += `${defaultName}, `;
  }
  
  // Get named exports
  const namedExports = analysisResult.exports
    .filter(exp => exp.name !== 'default')
    .map(exp => exp.name);
  
  if (namedExports.length > 0) {
    imports += `{ ${namedExports.join(', ')} }`;
  } else if (hasDefaultExport) {
    // Remove trailing comma if only default export
    imports = imports.replace(', ', '');
  } else {
    // If no exports found, use a generic import
    imports += '* as moduleUnderTest';
  }
  
  imports += ` from '../${baseName}';\n`;
  
  // Add mock imports based on the module's imports
  if (analysisResult.imports.length > 0) {
    imports += '\n// Mock dependencies\n';
    analysisResult.imports.forEach(dependency => {
      imports += `jest.mock('${dependency}');\n`;
    });
  }
  
  return imports;
}

function generateFunctionTest(func: FunctionInfo): string {
  const asyncPrefix = func.async ? 'async ' : '';
  const awaitPrefix = func.async ? 'await ' : '';

  return `
  describe('${func.name}', () => {
    test('should be defined', () => {
      expect(${func.name}).toBeDefined();
    });

    test('should return the expected result', ${asyncPrefix}() => {
      // Arrange
      ${generateMockParameters(func.params)}
      
      // Act
      const result = ${awaitPrefix}${func.name}(${func.params.join(', ')});
      
      // Assert
      expect(result).toBeDefined();
      // Add more specific assertions here
    });

    test('should handle edge cases', ${asyncPrefix}() => {
      // Add tests for edge cases
      // Example: null or undefined parameters, empty arrays, etc.
    });
  });
`;
}

function generateClassTest(classInfo: ClassInfo): string {
  let tests = `
  describe('${classInfo.name}', () => {
    let instance;

    beforeEach(() => {
      // Create a new instance for each test
      ${generateMockParameters(classInfo.constructorParams)}
      instance = new ${classInfo.name}(${classInfo.constructorParams.join(', ')});
    });

    test('should instantiate correctly', () => {
      expect(instance).toBeInstanceOf(${classInfo.name});
    });
`;

  // Add tests for each method
  classInfo.methods.forEach(method => {
    const asyncPrefix = method.async ? 'async ' : '';
    const awaitPrefix = method.async ? 'await ' : '';

    tests += `
    describe('${method.name}', () => {
      test('should work correctly', ${asyncPrefix}() => {
        // Arrange
        ${generateMockParameters(method.params)}
        
        // Act
        const result = ${awaitPrefix}instance.${method.name}(${method.params.join(', ')});
        
        // Assert
        expect(result).toBeDefined();
        // Add more specific assertions here
      });
    });
`;
  });

  tests += `  });\n`;
  return tests;
}

function generateExportTest(exportInfo: ModuleExportInfo): string {
  if (exportInfo.type === 'function') {
    return `
  describe('${exportInfo.name}', () => {
    test('should be defined', () => {
      expect(${exportInfo.name}).toBeDefined();
      expect(typeof ${exportInfo.name}).toBe('function');
    });
    
    test('should return the expected result', () => {
      // Arrange
      // Add test parameters here
      
      // Act
      const result = ${exportInfo.name}(/* parameters */);
      
      // Assert
      expect(result).toBeDefined();
      // Add more specific assertions here
    });
  });
`;
  } else if (exportInfo.type === 'class') {
    return `
  describe('${exportInfo.name}', () => {
    test('should be defined', () => {
      expect(${exportInfo.name}).toBeDefined();
      expect(typeof ${exportInfo.name}).toBe('function');
      expect(new ${exportInfo.name}()).toBeInstanceOf(${exportInfo.name});
    });
    
    test('should instantiate correctly', () => {
      const instance = new ${exportInfo.name}(/* constructor parameters */);
      expect(instance).toBeInstanceOf(${exportInfo.name});
    });
  });
`;
  } else {
    return `
  describe('${exportInfo.name}', () => {
    test('should be defined', () => {
      expect(${exportInfo.name}).toBeDefined();
    });
  });
`;
  }
}

function generateDefaultExportTest(sourceFileName: string): string {
  const baseName = sourceFileName.replace(/\.(js|ts|jsx|tsx)$/, '');
  return `
  describe('default export', () => {
    test('should be defined', () => {
      expect(${baseName}).toBeDefined();
    });
    
    // Add more specific tests based on the type of default export
  });
`;
}

function generatePlaceholderTest(sourceFileName: string): string {
  return `
  test('module should be defined', () => {
    expect(moduleUnderTest).toBeDefined();
  });

  // TODO: Add more specific tests for the functionality in ${sourceFileName}
  test('placeholder example test', () => {
    // Arrange
    const input = 'test';
    
    // Act - call the function/method you want to test
    // const result = moduleUnderTest.someFunction(input);
    
    // Assert - add your assertions here
    // expect(result).toBe('expected output');
    expect(true).toBe(true); // Placeholder assertion
  });
`;
}

function generateMockParameters(params: string[]): string {
  if (params.length === 0) {
    return '// No parameters required';
  }
  
  return params.map(param => {
    if (param.includes('callback') || param.includes('Callback')) {
      return `const ${param} = jest.fn();`;
    } else if (param.includes('options') || param.includes('Options') || param.includes('config') || param.includes('Config')) {
      return `const ${param} = {}; // TODO: Set appropriate options`;
    } else if (param.toLowerCase().includes('id')) {
      return `const ${param} = '123';`;
    } else {
      return `const ${param} = '${param}'; // TODO: Replace with appropriate test value`;
    }
  }).join('\n      ');
}