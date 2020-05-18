// @ts-check

const { updateRepo } = require("@artsy/update-repo")
const { execSync } = require("child_process")
const path = require("path")

async function main() {
  try {
    console.log("∙ Dumping staging schema")

    execSync("yarn dump:staging")

    const updateSchemaAction = {
      branch: "update-schema",
      title: "Update metaphysics schema",
      targetBranch: "master",
      commitMessage: "Update metaphysics schema",
      body:
        "Greetings human :robot: this PR was automatically created as part of metaphysics's deploy process",
      assignees: ["artsyit"],
      labels: ["Merge On Green"],
      update: repoDir => {
        execSync(
          `cp _schemaV2.graphql '${path.join(repoDir, "data/schema.graphql")}'`
        )
        execSync("yarn install --ignore-engines", { cwd: repoDir })
        execSync("./node_modules/.bin/prettier --write data/schema.graphql", {
          cwd: repoDir,
        })
      },
    }

    await updateRepo({
      repo: {
        owner: "artsy",
        repo: "eigen",
      },
      ...updateSchemaAction,
    })

    await updateRepo({
      repo: {
        owner: "artsy",
        repo: "reaction",
      },
      ...updateSchemaAction,
    })
  } catch (error) {
    console.error(error)
    process.exit(1)
  }
}

main()
