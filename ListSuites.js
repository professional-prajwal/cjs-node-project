// listContentsDirs.js - List top 5 immediate child dirs matching a prefix
const axios = require("axios");

const OWNER = "postman-eng";
const REPO = "postman-app";
const TOKEN = process.env.GITHUB_TOKEN;

if (!TOKEN) {
  console.error("❌ Please set the GITHUB_TOKEN environment variable.");
  process.exit(1);
}

const client = axios.create({
  headers: {
    Accept: "application/vnd.github.v3+json",
    Authorization: `token ${TOKEN}`,
  },
});

async function listImmediateChildDirs(branch, dirPath, prefix) {
  console.time("totalTime");
  console.log(`🔍 Fetching immediate directories in "${dirPath}" on branch "${branch}"...`);
  const url = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${dirPath}?ref=${branch}`;

  const { data } = await client.get(url);

  // data is an array: filter only directories containing the prefix
  const dirs = (Array.isArray(data) ? data : [])
    .filter(entry => entry.type === "dir" && entry.name.includes(prefix))
    .map(entry => entry.name)
    .slice(0, 5); // top 5 results

  console.timeEnd("totalTime");
  return dirs;
}

async function main() {
  const [,, branch, directory, prefix] = process.argv;
  if (!branch || !directory || !prefix) {
    console.error("Usage: node listContentsDirs.js <branch> <directory> <prefix>");
    process.exit(1);
  }

  try {
    const dirs = await listImmediateChildDirs(branch, directory, prefix);
    console.log(`\n📁 Top ${dirs.length} subdirectories under "${directory}" containing "${prefix}" on "${branch}":`);
    if (!dirs.length) {
      console.log("  (none found)");
    } else {
      dirs.forEach(p => console.log("  " + p));
    }
  } catch (err) {
    if (err.response && err.response.status === 404) {
      console.error(`❌ Directory not found: ${directory} on branch ${branch}`);
    } else {
      console.error("❌ Error:", err.response?.status || "", err.message);
    }
    process.exit(1);
  }
}

main();