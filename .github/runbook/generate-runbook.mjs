import { Octokit } from 'octokit';
import fs from 'fs';

const main = async (token, targetDirectory) => {
  const octokit = new Octokit({
    auth: token,
  });

  const res = await octokit.request('GET /repos/{owner}/{repo}/commits', {
    owner: 'kunwarsaluja',
    repo: 'hackathon-runbook-stream',
  });
  const data = JSON.stringify(res.data);

  if (!fs.existsSync(targetDirectory)) {
    fs.mkdirSync(targetDirectory);
  }
  fs.writeFileSync(`${targetDirectory}/test.json`, data);
};
const owner = 'kunwarsaluja';
const repo = 'hackathon-runbook-stream';
const checkSitemap = async (token) => {
  const octokit = new Octokit({
    auth: token,
  });

  try {
    const res = await octokit.request(
      'GET /repos/{owner}/{repo}/contents/helix-sitemap.yaml',
      {
        owner: owner,
        repo: repo,
      }
    );
    if (!res.ok) {
      //throw new Error('Network response was not OK');
      console.log('customer sitemap is not available');
    }
    const sitemapYaml = await JSON.stringify(res.data);
    console.log(sitemapYaml);
  } catch (error) {
    console.error('error occured while fetching the sitemap config', error);
  }
};

const token = process.argv[2];
checkSitemap(process.env.TOKEN).catch((e) => console.error(e));
main(process.env.TOKEN, '../../runbook').catch((e) => console.error(e));
