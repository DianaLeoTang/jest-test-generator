import * as parser from '@babel/parser';
import traverse from '@babel/traverse';
import * as t from '@babel/types';

export interface FunctionInfo {
  name: string;
  params: string[];
  returnValue: string | null;
  async: boolean;
}

export interface ClassInfo {
  name: string;
  methods: FunctionInfo[];
  constructorParams: string[];
}

export interface ModuleExportInfo {
  name: string;
  type: 'function' | 'class' | 'object' | 'default';
}

export interface AnalysisResult {
  functions: FunctionInfo[];
  classes: ClassInfo[];
  exports: ModuleExportInfo[];
  imports: string[];
}

export async function analyzeSourceFile(
  sourceCode: string, 
  fileType: string
): Promise<AnalysisResult> {
  const result: AnalysisResult = {
    functions: [],
    classes: [],
    exports: [],
    imports: []
  };

  try {
    // Parse the source code
    const ast = parser.parse(sourceCode, {
      sourceType: 'module',
      plugins: [
        'jsx',
        fileType === 'ts' || fileType === 'tsx' ? 'typescript' : 'flow',
        'classProperties',
        'decorators-legacy'
      ]
    });

    // Traverse the AST to extract information
    traverse(ast, {
      // Extract function declarations
      FunctionDeclaration(path: any) {
        if (path.node.id) {
          result.functions.push({
            name: path.node.id.name,
            params: path.node.params.map((param: any) => {
              if (t.isIdentifier(param)) return param.name;
              return 'param';
            }),
            returnValue: 'unknown',
            async: path.node.async
          });
        }
      },

      // Extract arrow functions assigned to variables
      VariableDeclarator(path: any) {
        if (t.isIdentifier(path.node.id) && t.isArrowFunctionExpression(path.node.init)) {
          result.functions.push({
            name: path.node.id.name,
            params: path.node.init.params.map((param: any) => {
              if (t.isIdentifier(param)) return param.name;
              return 'param';
            }),
            returnValue: 'unknown',
            async: path.node.init.async
          });
        }
      },

      // Extract class declarations
      ClassDeclaration(path: any) {
        if (path.node.id) {
          const classInfo: ClassInfo = {
            name: path.node.id.name,
            methods: [],
            constructorParams: []
          };

          // Process class methods
          path.node.body.body.forEach((member: any) => {
            if (t.isClassMethod(member) && t.isIdentifier(member.key)) {
              if (member.kind === 'constructor') {
                classInfo.constructorParams = member.params.map((param: any) => {
                  if (t.isIdentifier(param)) return param.name;
                  return 'param';
                });
              } else {
                classInfo.methods.push({
                  name: member.key.name,
                  params: member.params.map((param: any) => {
                    if (t.isIdentifier(param)) return param.name;
                    return 'param';
                  }),
                  returnValue: 'unknown',
                  async: member.async
                });
              }
            }
          });

          result.classes.push(classInfo);
        }
      },

      // Extract exports
      ExportNamedDeclaration(path: any) {
        if (path.node.declaration) {
          if (t.isFunctionDeclaration(path.node.declaration) && path.node.declaration.id) {
            result.exports.push({
              name: path.node.declaration.id.name,
              type: 'function'
            });
          } else if (t.isClassDeclaration(path.node.declaration) && path.node.declaration.id) {
            result.exports.push({
              name: path.node.declaration.id.name,
              type: 'class'
            });
          }
        }
      },
      
      ExportDefaultDeclaration(path: any) {
        if (t.isFunctionDeclaration(path.node.declaration)) {
          result.exports.push({
            name: path.node.declaration.id?.name || 'default',
            type: 'function'
          });
        } else if (t.isClassDeclaration(path.node.declaration)) {
          result.exports.push({
            name: path.node.declaration.id?.name || 'default',
            type: 'class'
          });
        } else {
          result.exports.push({
            name: 'default',
            type: 'object'
          });
        }
      },

      // Extract imports
      ImportDeclaration(path: any) {
        const source = path.node.source.value;
        if (typeof source === 'string' && !source.startsWith('.')) {
          result.imports.push(source);
        }
      }
    });
    
    return result;
  } catch (error) {
    console.error('Error analyzing source file:', error);
    throw error;
  }
}