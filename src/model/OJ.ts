import { User } from './index';
import { SourceFile, Problem, ProblemInfo } from "./Problem";

/**
 * Everything related to this Online Judge Server.
 */
export interface OJ {
    /**
     * Attempt to login.
     */
    login(): Promise<User>;

    /**
     *  Submit a source file to the server.
     * @param sourceFile The source file related to this submit.
     */
    submit(sourceFile: SourceFile): Promise<Function>;

    /**
     * Get problem detials
     * @param problemInfo The problem info related to this problem.
     */
    getProblem(problemInfo: ProblemInfo): Promise<Problem>;
}