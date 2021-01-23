import * as vscode from 'vscode';
import { config, ojServer } from '../extension';
import { parseSourceFile } from '../utils';

export default vscode.commands.registerTextEditorCommand('ojassist.submit', async (editor: vscode.TextEditor) => {
    vscode.window.withProgress({
        cancellable: false,
        location: vscode.ProgressLocation.Notification,
        title: `OJ-Assistant`
    }, (progress: vscode.Progress<{ increment: number, message: string }>, token: vscode.CancellationToken): Thenable<void> => {
        return new Promise(async resolve => {
            progress.report({
                increment: 10,
                message: `Preparing ...`
            });
            let sourceFile = parseSourceFile(editor.document.uri, config, editor.document.getText());
            if (sourceFile === null) {
                vscode.window.showErrorMessage(`OJ-Assistant: This is not a valid source code.`);
                resolve();
                return null;
            }
            progress.report({
                increment: 10,
                message: ` Problem#${sourceFile?.id} Uploading your code ...`
            });
            let resolver = await ojServer.submit(sourceFile);
            progress.report({
                increment: 30,
                message: ` Problem#${sourceFile?.id} Waiting for judgement ...`
            });

            let pendingJudgement = true;
            while (pendingJudgement) { // Polling
                await new Promise(resolve => setTimeout(resolve, 1000)); // Delay 1 sec.
                let submit = await resolver();

                progress.report({
                    increment: 1,
                    message: ` Problem#${sourceFile?.id} Current status: ${submit.result}`
                });

                if (submit.result !== 'Pending...' && submit.result !== 'Judging...' && submit.result !== 'Queuing') {

                    if (!pendingJudgement) { return; }
                    pendingJudgement = false;
                    resolve();
                    if (submit.result !== 'Accepted') {
                        vscode.window.showErrorMessage(`OJ-Assistant: Problem#${sourceFile?.id} Result: ${submit.result}!`);
                    } else {
                        vscode.window.showInformationMessage(`OJ-Assistant: Problem#${sourceFile?.id} Result: ${submit.result}!`);
                    }
                }
            }
        });
    });
})