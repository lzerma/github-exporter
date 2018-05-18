import axios from 'axios';
import * as sleep from 'sleep';
import {Parser as JSONCSVParser} from 'json2csv';
import {writeFileSync} from 'fs';
import * as moment from 'moment';

const axiosInstance = axios.create({
    baseURL: 'https://api.github.com/',
    timeout: 100000,
    headers: {
        Accept: 'application/vnd.github.v3+json',
        Authorization: 'Bearer ',
    },
});

export const saveFile = async (fileName: string, data: string, withDateVersioning: boolean = true) => {
    if (withDateVersioning) fileName = `${moment().format('YYYY-MM-DD_HH_mm')}_${fileName}`;
    writeFileSync(`./${fileName}`, data);
    console.log('File saved on ', fileName);
}

export const getRepos = async (nextPage: number = 1, repos: Array<object> = []) => {
    const url = `/orgs/myrepo/repos?page=${nextPage}`;
    try {
        const response = await axiosInstance.get(url);
        console.log(`fetched ${url} with ${response.status}`);
        if (response.status === 200 && response.data.length > 0) {
            repos.push(...response.data);
            sleep.sleep(1);
            return await getRepos(nextPage + 1, repos);
        }
        else {
            return repos;
        }
    }
    catch (e) {
        repos.push(e);
        return repos;
    }
};

export const getIssuesByRepo = async (name: string) => {
    const url = `repos/myrepo/${name}/issues?state=open`;
    try {
        sleep.sleep(1);
        const response = await axiosInstance.get(url);
        console.log(`fetched ${url} with ${response.status}`);
        if (response.status === 200 && response.data.length > 0) {
            console.log(`Repo ${name} has a total of ${response.data.length} issues.`);
            return response.data;
        }
        return [];
    }
    catch (e) {
        console.log(`there was an error when pulling repository ${name}`, e);
        return [];
    }
};

const parseIssueToRow = async (fields: Array<string>, unwind: Array<string>, issues: Array<any>): Promise<string> => {
    const opts = {fields, unwind};
    try {
        const parser = new JSONCSVParser(opts);
        const csv = parser.parse(issues);
        return csv;
    } catch (err) {
        console.error(err);
        return '';
    }
};

const getCommentsByIssue = async (url: string) => {
    try {
        sleep.sleep(1);
        const response = await axiosInstance.get(url);
        console.log(`fetched ${url} with ${response.status}`);
        if (response.status === 200 && response.data.length > 0) {
            return response.data;
        }
        return [];
    }
    catch (e) {
        console.log(`there was an error when pulling repository ${name}`, e);
        return [];
    }
};

export const parseIssueResponses = async (issues: Array<any>): Promise<string> => {
    const issuesParsed = [];
    let maxComments = 1;
    const fields = ['number', 'title', 'type', 'html_url', 'state', 'created_at', 'body', 'labels', 'assignees', 'user.login'];
    const unwind = [];
    for (const issue of issues) {

        const repoName = issue.repository_url.split('/').reverse()[0];
        const comments = await getCommentsByIssue(issue.comments_url);
        const commentsMapped = comments.map(elem => elem.body);
        const newIssue = {
            ...issue,
            ...commentsMapped,
            type: 'Techonology',
            labels: `${repoName} ${issue.labels.map(elem => elem.name).join(' ')}`,
            assignees: `${issue.assignees.map(elem => elem.login).join(' ')}`,
        };
        maxComments = (maxComments < commentsMapped.length) ? commentsMapped.length : maxComments;
        issuesParsed.push(newIssue);
    }
    const commentsFields = new Array(maxComments).fill('comments').map((elem, i) => i.toString());
    return await parseIssueToRow(fields.concat(commentsFields), unwind, issuesParsed);
};