import { performance } from 'perf_hooks';
import { debug, DebugSession, window } from 'vscode';

/**
 * Debugger Intergration.
 * Provides: Debugger timing
 */
export class DebuggerTimer {
    private timing: { [key: string] : number } = {};
    public hook() {
        debug.onDidStartDebugSession(e => {
            this.startTiming(e);
        });
        debug.onDidTerminateDebugSession(e => {
            this.stopTiming(e);
        });
    }
    public startTiming(session: DebugSession) {
        this.timing[session.id] = performance.now();
    }
    public stopTiming(session: DebugSession) {
        let time = performance.now() - this.timing[session.id];
        window.showInformationMessage(`OJ-Assistant: Debug session terminated. About ${time.toFixed()}ms elapsed.`);
        delete this.timing[session.id];
    }
}
