import * as vscode from 'vscode';
import { OJ, OJAssistConfig, ProblemInfo } from "./model";
import { parseSourceFile } from "./utils";

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
        webviewView.webview.html = '<h1 align="center">OJ-Assistant</h1>';
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [
                this.extensionUri
            ]
        };
    }
    public renderView(problemInfo: ProblemInfo): void {
        if (this._view === undefined || (this.currentProblem !== undefined && (this.currentProblem.id === problemInfo.id && this.currentProblem.contestId === problemInfo.contestId))) { return; }
        const styleFontAwesomeUri = this._view.webview.asWebviewUri(vscode.Uri.joinPath(this.extensionUri, 'assets', 'css', 'fa.min.css'));
        const scriptsFontAwesomeUri = this._view.webview.asWebviewUri(vscode.Uri.joinPath(this.extensionUri, 'assets', 'js', 'fa.min.js'));
        this._view.webview.html = `
            <meta
                http-equiv="Content-Security-Policy"
                content="default-src 'none'; img-src ${this._view.webview.cspSource} https:; script-src ${this._view.webview.cspSource}; style-src ${this._view.webview.cspSource};"
            />
            <link href="${styleFontAwesomeUri}" rel="stylesheet">
            <script src="${scriptsFontAwesomeUri}"> </script>
            <h1 align="center"><i class="fas fa-spinner"></i>Loading...</h1>
        `;
        this.oj().getProblem(problemInfo).then(problem => {
            this.currentProblem = problemInfo;
            let sampleIOs = ``;
            for(let i = 0; i < problem.content.sampleInput.length; i++) {
                sampleIOs += `
                <div>
                    <h2>
                        Sample#${i + 1}:
                        <button class="dot" onclick="copySampleInput(${i})">Copy</button>
                        <button class="dot" onclick="editSampleInput(${i})">Edit</button>
                    </h2>
                    <pre id="sampleInput-${i}">${problem.content.sampleInput[i]}</pre>
                    <h2>
                    Output#${i + 1}:
                    <!--
                    <button class="dot" onclick="runWithTestData()">Run</button>
                    -->
                </h2>
                <pre>${problem.content.sampleOutput[i]}</pre>
                </div>
                `;
            }
            this._view.webview.html = `<!DOCTYPE html>
            <html>
            
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>${problem.content.title}</title>
            </head>
            
            <body>
                <style>
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
                            url('../fonts/roboto-mono-v12-latin-regular.woff2') format('woff2'),
                            url('../fonts/roboto-mono-v12-latin-regular.woff') format('woff');
                    }
            
                    pre,
                    code {
                        font-family: 'Roboto Mono';
                    }
                </style>
                <h1 align="center">${problem.content.title}</h1>
                <h2>Description:</h2>
                <p>${problem.content.desc}</p>
            
                <h2>Input:</h2>
                <p>${problem.content.input}</p>
            
                <h2>Output:</h2>
                <p>${problem.content.output}</p>

                ${sampleIOs}

                <h2>Note:</h2>
                <p>${problem.content.note ?? 'None'}</p>
            </body>
            <script>
                const vscode = acquireVsCodeApi();
                function copySampleInput(i) {
                    vscode.postMessage({
                        command: 'copy',
                        text: document.getElementById('sampleInput-' + i).textContent,
                    })
                }
                function editSampleInput(i) {
                    vscode.postMessage({
                        command: 'edit',
                        text: document.getElementById('sampleInput-' + i).textContent,
                    })
                }
                function runWithTestData() {
                    vscode.postMessage({
                        command: 'run',
                        text: '',
                    })
                }
            </script>
            
            </html>`;
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

        });
    }

    private getHtml(webview: vscode.Webview) {
        const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(this.extensionUri, 'assets', 'problem.js'));


    }

}