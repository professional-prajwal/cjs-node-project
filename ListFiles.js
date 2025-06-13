// listTreeFiles.js (with console.time logs)
const axios = require("axios");

const API_BASE = "https://api.github.com/repos/postman-eng/postman-app";
const TOKEN = process.env.GITHUB_TOKEN;

if (!TOKEN) {
  console.error("❌ Please set the GITHUB_TOKEN environment variable.");
  process.exit(1);
}

// Axios client with GitHub auth headers
const client = axios.create({
  baseURL: API_BASE,
  headers: {
    Accept: "application/vnd.github.v3+json",
    Authorization: `token ${TOKEN}`,
  },
});

async function getBranchSha(branch) {
  console.time("getBranchSha");
  const res = await client.get(`/git/ref/heads/${branch}`);
  console.timeEnd("getBranchSha");
  return res.data.object.sha;
}

async function getRecursiveTree(sha) {
  console.time("getRecursiveTree");
  const res = await client.get(`/git/trees/${sha}`, {
    params: { recursive: 1 },
  });
  console.timeEnd("getRecursiveTree");
  return res.data.tree;
}

async function listFiles(branch, dirPath) {
  console.time("totalTime");
  console.log(`🔍 Resolving branch "${branch}"…`);
  const sha = await getBranchSha(branch);
  console.log(`✅ Commit SHA: ${sha}`);

  console.log(`🌲 Fetching full tree…`);
  const tree = await getRecursiveTree(sha);
  console.log(`👉 Retrieved ${tree.length} entries`);

  const prefix = dirPath.replace(/\/$/, "") + "/";
  const files = tree
    .filter(entry => entry.type === "blob" && entry.path.startsWith(prefix))
    .map(entry => entry.path);

  console.timeEnd("totalTime");
  return files;
}

async function main() {
  const [,, branch, directory] = process.argv;
  if (!branch || !directory) {
    console.error("Usage: node listTreeFiles.js <branch> <directory>");
    process.exit(1);
  }

  try {
    const files = await listFiles(branch, directory);
    console.log(`\n📁 Files under "${directory}" on "${branch}":`);
    if (files.length === 0) {
      console.log("  (none found)");
    } else {
      files.forEach(p => console.log("  " + p));
    }
  } catch (err) {
    console.error("❌ Error:", err.response?.status || "", err.message);
    process.exit(1);
  }
}

main();