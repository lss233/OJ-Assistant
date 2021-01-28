import axios, { AxiosRequestConfig } from 'axios';
import { stringify as qstringify } from 'qs';
import axiosCookieJarSupport from '@3846masa/axios-cookiejar-support';
import * as katex from 'katex';
import { CookieJar } from 'tough-cookie';
import * as cheerio from 'cheerio';
import { OJ, User, Configuration, SimpleUserPasswordCredential, SourceFile, ProblemSubmit, Problem, ProblemInfo } from '../../model';
axiosCookieJarSupport(axios);
const languageMap: { [index: string]: number } = {
    "c": 43,
    "cpp": 54,
    "cs": 9,
    "java": 60,
    "go": 32,
    "py": 31,
    "py2": 7,
    "js": 55,
    "txt": 57
};
function getLanguageId(extension: string): number {
    return languageMap[extension];
}
function snakeToPascal(x: string) : string {
    x =  x.replace(
        /_(\w)/g,
        ($, $1) => $1.toUpperCase()
    );
    return `${x.charAt(0).toUpperCase()}${x.substr(1)}`;
}
function processLatex(str: string): string {
    return str.replace(/\$\$\$\$\$\$(.+?)\$\$\$\$\$\$/gsm, ($0, $1) => katex.renderToString($1))
        .replace(/\$\$\$(.+?)\$\$\$/gsm, ($0, $1) => katex.renderToString($1))
        .replace(/\$\$(.+?)\$\$/gsm, ($0, $1) => katex.renderToString($1));
}
class CodeforcesConfiguration implements Configuration {
    [key: string] : any;
    constructor(public credentials: SimpleUserPasswordCredential) { }
}
export class CodeforcesOJ implements OJ {
    readonly baseUrl = this.config.baseUrl as string ?? 'https://codeforces.com';

    user!: CodeforcesUser;
    axiosConfig!: AxiosRequestConfig;
    cookieJar!: CookieJar;

