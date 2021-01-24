import * as vscode from 'vscode';
import { config } from '../extension';
import { parseSourceFile } from '../utils';

export default vscode.commands.registerTextEditorCommand('ojassist.data', async (editor: vscode.TextEditor) => {
    let sourceFile = parseSourceFile(editor.document.uri, config, editor.document.getText());
    if (sourceFile === null) {
        vscode.window.showErrorMessage(`OJ-Assistant: This is not a valid source code.`);
        return null;
    }
    vscode.workspace.openTextDocument(sourceFile.dataInputFile).then(vscode.window.showTextDocument, () => {
        vscode.workspace.openTextDocument(sourceFile!.dataInputFile.with({ scheme: 'untitled' })).then(vscode.window.showTextDocument);
    });
    return sourceFile.dataInputFile.fsPath;
});