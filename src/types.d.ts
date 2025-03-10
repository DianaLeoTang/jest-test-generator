/*
 * @Author: Diana Tang
 * @Date: 2025-03-10 12:45:04
 * @LastEditors: Diana Tang
 * @Description: some description
 * @FilePath: /jest-test-generator/src/types.d.ts
 */
declare module '@babel/traverse' {
    import { Node, Visitor } from '@babel/types';
    
    export interface NodePath<T = Node> {
      node: T;
      type: string;
      parent: Node;
      parentPath: NodePath;
      // 其他属性...
    }
    
    export default function traverse(
      ast: Node,
      visitor: Visitor,
      scope?: any,
      state?: any,
      parentPath?: NodePath
    ): void;
  }
  
  declare module '@babel/types' {
    export interface Node {
      type: string;
      [key: string]: any;
    }
    
    export interface Visitor {
      [key: string]: (path: any, state?: any) => void | {
        enter?: (path: any, state?: any) => void;
        exit?: (path: any, state?: any) => void;
      };
    }
    
    export function isIdentifier(node: any): boolean;
    export function isArrowFunctionExpression(node: any): boolean;
    export function isClassMethod(node: any): boolean;
    export function isFunctionDeclaration(node: any): boolean;
    export function isClassDeclaration(node: any): boolean;
    // 其他类型检查函数...
  }