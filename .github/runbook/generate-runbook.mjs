
import { Octokit } from "octokit";

const main = async (token, targetDirectory) => {
  const octokit = new Octokit({
    auth: token,
  });

  const res = await octokit.request("GET /repos/{owner}/{repo}/commits", {
    owner: "kunwarsaluja",
    repo: "hackathon-runbook-stream",
  });
  console.log(res.data);
};

const token = process.argv[2];
main(process.env.TOKEN).catch((e) => console.error(e));