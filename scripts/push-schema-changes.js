// @ts-check

const { updateRepo } = require("@artsy/update-repo")
const { execSync } = require("child_process")
const path = require("path")
const { buildSchema, getIntrospectionQuery, graphqlSync } = require("graphql")
const { readFileSync, writeFileSync } = require("fs")

const introspectionQuery = getIntrospectionQuery()

const defaultBody =
  "Greetings human :robot: this PR was automatically created as part of metaphysics' deploy process."

/**
 * updates the schema file on repo
 * @param {Object} input
 * @param {string} input.repo - repo: name of the artsy repo to update
 * @param {string} [input.body] - body: The PR body description
 * @param {Array<string>} [input.destinations] - destinations: Paths to schema files in target repo
 */
async function updateSchemaFile({
  repo,
  destinations = ["data/schema.graphql"],
  body = defaultBody,
}) {
  console.log(`Updating schema for ${repo}`)
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
      execSync("yarn config set ignore-engines true", { cwd: repoDir })
      execSync("yarn install", { cwd: repoDir })

      destinations.forEach((dest) => {
        const repoDest = path.join(repoDir, dest)
        if (dest.endsWith(".json")) {
          const sdl = readFileSync("_schemaV2.graphql", "utf8").toString()
          const schema = buildSchema(sdl, { commentDescriptions: true })
          const gql = graphqlSync(schema, introspectionQuery)
          writeFileSync(repoDest, JSON.stringify(gql, null, 2))
        } else {
          execSync(`cp _schemaV2.graphql '${repoDest}'`)

          // Running the compiler directly for Rails projects
          const relayCompilerCommand = ["pulse", "volt"].includes(repo)
            ? "./node_modules/.bin/relay-compiler"
            : "yarn relay"

          execSync(relayCompilerCommand, { cwd: repoDir })
        }

        execSync(
          `[ ! -f ./node_modules/.bin/prettier ] || ./node_modules/.bin/prettier --parser=graphql --write ${dest}`,
          {
            cwd: repoDir,
          }
        )
      })
    },
  })
}

const supportedRepos = {
  eigen: { body: `${defaultBody} #nochangelog` },
  energy: {},
  prediction: {},
  force: {},
  forque: {},
  pulse: { destinations: ["vendor/graphql/schema/metaphysics.json"] },
  volt: {
    destinations: [
      "vendor/graphql/schema/schema.graphql",
      "vendor/graphql/schema/metaphysics.json",
    ],
  },
}

/**
 * Splits the supported repositories into chunks for parallel processing on the CI
 * @param {Array<string>} repos
 * @param {number} totalNodes
 * @param {number} nodeIndex
 * @returns {Array<string>} subset of repos assigned to the current node
 */
function getRepoSubset(repos, totalNodes, nodeIndex) {
  if (totalNodes !== 1) {
    return repos.slice(nodeIndex, nodeIndex + 1)
  }

  return repos
}

async function main() {
  try {
    execSync("yarn dump:staging")

    const repos = Object.keys(supportedRepos)

    // Read total_nodes and node_index from command line arguments
    const [totalNodesArg, nodeIndexArg] = process.argv.slice(2)
    const totalNodes = parseInt(totalNodesArg, 10) || 1
    const nodeIndex = parseInt(nodeIndexArg, 10) || 0

    if (totalNodes > 1 && totalNodes !== repos.length) {
      throw new Error(
        `Number of nodes should be the number of supported repos or 1, received: ${totalNodes}`
      )
    }

    const reposToUpdate = getRepoSubset(repos, totalNodes, nodeIndex)

    console.log(`Dumping staging schema for the repos ${reposToUpdate}`)

    const updatePromises = reposToUpdate.map((repo) => {
      if (supportedRepos[repo]) {
        updateSchemaFile({ repo: repo, ...supportedRepos[repo] })
      } else {
        console.error(`Repo ${repo} is not supported`)
      }
    })

    await Promise.all(updatePromises)
  } catch (error) {
    console.error(error)
    process.exit(1)
  }
}

main()
