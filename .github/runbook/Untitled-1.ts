
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

const getBlockInfo = async (octokit) => {
  const blocks = await octokit.request('GET /repos/{owner}/{repo}/contents/{path}', {
    owner: "kunwarsaluja",
    repo: "hackathon-runbook-stream",
    path: 'blocks',
    headers: {
      'X-GitHub-Api-Version': '2022-11-28'
    }
  });
  const blockName = [];
  Object.entries((blocks.data)).forEach((entry) => {
    const [key, value] = entry;
    blockName.push({'name' : value['name']});
  });
  return JSON.stringify(blockName);
};

const main = async (token, targetDirectory) => {
  const octokit = new Octokit({
    auth: token,
  });

  const data = {};
  data.firstCommit = await getFirstCommit(octokit);
  data.blocks = await getBlockInfo(octokit);

  if (!fs.existsSync(targetDirectory)) {
    fs.mkdirSync(targetDirectory);
  }
  fs.writeFileSync(`${targetDirectory}/runbook-info.json`, JSON.stringify(data, undefined, 2));
};

const token = process.argv[2];
main(process.env.TOKEN, '../../runbook').catch((e) => console.error(e));