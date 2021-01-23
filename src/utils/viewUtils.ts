import * as vscode from 'vscode';
import { view } from '../window';
export function playAudio(src: string) {
    if (view === undefined) { return; }
    view.webview.postMessage({
        type: 'playAudio',
        src: src
    });
}