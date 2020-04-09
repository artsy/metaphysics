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
      title: "Update metaphysics schema",
      targetBranch: "master",
      commitMessage: "Update metaphysics schema",
      body:
        "Greetings human :robot: this PR was automatically created as part of metaphysics's deploy process",
      assignees: ["artsyit"],
      labels: ["Merge On Green"],
      update: eigenDir => {
        execSync(
          `cp _schemaV2.graphql '${path.join(eigenDir, "data/schema.graphql")}'`
        )
        execSync("yarn install --ignore-engines", { cwd: eigenDir })
        execSync("./node_modules/.bin/prettier --write data/schema.graphql", { cwd: eigenDir })
      },
    })
  } catch (e) {
    console.error(e)
    process.exit(1)
  }
}

function getStagingEnv() {
  const envString = execSync("hokusai staging env get")
    .toString()
    .trim()
  const result = {}

  for (const [key, value] of envString.split("\n").map(line => {
    const equalsIndex = line.indexOf("=")
    return [line.slice(0, equalsIndex), line.slice(equalsIndex + 1)]
  })) {
    result[key] = value
  }

  return result
}

main()
