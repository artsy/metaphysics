// @ts-check

const { updateRepo } = require("@artsy/update-repo")
const { execSync } = require("child_process")
const path = require("path")

/**
 * @param {'eigen' | 'force'} repo
 */
async function updateSchemaFile(repo) {
  await updateRepo({
    repo: {
      owner: "artsy",
      repo,
    },
    branch: "update-schema",
    title: "Update metaphysics schema",
    targetBranch: "master",
    commitMessage: "Update metaphysics schema",
    body:
      "Greetings human :robot: this PR was automatically created as part of metaphysics's deploy process",
    assignees: ["artsyit"],
    labels: ["Merge On Green"],
    update: (repoDir) => {
      execSync(
        `cp _schemaV2.graphql '${path.join(repoDir, "data/schema.graphql")}'`
      )
      execSync("yarn install --ignore-engines", { cwd: repoDir })
      execSync("./node_modules/.bin/relay-compiler", { cwd: repoDir })
      execSync("./node_modules/.bin/prettier --write data/schema.graphql", {
        cwd: repoDir,
      })
    },
  })
}

async function main() {
  try {
    console.log("∙ Dumping staging schema")

    execSync("yarn dump:staging")

    await updateSchemaFile("eigen")
    await updateSchemaFile("force")
  } catch (error) {
    console.error(error)
    process.exit(1)
  }
}

main()
