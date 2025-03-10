/*
 * @Author: Diana Tang
 * @Date: 2025-03-10 12:44:36
 * @LastEditors: Diana Tang
 * @Description: some description
 * @FilePath: /jest-test-generator/src/extension.ts
 */
// src/extension.ts
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { analyzeSourceFile } from './analyzer';
import { generateTestFile } from './generator';

export function activate(context: vscode.ExtensionContext) {
  console.log('Jest Test Generator extension is now active!');

  let disposable = vscode.commands.registerCommand('jest-test-generator.generateTest', async () => {
    // Get the active text editor
    const editor = vscode.window.activeTextEditor;
    
    if (!editor) {
      vscode.window.showErrorMessage('No active file selected. Please open a file first.');
      return;
    }
    
    const document = editor.document;
    const filePath = document.uri.fsPath;
    
    // Only process JavaScript and TypeScript files
    if (!filePath.endsWith('.js') && !filePath.endsWith('.ts') && 
        !filePath.endsWith('.jsx') && !filePath.endsWith('.tsx')) {
      vscode.window.showErrorMessage('The selected file must be a JavaScript or TypeScript file.');
      return;
    }
    
    try {
      // Read file content
      const sourceCode = document.getText();
      
      // Analyze the source file to extract functions, classes, etc.
      const analysisResult = await analyzeSourceFile(sourceCode, path.extname(filePath).substring(1));
      
      // Generate test content based on analysis
      const testContent = generateTestFile(analysisResult, path.basename(filePath));
      
      // Get configurations
      const config = vscode.workspace.getConfiguration('jestTestGenerator');
      const testFileSuffix = config.get<string>('testFileSuffix', '.test');
      const testFileLocation = config.get<string>('testFileLocation', 'same');
      
      // Determine test file path
      let testFilePath = determineTestFilePath(filePath, testFileSuffix, testFileLocation);
      
      // Confirm with user before overwriting existing test file
      if (fs.existsSync(testFilePath)) {
        const response = await vscode.window.showWarningMessage(
          `Test file already exists at ${testFilePath}. Do you want to overwrite it?`,
          'Yes', 'No'
        );
        
        if (response !== 'Yes') {
          vscode.window.showInformationMessage('Test generation cancelled.');
          return;
        }
      }
      
      // Write test file
      fs.writeFileSync(testFilePath, testContent);
      
      // Open the generated test file
      const testDocument = await vscode.workspace.openTextDocument(testFilePath);
      vscode.window.showTextDocument(testDocument);
      
      vscode.window.showInformationMessage(`Jest test generated successfully at ${testFilePath}`);
    } catch (error) {
      vscode.window.showErrorMessage(`Error generating Jest test: ${error instanceof Error ? error.message : String(error)}`);
    }
  });

  context.subscriptions.push(disposable);
}

function determineTestFilePath(filePath: string, testFileSuffix: string, testFileLocation: string): string {
  const dirPath = path.dirname(filePath);
  const extname = path.extname(filePath);
  const basename = path.basename(filePath, extname);
  
  switch (testFileLocation) {
    case 'adjacent':
      return path.join(dirPath, `${basename}${testFileSuffix}${extname}`);
    case '__tests__':
      const testsDir = path.join(dirPath, '__tests__');
      if (!fs.existsSync(testsDir)) {
        fs.mkdirSync(testsDir, { recursive: true });
      }
      return path.join(testsDir, `${basename}${testFileSuffix}${extname}`);
    case 'same':
    default:
      return path.join(dirPath, `${basename}${testFileSuffix}${extname}`);
  }
}

export function deactivate() {}