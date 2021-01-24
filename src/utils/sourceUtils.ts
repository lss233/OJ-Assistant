import * as vscode from "vscode";
import { OJAssistConfig, SourceFile } from "../model";
import * as path from 'path';

export function parseSourceFile(uri: vscode.Uri, baseCfg: OJAssistConfig, code: string): SourceFile | null {
    let cfg = Object.assign({
        pathParseRule: {
            contestProblem: "c\\/(\\d+)\\/(\\w+)[\\.\\w]*\\.(\\w+)$",
            problemProblem: "p\\/(\\w+)[\\.\\w]*\.(\\w+)$"
        }
    }, baseCfg);

    let matches;
    let path = uri.toString(true);
    if (matches = path.match(cfg.pathParseRule.contestProblem)) {
        if (matches !== null) {
            return new SourceFile(matches[2], matches[1], matches[3], code = code, uri = uri);
        }
    } else if (matches = path.match(cfg.pathParseRule.normalProblem)) {
        if (matches !== null) {
            return new SourceFile(matches[1], undefined, matches[2], code = code, uri = uri);
        }
    }
    return null;
}