import * as vscode from 'vscode';

import Submit from './submit';
import Data from './data';
import DataFile from './dataFile';
const commands:Array<vscode.Disposable> = [Submit, Data, DataFile ];
export function registerCommands(context: vscode.ExtensionContext) {
    for (const cmd of commands) {
        context.subscriptions.push(cmd);
    }
}