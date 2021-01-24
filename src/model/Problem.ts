import * as vscode from "vscode";

export class ProblemSubmit {
    id!: number;
    user!: string;
    pid!: any;
    lang!: string;
    time!: string;
    memory!: string;
    codelen!: number;
    date!: Date;
    result!: string;
}
export interface ProblemInfo {
    id: string;
    contestId: string | undefined;
}
export class Problem implements ProblemInfo {
    constructor(
        public id: string,
        public contestId: string | undefined,
        public content: {
            "title": string;
            "desc": string;
            "input": string;
            "output": string;
            "sampleInput": Array<string>;
            "sampleOutput": Array<string>;
            [key: string] : any;
        }
    ) { }
    
}
export class SourceFile implements ProblemInfo {
    constructor(
        public id: string,
        public contestId: string | undefined,
        public sourceType: string,
        public code: string,
        public uri: vscode.Uri,
    ) { }

    public get dataInputFile(): vscode.Uri {
		if (this.contestId) {
            return vscode.Uri.joinPath(vscode.workspace.getWorkspaceFolder(this.uri)!.uri, this.contestId, `${this.id}.in`);
		} else {
            return vscode.Uri.joinPath(vscode.workspace.getWorkspaceFolder(this.uri)!.uri, `${this.id}.in`);
        }
    }
}