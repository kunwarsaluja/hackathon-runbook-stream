
import { Octokit } from "octokit";
import { promises as fs } from 'fs';
import YAML from 'yaml'
import fetch from 'node-fetch';

const OCTOKIT_BASE_PARAMS = {
  owner: "kunwarsaluja",
  repo: "hackathon-runbook-stream",
  headers: {
    'X-GitHub-Api-Version': '2022-11-28'
  }
};

const readRepoFileContents = async (filePath) => {
  try {
    const fileContents = await fs.readFile(`../../${filePath}`, {
      encoding: 'utf8',
      flag: 'r',
    });
  return fileContents;
  } catch (e) {
    console.error('failed reading file.', e)
    return false;
  }
};

const getEnvironmentInfo = async () => {
  const fsTab = await readRepoFileContents('fstab.yaml');
  const data = YAML.parse(fsTab);

  const resp = await fetch(`https://admin.hlx.page/status/${OCTOKIT_BASE_PARAMS.owner}/${OCTOKIT_BASE_PARAMS.repo}/main`);
  const json = await resp.json();

  return {
    previewUrl: json.preview.url,
    liveUrl: json.live.url,
    githubUrl: `https://github.com/${OCTOKIT_BASE_PARAMS.owner}/${OCTOKIT_BASE_PARAMS.repo}`,
    sharepointUrl: data.mountpoints['/'],
  };
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
  data.environmentInfo = await getEnvironmentInfo();
  data.firstCommit = await getFirstCommit(octokit);

  try {
    fs.access(targetDirectory, fs.constants.W_OK);
  } catch {
    await fs.mkdir(targetDirectory);
  }
  await fs.writeFile(`${targetDirectory}/runbook-info.json`, JSON.stringify(data, undefined, 2));
};

const token = process.argv[2];
main(process.env.TOKEN, '../../runbook').catch((e) => console.error(e));