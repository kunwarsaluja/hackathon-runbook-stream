
import { Octokit } from "octokit";
import fs from 'fs';

const main = async (token, targetDirectory) => {
  const octokit = new Octokit({
    auth: token,
  });

  const res = await octokit.request("GET /repos/{owner}/{repo}/commits", {
    owner: "kunwarsaluja",
    repo: "hackathon-runbook-stream",
  });
  const data = JSON.stringify(res.data);

  if (!fs.existsSync(targetDirectory)) {
    fs.mkdirSync(targetDirectory);
  }
  fs.writeFileSync(`${targetDirectory}/test.json`, data);

  const blocks = await octokit.request('GET /repos/{owner}/{repo}/contents/{path}', {
    owner: "kunwarsaluja",
    repo: "hackathon-runbook-stream",
    path: 'blocks',
    headers: {
      'X-GitHub-Api-Version': '2022-11-28'
    }
  });
  const blockName = [];
  Object.entries(JSON.stringify(blocks.data)).forEach((entry) => {
    const [key, value] = entry;
    if(key === 'name') {
      blockName.push(value);
    }
  });
  fs.appendFileSync(`${targetDirectory}/test.json`, blockName.join('\n'));
};

const token = process.argv[2];
main(process.env.TOKEN, '../../runbook').catch((e) => console.error(e));


