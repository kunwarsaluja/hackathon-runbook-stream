
import { Octokit } from "octokit";
import fs from 'fs';

const OCTOKIT_BASE_PARAMS = {
  owner: "kunwarsaluja",
  repo: "hackathon-runbook-stream",
  headers: {
    'X-GitHub-Api-Version': '2022-11-28'
  }
};

const getFirstCommit = async (octokit) => {
  const commits = await octokit.paginate("GET /repos/{owner}/{repo}/commits", {
    ...OCTOKIT_BASE_PARAMS,
    path: '/scripts/scripts.js',
  });
  return commits.pop();
};

const main = async (token, targetDirectory) => {
  const octokit = new Octokit({
    auth: token,
  });

  const data = {};
  data.firstCommit = await getFirstCommit(octokit);

  if (!fs.existsSync(targetDirectory)) {
    fs.mkdirSync(targetDirectory);
  }
  fs.writeFileSync(`${targetDirectory}/runbook-info.json`, JSON.stringify(data, undefined, 2));
};

const token = process.argv[2];
main(process.env.TOKEN, '../../runbook').catch((e) => console.error(e));