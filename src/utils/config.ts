import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { Configuration } from '../model'
import { dir } from 'console';
async function exists(filename: string): Promise<boolean> {
    console.log(filename)
    try {
        await fs.promises.stat(filename);
        return true;
    } catch (err) {
        if (err.code === 'ENOENT') {
            return false;
        } else {
            throw err;
        }
    }
}
export async function getConfiguration(fromPath: vscode.Uri): Promise<Configuration | undefined> {
    let dirname = path.dirname(fromPath.fsPath);
    while(!await exists(dirname + '/.ojassistconfig.json')) {
        dirname = path.resolve(dirname, '..');
        if(!dirname.startsWith(vscode.workspace.getWorkspaceFolder(fromPath)!.uri.fsPath)) {
            return undefined;
        }
    }
    let data = await fs.promises.readFile(dirname + '/.ojassistconfig.json', 'utf-8');
    
    return JSON.parse(data);
    
}