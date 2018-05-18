import {getRepos, getIssuesByRepo, parseIssueResponses, saveFile} from './service';

const bootstrap = async () => {
    console.log('----------- Fetching repos -----------');
    const repos = await getRepos();
    const getRepoUrl = elem => elem.name;
    const promises = [];
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

bootstrap();