    constructor(private config: CodeforcesConfiguration) { }
    async getProblem(problemInfo: ProblemInfo): Promise<Problem> {
        let response;
        if (problemInfo.contestId) {
            response = await axios.get(this.baseUrl + `/contest/${problemInfo.contestId}/problem/${problemInfo.id}`, this.axiosConfig);
        } else {
            response = await axios.get(this.baseUrl + `/problemset/problem/${problemInfo.id.substring(0, problemInfo.id.length - 1)}/${problemInfo.id.substr(problemInfo.id.length - 1)}`, this.axiosConfig);
        }
        let $ = cheerio.load(processLatex(response.data));
        return new Problem(problemInfo.id, problemInfo.contestId, {
            "title": $(".header > .title").text()!,
            "desc": $("#pageContent > div.problemindexholder > div.ttypography > div > div:nth-child(2)").html()!,
            "input": $('#pageContent > div.problemindexholder > div.ttypography > div > div.input-specification > p').html()!,
            "output": $('#pageContent > div.problemindexholder > div.ttypography > div > div.output-specification > p').html()!,
            "sampleInput": $("#pageContent > div.problemindexholder > div.ttypography > div > div.sample-tests > div.sample-test > div.input > pre").toArray().map(e => '<pre>' + $(e).html()! + '</pre>')!,
            "sampleOutput": $("#pageContent > div.problemindexholder > div.ttypography > div > div.sample-tests > div.sample-test > div.output > pre").toArray().map(e => $(e).html()!)!,
            "note": $("#pageContent > div.problemindexholder > div.ttypography > div > div.note > p").html()!
        });

    }
    async login(): Promise<CodeforcesUser> {
        this.cookieJar = new CookieJar();
        this.axiosConfig = {
            jar: this.cookieJar,
            withCredentials: true,
            headers: { "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/81.0.2704.103 Safari/537.36" }
        };
        let response = await axios.get(this.baseUrl + '/enter', this.axiosConfig);
        response = await axios.post(this.baseUrl + '/enter', {
            ...{
                handleOrEmail: this.config.credentials.username,
                password: this.config.credentials.password,
                action: 'enter',
                remember: 1,
            },
            ...this.extractToken(response.data)
        }, this.axiosConfig);
        let user = new CodeforcesUser(this.config.credentials.username, this.config.credentials.password, this.cookieJar);
        return this.user = user;
    }
    async submit(sourceFile: SourceFile): Promise<Function> {
        if(sourceFile.contestId) {
            let response = await axios.get(this.baseUrl + `/contest/${sourceFile.contestId}/submit`, this.axiosConfig);
            await axios.post(this.baseUrl + `/contest/${sourceFile.contestId}/submit`, {
                ...{
                    submittedProblemCode: sourceFile.id,
                    programTypeId: getLanguageId(sourceFile.sourceType),
                    source: sourceFile.code,
                    action: 'submitSolutionFormSubmitted',
                    submittedProblemIndex: sourceFile.id,
                    sourceFile: '',
                    tabSize: 4,
                },
                ...this.extractToken(response.data)
            }, this.axiosConfig);
        } else {
            let response = await axios.get(this.baseUrl + '/problemset/submit', this.axiosConfig);
            await axios.post(this.baseUrl + '/problemset/submit', {
                ...{
                    submittedProblemCode: sourceFile.id,
                    language: getLanguageId(sourceFile.sourceType),
                    source: sourceFile.code,
                    action: 'submitSolutionFormSubmitted',
                },
                ...this.extractToken(response.data)
            }, this.axiosConfig);
        }
        
        let resolveSubmitResult = (data: string, resolve: (value: unknown) => void) => {
            let $ = cheerio.load(data);
            
            $ = cheerio.load($('#pageContent > div.datatable > div:nth-child(6) > table > tbody > tr:nth-child(2)').filter((i: number, el: cheerio.Element) => {
                let href = $('td:nth-child(4) > a', el).attr('href');
                if(href === undefined) {
                    return false;
                }
                return href.substr(href.lastIndexOf('/') + 1) === sourceFile.id;
            }).first().html()!);
            let href = $('td:nth-child(4) > a').attr('href')!;
            let verdict = $('.submissionVerdictWrapper').attr('submissionverdict');
            if(verdict === undefined) {
                verdict = 'Pending...';
            } else {
                verdict = snakeToPascal(verdict);
                switch(verdict) {
                    case 'OK':
                        verdict = 'Accepted';
                        break;
                    default:
                        break;
                }
            }
            let submitResult: ProblemSubmit = new ProblemSubmit;
            submitResult.id = parseInt($('td:nth-child(1)').text());
            submitResult.user = $('td:nth-child(3) > a')?.text() ?? '-';
            submitResult.lang = $('td:nth-child(5)').text();
            submitResult.time = $('td:nth-child(7)').text();
            submitResult.memory = $('td:nth-child(8)').text();
            submitResult.date = new Date((() => {
                let x = $('td:nth-child(9)').text();
                return x.substr(0, x.length - 5);
            })());
            submitResult.codelen = sourceFile.code.length;
            submitResult.pid = href.substr(href.lastIndexOf('/') + 1);
            submitResult.result = verdict;
            resolve(submitResult);
        };
        if (sourceFile.contestId) {
            return () => {
                return new Promise(resolve => {
                    axios.get(this.baseUrl +
                        `/contest/${sourceFile.contestId}/my`,
                        this.axiosConfig)
                        .then(response => {
                            resolveSubmitResult(response.data, resolve);
                        });
                });
            };
        } else {
            return () => {
                return new Promise(resolve => {
                    axios.get(this.baseUrl +
                        `/submissions/${this.user.user}`,
                        this.axiosConfig)
                        .then(response => {
                            resolveSubmitResult(response.data, resolve);
                        });
                });
            };
        }
    }

    private extractToken(data: string): { "csrf_token": string, ftaa: string, bfaa: string, [key: string]: string } {
        let ftaa = data.match(/_ftaa = "(\\w+)";/),
            bfaa = data.match(/_bfaa = "(\\w+)";/);
        return {
            "csrf_token": cheerio.load(data)('.csrf-token').attr('data-csrf')!,
            "ftaa": ftaa ? ftaa[1] : '',
            "bfaa": bfaa ? bfaa[1] : '',
            "_tta": this.getTTA(this.cookieJar.getCookiesSync(this.baseUrl).find(i => i.key === '39ce7')!.value) + '',
        };
    }

    private getTTA(base: string): number {
        let result = 0;
        for (var i = 0; i < base.length; i++) {
            result = (result + (i + 1) * (i + 2) * base.charCodeAt(i)) % 1009;
            if (i % 3 === 0) {
                result++;
            }
            if (i % 2 === 0) {
                result *= 2;
            }
            if (i > 0) {
                result -= Math.floor(base.charCodeAt(Math.floor(i / 2)) / 2) * (result % 5);
            }
            while (result < 0) {
                result += 1009;
            }
            while (result >= 1009) {
                result -= 1009;
            }
        }
        return result;
    }

}
class CodeforcesUser implements User {
    user: String;
    password: String;
    session: any;
    constructor(user: String, password: String, session: any) {
        this.user = user;
        this.password = password;
        this.session = session;
    }
}