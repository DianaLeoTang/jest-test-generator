import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';

suite('Extension Test Suite', () => {
  vscode.window.showInformationMessage('Start all tests.');

  test('Extension should be present', () => {
    assert.ok(vscode.extensions.getExtension('jest-test-generator-publisher.jest-test-generator'));
  });

  test('Should register commands', async () => {
    const commands = await vscode.commands.getCommands();
    assert.ok(commands.includes('jest-test-generator.generateTest'));
  });
});