import { DebugConfiguration } from "vscode";

export interface Configuration {
    credentials: OJCredential;
}
export interface OJCredential {
}
export class SimpleUserPasswordCredential {
    constructor(
        public username: string, 
        public password: string
    ) { }
}
export class SimpleTokenCredential {
    constructor(
        public token: string
    ) { }
}
export class SimpleKeySecretCredential {
    constructor(
        public key: string,
        public secret: string,
    ) { }
}
export interface OJAssistConfig {
    backend: string;
    pathParseRule: {
        contestProblem: string,
        normalProblem: string,
    }
}