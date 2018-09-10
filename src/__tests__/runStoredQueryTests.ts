import { readFileSync } from "fs"
import fetch from "lib/apis/fetch"
import chalk from "chalk"
const { USER_ACCESS_TOKEN: accessToken, USER_ID: userID } = process.env

if (!accessToken && !userID) {
  console.error(`
  Cannot run queries without a user access token and user ID. You can get one by 
  - 1. Signing in on staging.artsy.net
  - 2. Open a dev console
  - 3. and get the values \`sd.CURRENT_USER.id\` and \`sd.CURRENT_USER.accessToken\`
  - 4. you can add these to your .env as:

       USER_ID=[id]
       USER_ACCESS_TOKEN=[accessToken]

    You can also grab these from Reaction's .env if you have that set up.
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

const go = async () => {
  const map = readFileSync("src/data/complete.queryMap.json", "utf8")
  const queries = JSON.parse(map)
  for (const key in queries) {
    if (queries.hasOwnProperty(key)) {
      const queryString: string = queries[key]
      // Pull out the query name with some simple splitting
      const name = queryString
        .split("(")[0]
        .split("{")[0]
        .replace("query ", "")
        .trim()

      // Mutations aren't complicated queries generally
      if (queryString.includes("mutation")) {
        console.log(chalk.grey(`  ${name}: Skipping due to being a mutation`))
      } else {
        const queryHasArgs = queryString.includes("Query(")
        const queryVariables = variablesLookup[name]
        if (queryHasArgs && !queryVariables) {
          const msg = chalk.grey(
            `  ${name}: Skipping due to query args which aren't in the lookup`
          )
          console.log(msg)
          continue
        }

        // Start making the query
        process.stdout.write(`   ${chalk.bold.whiteBright(name)}: calling `)
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
  fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": "Integration Tests",
      "X-USER-ID": userID,
      "X-ACCESS-TOKEN": accessToken,
    },
    body: JSON.stringify({ query, variables }),
  }).then(response => {
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
