// @ts-check

const { updateRepo } = require("@artsy/update-repo")
const { execSync } = require("child_process")
const path = require("path")

async function main() {
  try {
    console.log("∙ Dumping local schema")
    const env = {
      ...process.env,
      ...getStagingEnv(),
    }

    execSync("yarn dump:local", { env })

    await updateRepo({
      repo: { owner: "artsy", repo: "eigen" },
      branch: "update-schema",
      title: "[IGNORE] Test updating metaphysics schema",
      targetBranch: "master",
      commitMessage: "Update metaphysics schema",
      body:
        "Greetings human :robot: this PR was automatically created as part of metaphysics's deploy process",
      assignees: ["artsyit"],
      labels: ["bug"],
      update: eigenDir => {
        execSync(
          `cp _schemaV2.graphql '${path.join(eigenDir, "data/schema.graphql")}'`
        )
        execSync("yarn", { cwd: eigenDir })
        execSync("yarn prettier --write data/schema.graphql", { cwd: eigenDir })
      },
    })
  } catch (e) {
    console.error(e)
    process.exit(1)
  }
}

function getStagingEnv() {
  const envString = execSync("hokusai staging env get").toString()
  const result = {}

  for (const [key, value] of envString
    .split("\n")
    .map(line => line.split("=", 1))) {
    result[key] = value
  }

  return result
}

main()
