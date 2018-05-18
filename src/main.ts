import {getRepos, getIssuesByRepo, parseIssueResponses, saveFile} from './service';

const bootstrap = async (org: string) => {
    console.log('----------- Fetching repos -----------');
    const repos = await getRepos(org);
    const getRepoUrl = elem => elem.issues_url.replace('{/number}', '');
    const repoNames = repos.map(getRepoUrl);
    console.log('----------- Fetching issues for each repo -----------');
    const issues = [];
    for (const repoName of repoNames) {
        const ret = await getIssuesByRepo(repoName);
        // const ret = await getIssuesByRepo('accounts-service');
        issues.push(...ret);
    }

    console.log('----------- Parsing each issues -----------');
    const csvData = await parseIssueResponses(issues);
    await saveFile('jira_issues.csv', csvData);
    console.log('There is a total of ', issues.length, ' issues on ', repoNames.length, ' repos');
};

bootstrap('yourprojecthere');