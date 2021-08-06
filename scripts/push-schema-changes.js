// @ts-check

const { updateRepo } = require("@artsy/update-repo")
const { execSync } = require("child_process")
const path = require("path")
const { buildSchema, introspectionQuery, graphqlSync } = require("graphql")
const { readFileSync, writeFileSync } = require("fs")

/**
 * updates the schema file on repo
 * @param {Object} input
 * @param {string} input.repo - repo: name of the artsy repo to update
 * @param {string} [input.body] - body: The PR body descrption
 * @param {string} [input.dest] - dest: Path to schema file in target repo
 */
async function updateSchemaFile({
  repo,
  dest = "data/schema.graphql",
  body = "Greetings human :robot: this PR was automatically created as part of metaphysics' deploy process.",
}) {
  await updateRepo({
    repo: {
      owner: "artsy",
      repo,
    },
    branch: "update-schema",
    title: "Update metaphysics schema",
    targetBranch: "master",
    commitMessage: "Update metaphysics schema",
    body,
    assignees: ["artsyit"],
    labels: ["Merge On Green"],
    update: (repoDir) => {
      const repoDest = path.join(repoDir, dest)
      execSync("yarn config set ignore-engines true", { cwd: repoDir })
      execSync("yarn install", { cwd: repoDir })
      if (dest.endsWith(".json")) {
        const sdl = readFileSync("_schemaV2.graphql", "utf8").toString()
        const schema = buildSchema(sdl, { commentDescriptions: true })
        const gql = graphqlSync(schema, introspectionQuery)
        writeFileSync(repoDest, JSON.stringify(gql, null, 2))
      } else {
        execSync(`cp _schemaV2.graphql '${repoDest}'`)
        execSync("./node_modules/.bin/relay-compiler", { cwd: repoDir })
      }
      execSync(
        `[ ! -f ./node_modules/.bin/prettier ] || ./node_modules/.bin/prettier --write ${dest}`,
        {
          cwd: repoDir,
        }
      )
    },
  })
}

async function main() {
  try {
    console.log("∙ Dumping staging schema")

    execSync("yarn dump:staging")

    await updateSchemaFile({
      repo: "eigen",
      body:
        "Greetings human :robot: this PR was automatically created as part of metaphysics' deploy process. #nochangelog",
    })
    await updateSchemaFile({ repo: "force" })
    await updateSchemaFile({
      repo: "volt",
      dest: "vendor/graphql/schema/metaphysics.json",
    })
    await updateSchemaFile({
      repo: "pulse",
      dest: "vendor/graphql/schema/metaphysics.json",
    })
  } catch (error) {
    console.error(error)
    process.exit(1)
  }
}

main()
