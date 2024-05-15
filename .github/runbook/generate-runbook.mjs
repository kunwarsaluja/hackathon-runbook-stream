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
const sitemapUrl = `/repos/${owner}/${repo}/contents/helix-sitemap.yaml`;
const checkSitemap = async (token, targetDirectory) => {
  const octokit = new Octokit({
    auth: token,
  });
  const data = {
    sitemapStatus: 'does not exists',
  };
  try {
    const res = await octokit.request(`GET ${sitemapUrl}`, {
      owner: owner,
      repo: repo,
    });
    if (res.status === 200) {
      console.log(` Custom Sitemap available at ${sitemapUrl}`);
      const resdata = JSON.parse(res.data);
      console.log(resdata.url);
      if (!fs.existsSync(targetDirectory)) {
        fs.mkdirSync(targetDirectory);
      }
      data.sitemapStatus = 'exists';
      data.url = resdata.url;
    }
    fs.writeFileSync(
      `${targetDirectory}/sitemapstatus.json`,
      JSON.stringify(data)
    );
  } catch (error) {
    console.error('error occured while fetching the sitemap config', error);
  }
};

const token = process.argv[2];
checkSitemap(process.env.TOKEN, '../../runbook').catch((e) => console.error(e));
main(process.env.TOKEN, '../../runbook').catch((e) => console.error(e));
