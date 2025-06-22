// listTreeFiles.js (with prefix filtering + limit)
const axios = require("axios");

const API_BASE = "https://api.github.com/repos/postman-eng/postman-app";
const TOKEN = process.env.GITHUB_TOKEN;

if (!TOKEN) {
  console.error("❌ Please set the GITHUB_TOKEN environment variable.");
  process.exit(1);
}

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

async function listFiles(branch, dirPath, substring) {
  console.time("totalTime");
  console.log(`🔍 Resolving branch "${branch}"…`);
  const sha = await getBranchSha(branch);
  console.log(`✅ Commit SHA: ${sha}`);

  console.log(`🌲 Fetching full tree…`);
  const tree = await getRecursiveTree(sha);
  console.log(`👉 Retrieved ${tree.length} entries`);

  const dirPrefix = dirPath.replace(/\/$/, "") + "/";
  const files = tree
    .filter(entry =>
      entry.type === "blob" &&
      entry.path.startsWith(dirPrefix) &&
      entry.path.includes(substring)
    )
    .map(entry => entry.path)
    .slice(0, 20);

  console.timeEnd("totalTime");
  return file
}

async function main() {
  const [,, branch, directory, substring] = process.argv;
  if (!branch || !directory || !substring) {
    console.error("Usage: node listTreeFiles.js <branch> <directory> <substring>");
    process.exit(1);
  }

  try {
    const files = await listFiles(branch, directory, substring);
    console.log(`\n📁 Top ${files.length} files under "${directory}" containing "${substring}" on "${branch}":`);
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