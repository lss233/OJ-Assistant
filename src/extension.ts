import { promises as fs } from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { backends } from './backend';
import { DebuggerTimer } from './debugger';
import { OJ, OJAssistConfig } from './model';
import { ProblemInfoViewProvider } from './window';
import { registerCommands } from './commands';
import { parseSourceFile, playAudio } from './utils';

export * from './backend';

export let ojServer: OJ;
export let config: OJAssistConfig;
export function activate(context: vscode.ExtensionContext) {

	let debuggerTimer;
	let problemInfoViewProvider: ProblemInfoViewProvider = new ProblemInfoViewProvider(context.extensionUri, () => ojServer, () => config);

	// Initialization
	vscode.window.withProgress({
		cancellable: false,
		location: vscode.ProgressLocation.Notification,
		title: `OJ-Assistant`
	}, (progress: vscode.Progress<{ increment: number, message: string }>, token: vscode.CancellationToken): Thenable<Buffer | undefined> => {

		progress.report({
			increment: 30,
			message: "Loading config..."
		});

		let workspaceFolder = vscode.window.activeTextEditor ? vscode.workspace.getWorkspaceFolder(vscode.window.activeTextEditor!.document.uri)! : vscode.workspace.workspaceFolders![0];

		return fs.readFile(path.join(workspaceFolder.uri.fsPath, '.ojassistconfig.json'));

	}).then(configBuffer => {
		
		config = JSON.parse(configBuffer!.toString());
		ojServer = new backends[config.backend](config);
		return ojServer.login();

	}).then(() => {

		if (vscode.window.activeTextEditor !== undefined) {
			problemInfoViewProvider.renderView(
				parseSourceFile(
					vscode.window.activeTextEditor.document.uri!,
					config,
					vscode.window.activeTextEditor.document.getText()!
				)!
			);
		}
		registerCommands(context);
		console.log('OJ-Assistant: I\'m now alive.');

	});

	// Automatically reload
	context.subscriptions.push(
		vscode.commands.registerTextEditorCommand('ojassist.reload', async (editor: vscode.TextEditor) => {
			const configBuffer = await fs.readFile(path.join(vscode.workspace.getWorkspaceFolder(editor.document.uri)!.uri.fsPath, '.ojassistconfig.json'));
			config = JSON.parse(configBuffer.toString());
			ojServer = new backends[config.backend](config);
			await ojServer.login();
		})
	);

	vscode.workspace.onDidOpenTextDocument(() => {
		if (config === undefined) {
			vscode.commands.executeCommand('ojassist.reload');
		}
	});

	// Initialize ProblemInfo viewer
	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider(ProblemInfoViewProvider.viewType, problemInfoViewProvider));


	debuggerTimer = new DebuggerTimer();
	debuggerTimer.hook();
}
export function deactivate() { }
