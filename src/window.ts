import * as vscode from 'vscode';
import { OJ, OJAssistConfig, ProblemInfo } from "./model";
import { parseSourceFile } from "./utils";
import * as path from 'path';

let _view!: vscode.WebviewView;
export let view = _view;
export class ProblemInfoViewProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'ojassistant.problemInfoView';
    public currentProblem!: ProblemInfo;

    private _view!: vscode.WebviewView;

    constructor(
        private readonly extensionUri: vscode.Uri,
        private readonly oj: () => OJ,
        private readonly config: () => OJAssistConfig,
    ) {

        vscode.window.onDidChangeActiveTextEditor(editor => {
            if (editor === null) {
                return null;
            }
            let sourceFile = parseSourceFile(editor!.document.uri, config(), editor!.document.getText());
            if (sourceFile === null) {
                return;
            }
            this.renderView(sourceFile);
        });
    }

    resolveWebviewView(webviewView: vscode.WebviewView, context: vscode.WebviewViewResolveContext<unknown>, token: vscode.CancellationToken): void | Thenable<void> {
        this._view = webviewView;
        view = webviewView;
        webviewView.webview.html = '<h1 align="center">OJ-Assistant</h1>';
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [
                vscode.Uri.joinPath(this.extensionUri, 'assets'),
                vscode.Uri.joinPath(this.extensionUri, 'assets', 'css'),
                vscode.Uri.joinPath(this.extensionUri, 'assets'),
                this.extensionUri,
                vscode.Uri.parse('vscode-webview://webviewview-ojassistant-probleminfoview')
            ]
        };
    }
    public renderView(problemInfo: ProblemInfo): void {
        if (this._view === undefined || problemInfo === undefined || (this.currentProblem !== undefined && (this.currentProblem.id === problemInfo.id && this.currentProblem.contestId === problemInfo.contestId))) { return; }
        const nonce = getNonce();
        const templateHtml = `<!DOCTYPE html>
        <html>
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <meta
                    http-equiv="Content-Security-Policy"
                    content="default-src 'none';
                    img-src ${this._view.webview.cspSource} https: 'strict-dynamic';
                    script-src ${this._view.webview.cspSource} 'nonce-${nonce}';
                    style-src ${this._view.webview.cspSource} 'self' 'unsafe-inline' https:;
                    media-src ${this._view.webview.cspSource} vscode-webview: https:;
                    font-src  ${this._view.webview.cspSource} https: vscode-webview:"
                />

                <style nonce="${nonce}">
                    h2 {
                        font-size: 18px;
                    }
                    .dot {
                        border-radius: 4px;
                        background: transparent;
                        border: 1px dotted;
                        margin-left: 5px;
                        color: var(--vscode-editor-foreground);
                        border-color: var(--vscode-editor-foreground);
                    }
                    
                    @font-face {
                        font-family: 'Roboto Mono';
                        font-style: normal;
                        font-weight: 400;
                        src: local(''),
                            url('https://cdn.jsdelivr.net/gh/lss233/oj-assistant/assets/fonts/roboto-mono-v12-latin-regular.woff') format('woff2'),
                            url('https://cdn.jsdelivr.net/gh/lss233/oj-assistant/assets/fonts/roboto-mono-v12-latin-regular.woff') format('woff');
                    }
                    
                    pre,
                    code {
                        font-family: 'Roboto Mono';
                    }
                </style>
                <script nonce="${nonce}">
                    const vscode = acquireVsCodeApi();
                    document.addEventListener('DOMContentLoaded', () => {
                        for (let el of document.getElementsByClassName('btn-copy')) {
                            el.addEventListener('click', e => {
                                let i = el.getAttribute('data-src');
                                vscode.postMessage({
                                    command: 'copy',
                                    text: document.getElementById('sampleInput-' + i).textContent,
                                });
                            });
                        }
                        for (let el of document.getElementsByClassName('btn-edit')) {
                            el.addEventListener('click', e => {
                                    let i = el.getAttribute('data-src');
                                    vscode.postMessage({
                                        command: 'edit',
                                        text: document.getElementById('sampleInput-' + i).textContent,
                                    });
                                });
                        }
                    });
                    
                    window.addEventListener('message', event => {
                        console.log(event);
                        const msg = event.data;
                        switch (msg.type) {
                            case 'playAudio':
                                let audio = new Audio(msg.src);
                                audio.play();
                                break;
                        }
                    });
                    FontAwesomeConfig = {
                        autoReplaceSvg: 'nest'
                    };
                </script>
                <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@5.15.2/css/all.css" nonce="${nonce}">
                <script src="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@5.15.2/js/all.min.js" nonce="${nonce}"></script>
            </head>
            <body>{0}</body>
        </html>
        `;
        this._view.webview.html = templateHtml.replace('{0}', `
                <div align="center" style="font-size: 32px;">
                    <div>
                        <i class="fa fa-spin fa-spinner fa-fw"></i>
                        Loading...
                    </div>
                </div>
        `);
        this.oj().getProblem(problemInfo).then(problem => {
            this.currentProblem = problemInfo;
            let sampleIOs = ``;
            for (let i = 0; i < problem.content.sampleInput.length; i++) {
                sampleIOs += `
                <div>
                    <h2>
                        Sample#${i + 1}:
                        <button class="dot btn-copy" data-src="${i}">Copy</button>
                        <button class="dot btn-edit" data-src="${i}">Edit</button>
                    </h2>
                    <pre id="sampleInput-${i}">${problem.content.sampleInput[i]}</pre>
                    <h2>
                    Output#${i + 1}:
                    <!--
                    <button class="dot btn-run" data-src="${i}">Run</button>
                    -->
                </h2>
                <pre>${problem.content.sampleOutput[i]}</pre>
                </div>
                `;
            }
            this._view.webview.html = templateHtml.replace('{0}', `
                <h1 align="center">${problem.content.title}</h1>
                <div>
                    <h2>Description:</h2>
                    <p>${problem.content.desc}</p>
                </div>
                <div>
                    <h2>Input:</h2>
                    <p>${problem.content.input}</p>
                </div>
                <div>
                    <h2>Output:</h2>
                    <p>${problem.content.output}</p>
                </div>
                
                <div>
                ${sampleIOs}
                </div>

                <div>
                    <h2>Note:</h2>
                    <p>${problem.content.note ?? 'None'}</p>
                </div>
            `);
            this._view.title = `OJ: Problem#${problem.id}`;
            this._view.webview.onDidReceiveMessage(msg => {
                switch (msg.command) {
                    case 'copy':
                        vscode.env.clipboard.writeText(msg.text);
                        vscode.window.showInformationMessage("OJ-Assistant: Sample input copied.");
                        break;
                    case 'run':
                        break;
                    case 'edit':
                        vscode.commands.executeCommand('ojassist.data');
                        break;
                }
            });
        }).catch(err => {
            console.error(err);
        });
    }

    private getHtml(webview: vscode.Webview) {
        const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this.extensionUri, 'assets', 'problem.js'));


    }

}
function getNonce() {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}