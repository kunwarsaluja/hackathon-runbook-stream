
import { Octokit } from "octokit";
import { promises as fs } from 'fs';
import YAML from 'yaml'
import fetch from 'node-fetch';
import { createTwoFilesPatch } from 'diff';

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
  const envInfo = {
    githubUrl: `https://github.com/${OCTOKIT_BASE_PARAMS.owner}/${OCTOKIT_BASE_PARAMS.repo}`,
    sharepointUrl: '',
    previewUrl: `http://main--${OCTOKIT_BASE_PARAMS.repo}--${OCTOKIT_BASE_PARAMS.owner}.hlx.page/`,
    liveUrl: `http://main--${OCTOKIT_BASE_PARAMS.repo}--${OCTOKIT_BASE_PARAMS.owner}.hlx.live/`,
    prodUrl: '',
  };

  const fsTab = await readRepoFileContents('fstab.yaml');
  if (fsTab) {
    const data = YAML.parse(fsTab);
    envInfo.sharepointUrl = data.mountpoints['/'];
  }

  const skConf = await readRepoFileContents('/tools/sidekick/config.json');
  if (skConf) {
    const skConfData = JSON.parse(skConf);
    envInfo.prodUrl = skConfData.host;
  }

  const resp = await fetch(`https://admin.hlx.page/status/${OCTOKIT_BASE_PARAMS.owner}/${OCTOKIT_BASE_PARAMS.repo}/main`);
  if (resp.ok) {
    const json = await resp.json();
    envInfo.previewUrl = json.preview.url;
    envInfo.liveUrl = json.live.url;
  }

  return envInfo;
};

const getPluginInfo = async () => {
  const resp = await fetch(`https://admin.hlx.page/sidekick/${OCTOKIT_BASE_PARAMS.owner}/${OCTOKIT_BASE_PARAMS.repo}/main/config.json`);
  const json = await resp.json();

  const plugins = json.plugins || [];

  const pluginTitles = plugins
    .filter(plugin => plugin.title) // Filter out plugins without a title
    .map(plugin => plugin.title);

  return {
    pluginTitles: pluginTitles
  };
};

const getBoilerplateCustomizations = async (octokit) => {
  let coreLibFile = 'scripts/aem.js';
  let coreLibFileContents = await readRepoFileContents(coreLibFile);
  if (!coreLibFileContents) {
    coreLibFile = 'scripts/lib-franklin.js';
    coreLibFileContents = await readRepoFileContents(coreLibFile);
  }
  const coreLibCommits = await octokit.paginate('GET /repos/{owner}/{repo}/commits', {
    ...OCTOKIT_BASE_PARAMS,
    path: `/${coreLibFile}`,
  });
  const firstCommit = coreLibCommits[coreLibCommits.length - 1];
  const firstFileContents = await octokit.request('GET /repos/{owner}/{repo}/contents/{path}', {
    ...OCTOKIT_BASE_PARAMS,
    path: `/${coreLibFile}`,
    ref: firstCommit.sha,
  });
  const origFileContents = Buffer.from(firstFileContents.data.content, 'base64').toString('utf-8');
  const patch = createTwoFilesPatch('initialCommit', 'current', origFileContents, coreLibFileContents);

  return {
    coreLibrary: coreLibFile.replace('scripts/', ''),
    patch,
    commits: {
      count: coreLibCommits.length,
      details: coreLibCommits.map((commit) => ({
        sha: commit.sha,
        by: commit.author.url,
        on: commit.commit.author.date,
        url: commit.html_url,
        message: commit.commit.message,
      }))
    }
  };
};


const getBlockInfo = async (octokit) => {
  const blocks = await octokit.request('GET /repos/{owner}/{repo}/contents/{path}', {
    ...OCTOKIT_BASE_PARAMS,
    path: 'blocks',
  });
  const blockName = [];
  Object.entries((blocks.data)).forEach((entry) => {
    const [key, value] = entry;
    blockName.push({'name' : value['name']});
  });
  return blockName;
};

const getHelixQueryYaml = async (octokit) => {
  let customIndexDefinitions = false;
  try {
      const resp = await octokit.request('GET /repos/{owner}/{repo}/contents/{path}', {
      ...OCTOKIT_BASE_PARAMS,
      path: 'helix-query.yaml',
    });
    if(resp.status === 200) {
      customIndexDefinitions = true;
    }
  } catch (e) {
    console.error(e.message);
  }
  if (customIndexDefinitions) {
    return {'customIndexDefinitions' : true, 'URL' : `https://raw.githubusercontent.com/${OCTOKIT_BASE_PARAMS.owner}/${OCTOKIT_BASE_PARAMS.repo}/main/helix-query.yaml`};
  } else {
    return {'customIndexDefinitions' : false};
  }
};

const getCDNInfo = async (prodUrl) => { 
  const payload = { 'hostname': prodUrl};
  const response = await fetch('https://316182-discovercdn-stage.adobeioruntime.net/api/v1/web/discoverDNS/findCNAME', {
    method: 'POST',
    referrerPolicy: 'no-referrer',
    headers: {
    'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
  const cname = await response.json();
  return cname['payload'];
};


const main = async (token, targetDirectory) => {
  const octokit = new Octokit({
    auth: token,
  });

  const data = {};
  data.environmentInfo = await getEnvironmentInfo();
  data.pluginInfo = await getPluginInfo();
  data.boilerplateCustomizations = await getBoilerplateCustomizations(octokit);

   /* disabled for current runbook iteration
  data.blocks = await getBlockInfo(octokit);
  */
  data.customIndexDefinitions = await getHelixQueryYaml(octokit);
  data.cdn = await getCDNInfo(data.environmentInfo.prodUrl);

  try {
    fs.access(targetDirectory, fs.constants.W_OK);
  } catch {
    await fs.mkdir(targetDirectory);
  }
  await fs.writeFile(`${targetDirectory}/runbook-info.json`, JSON.stringify(data, undefined, 2));
};

const token = process.argv[2];
main(process.env.TOKEN, '../../runbook').catch((e) => console.error(e));