import axios, { AxiosRequestConfig } from 'axios';
import { stringify as qstringify } from 'qs';
import axiosCookieJarSupport from '@3846masa/axios-cookiejar-support';
import { CookieJar } from 'tough-cookie';
import * as cheerio from 'cheerio';
import { OJ, User, Configuration, SimpleUserPasswordCredential, SourceFile, ProblemSubmit, Problem, ProblemInfo } from '../../model';

axiosCookieJarSupport(axios);

const languageMap: { [index: string]: number } = {
    "c": 0,
    "cpp": 0,
    "java": 2,
};
function getLanguageId(extension: string): number {
    return languageMap[extension];
}
function updateProblemInfo<T extends ProblemInfo>(problemInfo: T): T {
    if(isNaN(+problemInfo.id)) {
        problemInfo.id = String(parseInt(problemInfo.id, 26) - 10);
    }
    return problemInfo;
}
class FJUTACMConfiguration implements Configuration {
    credentials: SimpleUserPasswordCredential;
    constructor(credentials: SimpleUserPasswordCredential) {
        this.credentials = credentials;
    }
}
export class FJUTACMOJ implements OJ {
    readonly baseUrl = 'http://www.fjutacm.com';

    config: FJUTACMConfiguration;
    user!: FJUTACMUser;
    axiosConfig!: AxiosRequestConfig;

    constructor(config: FJUTACMConfiguration) {
        this.config = config;
    }
    async getProblem(problemInfo: ProblemInfo): Promise<Problem> {
        let response;
        problemInfo = updateProblemInfo(problemInfo);
        if (problemInfo.contestId) {
            response = await axios.get(this.baseUrl + `/module/contestNew/ProblemViewer.jsp?cid=${problemInfo.contestId}&pid=${problemInfo.id}`, this.axiosConfig);
        } else {
            response = await axios.get(this.baseUrl + `/Problem.jsp?pid=${problemInfo.id}`, this.axiosConfig);
        }
        let $ = cheerio.load(response.data);
        $("div > div.col-xs-9 > div:nth-child(8) > div.panel-body").find('br').replaceWith('\n');
        $("div > div.col-xs-9 > div:nth-child(9) > div.panel-body").find('br').replaceWith('\n');
        return new Problem(problemInfo.id, problemInfo.contestId, {
            "title": $("div > div.col-xs-9 > h1").text()!,
            "desc": $("div > div.col-xs-9 > div:nth-child(5) > div.panel-body").html()!,
            "input": $("div > div.col-xs-9 > div:nth-child(6) > div.panel-body").html()!,
            "output": $("div > div.col-xs-9 > div:nth-child(7) > div.panel-body").html()!,
            "sampleInput": [
                $("div > div.col-xs-9 > div:nth-child(8) > div.panel-body").html()!
            ],
            "sampleOutput": [
                $("div > div.col-xs-9 > div:nth-child(9) > div.panel-body").html()!
            ]
        });

    }
    async login(): Promise<FJUTACMUser> {
        let cookieJar = new CookieJar();
        this.axiosConfig = {
            jar: cookieJar,
            withCredentials: true,
            headers: { "content-type": "application/x-www-form-urlencoded" }
        };
        let request = await axios.post(this.baseUrl + '/login.action', qstringify({
            user: this.config.credentials.username,
            pass: this.config.credentials.password
        }), this.axiosConfig);
        if (request.data.ret === 'LoginSuccess') {
            let user = new FJUTACMUser(this.config.credentials.username, this.config.credentials.password, cookieJar);
            return this.user = user;
        } else {
            throw new Error('Login Failed! Invalid response');
        }
    }
    async submit(sourceFile: SourceFile): Promise<Function> {
        sourceFile = updateProblemInfo(sourceFile);
        await axios.post(this.baseUrl + '/sb.action', qstringify({
            cid: sourceFile.contestId ?? -1,
            pid: sourceFile.id,
            language: getLanguageId(sourceFile.sourceType),
            code: sourceFile.code
        }), this.axiosConfig);
        let resolveSubmitResult = (data: string, resolve: (value: unknown) => void) => {
            let $ = cheerio.load(data);
            let submitResult: ProblemSubmit = new ProblemSubmit;
            submitResult.id = parseInt($('div > table > tbody > tr:nth-child(1) > td:nth-child(1)').text());
            submitResult.user = $('div > table > tbody > tr:nth-child(1) > td:nth-child(2) > a')?.attr('href')?.match('UserInfo\\.jsp\\?user=(.+)')?.[1] ?? '-';
            submitResult.pid = parseInt($('div > table > tbody > tr:nth-child(1) > td:nth-child(3)').text());
            submitResult.result = $('div > table > tbody > tr:nth-child(1) > td:nth-child(4)')!.text();
            submitResult.lang = $('div > table > tbody > tr:nth-child(1) > td:nth-child(5)').text();
            submitResult.time = $('div > table > tbody > tr:nth-child(1) > td:nth-child(6)').text();
            submitResult.memory = $('div > table > tbody > tr:nth-child(1) > td:nth-child(7)').text();
            submitResult.codelen = parseInt($('div > table > tbody > tr:nth-child(1) > td:nth-child(8)').text());
            submitResult.date = new Date($('div > table > tbody > tr:nth-child(1) > td:nth-child(9)').text());
            resolve(submitResult);
        };
        if (sourceFile.contestId) {
            return () => {
                return new Promise(resolve => {
                    axios.get(this.baseUrl +
                        `/module/contestNew/status.jsp?user=${this.user.user}&pid=${sourceFile.id}&result=-1&lang=${getLanguageId(sourceFile.sourceType)}&cid=${sourceFile.contestId}&page=1`,
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
                        `/Status.jsp?all=1&user=${this.user.user}&pid=${sourceFile.id}&lang=${getLanguageId(sourceFile.sourceType)}`,
                        this.axiosConfig)
                        .then(response => {
                            resolveSubmitResult(response.data, resolve);
                        });
                });
            };
        }
    }

}
class FJUTACMUser implements User {
    user: String;
    password: String;
    session: any;
    constructor(user: String, password: String, session: any) {
        this.user = user;
        this.password = password;
        this.session = session;
    }
}