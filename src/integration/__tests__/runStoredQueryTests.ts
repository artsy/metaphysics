import { readFileSync } from "fs"
import fetch from "lib/apis/fetch"
import chalk from "chalk"
const { USER_ACCESS_TOKEN: accessToken, USER_ID: userID } = process.env

if (!accessToken && !userID) {
  console.error(`
  Cannot run queries without a user access token and user ID. You can get one by
  - 1. Signing in on staging.artsy.net
  - 2. Open a dev console
  - 3. and get the values \`copy(sd.CURRENT_USER.id)\` and \`copy(sd.CURRENT_USER.accessToken)\`
  - 4. you can add these to your .env as:

       USER_ID=[id]
       USER_ACCESS_TOKEN=[accessToken]

    You can also grab these from Reaction's .env if you have that set up.
  - 5. Run this script like so:

       $ env USER_ID=[id] USER_ACCESS_TOKEN=[accessToken] yarn test:validQueries
  `)
  process.exit(1)
}

enum Env {
  Prod,
  Staging,
  Dev,
}

const url = getURL(Env.Dev)

const saleArtworkID =
  "georg-jensen-beaded-slash-kugle-sterling-silver-cutlery-60"

// We want to be able to run queries that require non-null variables
// this is a map of a query name to their hard-coded variables.
//
// I just picked some at random
const variablesLookup = {
  QueryRenderersArtistQuery: { artistID: "banksy", isPad: true },
  SelectMaxBidRefetchQuery: { saleArtworkID },
  QueryRenderersGeneQuery: { geneID: "feminist-art" },
  QueryRenderersInquiryQuery: {
    artworkID: "banksy-flower-bomber-by-brandalism",
  },
  QueryRenderersSaleQuery: { saleID: "phillips-summer-school-1" },
  QueryRenderersWorksForYouQuery: { selectedArtist: "banksy" },
  BidFlowConfirmBidScreenRendererQuery: { saleArtworkID },
  BidFlowSelectMaxBidRendererQuery: { saleArtworkID },
  QueryRenderersBidFlowQuery: {
    artworkID: saleArtworkID,
    saleID: "bruun-rasmussen-silver-ceramics-and-design",
  },
}

// These are queries that should be skipped, because they are known to fail with
// the current schema (and presumably for good reasons).
const KnownToFail = [
  "e3c3792bba0779073c8650e4dc8e9112",
  "8abdeb580e8273e92d409e8d5084d1da",
  "ae4881bc22e6c72481ffe52aefd8292a",
  "671c8e35d0cc4647276acf57d707d7c8",
  "55be0af4e47ea70f24dd6cdc9d9e3aa0",
  "7480b5aa24d2a5de3d84024d4fb3cd37",
  "f42a41c4bc40fb2dd574a5c31bcad0b3",
  "82bf82155b8d7cd5b12d0659b36ef02c",
  "6df12a44c12d6839296fff1e1c88551d",
  "fe2da1d1b1abcd66129c15a6bce5abc7",
  "35ac3b92824f845526fead61ce39b078",
  "114550fc02504f0cfe5cb99ef099df28",
  "c733b779a5e851aa0ab7d5e0154264a9",
  "aa7c13bc9b101f2e7d8462bf6b3692ca",
]

const go = async () => {
  const map = readFileSync("src/data/complete.queryMap.json", "utf8")
  const queries = JSON.parse(map)
  for (const key in queries) {
    if (Object.prototype.hasOwnProperty.call(queries, key)) {
      const queryString: string = queries[key]
      // Pull out the query name with some simple splitting
      const name = queryString
        .split("(")[0]
        .split("{")[0]
        .replace("query ", "")
        .trim()

      // Mutations aren't complicated queries generally
      if (queryString.includes("mutation")) {
        console.log(
          chalk.grey(`  ${name} (${key}): Skipping due to being a mutation`)
        )
      } else if (KnownToFail.includes(key)) {
        console.log(
          chalk.grey(
            `  ${name} (${key}): Skipping due to being a known failure with current schema`
          )
        )
      } else {
        const queryHasArgs = queryString.includes("Query(")
        const queryVariables = variablesLookup[name]
        if (queryHasArgs && !queryVariables) {
          const msg = chalk.grey(
            `  ${name} (${key}): Skipping due to query args which aren't in the lookup`
          )
          console.log(msg)
          continue
        }

        // Start making the query
        process.stdout.write(
          `   ${chalk.bold.whiteBright(name)} (${key}): calling `
        )
        const response = await request(queryString, queryVariables)
        if (!response.errors) {
          console.log(chalk.green.bold("✓"))
        } else {
          console.log(chalk.red.bold("✖"))
          // It failed, so print out the errors from metaphysics
          console.log(chalk.gray("\n\n------------------------\n\n"))
          console.log(response.errors)
          console.log(chalk.gray("\n\n------------------------\n\n"))
        }
      }
    }
  }
}

const request = (query: string, variables?: any) =>
  fetch(url as string, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": "Integration Tests",
      "X-USER-ID": userID,
      "X-ACCESS-TOKEN": accessToken,
    },
    body: JSON.stringify({ query, variables }),
  })
    .catch((err) => {
      if (err.message.includes("ESOCKETTIMEDOUT")) {
        process.stdout.write(
          `\n${chalk.red.bold("[!]")} Timed out, retrying... `
        )
        return request(query, variables)
      } else {
        throw err
      }
    })
    .then((response) => {
      if (!(response.status >= 200 && response.status < 300)) {
        return response
      } else {
        const error: any = new Error(response.statusText)
        error.response = response
        throw error
      }
    })

function getURL(environment) {
  switch (environment) {
    case Env.Prod:
      return "https://metaphysics-production.artsy.net"

    case Env.Staging:
      return "https://metaphysics-staging.artsy.net"

    case Env.Dev:
      return "http://localhost:5001"
  }
}

console.log("Starting up running queries against:")
console.log("  " + chalk.bold.whiteBright(url!))
console.log("")
go()
