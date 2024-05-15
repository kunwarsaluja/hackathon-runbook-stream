
import { Octokit } from "octokit";

const main = async (token, targetDirectory) => {
  const octokit = new Octokit({
    auth: token,
  });

  const res = await octokit.request("GET /repos/{owner}/{repo}/commits", {
    owner: "kunwarsaluja",
    repo: "hackathon-runbook-stream",
  });
  //console.log(res.data);
  const blocks = await octokit.request('GET /repos/{owner}/{repo}/contents/{path}', {
    owner: "kunwarsaluja",
    repo: "hackathon-runbook-stream",
    path: '/tree/main/blocks',
    headers: {
      'X-GitHub-Api-Version': '2022-11-28'
    }
  });
  console.log(blocks.data);

};

const token = process.argv[2];
main(process.env.TOKEN).catch((e) => console.error(e));