import axios, { AxiosRequestConfig } from 'axios';
import { stringify as qstringify } from 'qs';
import axiosCookieJarSupport from '@3846masa/axios-cookiejar-support';
import { CookieJar } from 'tough-cookie';
import * as cheerio from 'cheerio';
import { OJ, User, Configuration, SimpleUserPasswordCredential, SourceFile, ProblemSubmit, Problem, ProblemInfo } from '../../model';
import cheerioModule = require('cheerio');
import { request } from 'https';
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
function extractToken(data: string): { "csrf_token": string, ftaa: string, bfaa: string } {
    return {
        "csrf_token": cheerio.load(data)('.csrf-token').attr('data-csrf')!,
        "ftaa": data.match(/_ftaa = "(\\w+)";/)![1],
        "bfaa": data.match(/_bfaa = "(\\w+)";/)![1],
    };
}
function snakeToPascal(x: string) : string {
    x =  x.replace(
        /_(\w)/g,
        ($, $1) => $1.toUpperCase()
    );
    return `${x.charAt(0).toUpperCase()}${x.substr(1)}`;
}
class CodeforcesConfiguration implements Configuration {
    [key: string] : any;
    constructor(public credentials: SimpleUserPasswordCredential) { }
}
export class CodeforcesOJ implements OJ {
    readonly baseUrl = this.config.baseUrl as string ?? 'https://www.Codeforces.com';

    user!: CodeforcesUser;
    axiosConfig!: AxiosRequestConfig;

    constructor(private config: CodeforcesConfiguration) { }
    async getProblem(problemInfo: ProblemInfo): Promise<Problem> {
        let response;
        if (problemInfo.contestId) {
            response = await axios.get(this.baseUrl + `/contest/${problemInfo.contestId}/problem/${problemInfo.id}`, this.axiosConfig);
        } else {
            response = await axios.get(this.baseUrl + `/problemset/${problemInfo.id}`, this.axiosConfig);
        }
        let $ = cheerio.load(response.data);
        return new Problem(problemInfo.id, problemInfo.contestId, {
            "title": $("div > div.col-xs-9 > h1").text()!,
            "desc": $("#pageContent > div.problemindexholder > div.ttypography > div > div:nth-child(2)").html()!,
            "input": $('#pageContent > div.problemindexholder > div.ttypography > div > div.input-specification > p').html()!,
            "output": $('#pageContent > div.problemindexholder > div.ttypography > div > div.output-specification > p').html()!,
            "sampleInput": $("#pageContent > div.problemindexholder > div.ttypography > div > div.sample-tests > div.sample-test > div.input > pre").toArray().map(e => $(e).text())!,
            "sampleOutput": $("#pageContent > div.problemindexholder > div.ttypography > div > div.sample-tests > div.sample-test > div.output > pre").toArray().map(e => $(e).text())!,
            "note": $("#pageContent > div.problemindexholder > div.ttypography > div > div.note > p").html()!
        });

    }
    async login(): Promise<CodeforcesUser> {
        let cookieJar = new CookieJar();
        this.axiosConfig = {
            jar: cookieJar,
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
            ...extractToken(response.data)
        }, this.axiosConfig);
        let user = new CodeforcesUser(this.config.credentials.username, this.config.credentials.password, cookieJar);
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
                ...extractToken(response.data)
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
                ...extractToken(response.data)
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