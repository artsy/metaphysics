// @ts-check

const { updateRepo } = require("@artsy/update-repo")
const { execSync } = require("child_process")
const path = require("path")
const { buildSchema, introspectionQuery, graphqlSync } = require("graphql")
const { readFileSync, writeFileSync } = require("fs")

const defaultBody =
  "Greetings human :robot: this PR was automatically created as part of metaphysics' deploy process."

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
  body = defaultBody,
}) {
  await updateRepo({
    repo: {
      owner: "artsy",
      repo,
    },
    branch: "artsyit/update-schema",
    title: "chore: update metaphysics graphql schema",
    targetBranch: "main",
    commitMessage: "chore: update metaphysics graphql schema",
    body,
    assignees: ["artsyit"],
    labels: ["Squash On Green"],
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

    const reposToUpdate = [
      { repo: "eigen", body: `${defaultBody} #nochangelog` },
      { repo: "force" },
      { repo: "forque" },
      { repo: "pulse", dest: "vendor/graphql/schema/metaphysics.json" },
      { repo: "volt", dest: "vendor/graphql/schema/metaphysics.json" },
    ]

    const updatePromises = reposToUpdate.map((repo) => updateSchemaFile(repo))

    await Promise.all(updatePromises)
  } catch (error) {
    console.error(error)
    process.exit(1)
  }
}

main()
