import * as vscode from 'vscode';
import { existsSync } from 'fs';
import { config } from '../extension';
import { parseSourceFile } from '../utils';

export default vscode.commands.registerCommand('ojassist.dataFile', () => {
    if (vscode.window.activeTextEditor) {
        let sourceFile = parseSourceFile(vscode.window.activeTextEditor?.document.uri, config, vscode.window.activeTextEditor?.document.getText());
        if (sourceFile === null) {
            vscode.window.showErrorMessage(`OJ-Assistant: This is not a valid source code.`);
            return "";
        } else if (!existsSync(sourceFile.dataInputFile.fsPath)) {
            // Cancell this session.
            vscode.window.showErrorMessage(`OJ-Assistant: Debug cancelled due to no data input found.`);
            vscode.commands.executeCommand('ojassist.data');
            setTimeout(vscode.debug.stopDebugging, 10);
        }
        return sourceFile.dataInputFile.fsPath;
    }
    return "";
});