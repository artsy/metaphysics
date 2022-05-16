import { danger, warn, fail, markdown } from "danger"

type EndPoints = {
  [name: string]: {
    production: string
    staging: string
    localSchemaPath: string
    breakingChanges?: string[]
  }
}

const serviceMap: EndPoints = {
  exchange: {
    production: "https://exchange.artsy.net/api",
    staging: "https://exchange-staging.artsy.net/api",
    localSchemaPath: "src/data/exchange.graphql",
  },
  vortex: {
    production: "https://vortex.artsy.net/api",
    staging: "https://vortex-staging.artsy.net/api",
    localSchemaPath: "src/data/vortex.graphql",
  },
  gravity: {
    production: "https://api.artsy.net/api",
    staging: "https://stagingapi.artsy.net/api",
    localSchemaPath: "src/data/gravity.graphql",
  },
}

export default async () => {
  const allUpstreamGraphQLAPIs = Object.keys(serviceMap)

  // This actually isn't possible right now, because MP doesn't do PR based
  // deploys, but adding in anticipation of that maybe changing.
  const isProductionDeployPR = false

  // Find which APIs have corresponding, on a prod deploy we would
  // want to check every service.
  const servicesWhichAreChangedInThisPR = allUpstreamGraphQLAPIs.filter(
    (service) =>
      isProductionDeployPR ||
      danger.git.modified_files.includes(serviceMap[service].localSchemaPath)
  )

  // Bail because there's no work to do
  if (servicesWhichAreChangedInThisPR.length === 0) {
    console.log("No GraphQL schemas changed in this PR. Skipping checks.")
    return
  }

  // Wait till we know we have to do work before actually importing helpers
  const {
    downloadSchemaFromURL,
    getBreakingChanges,
    // @ts-ignore
  } = await import("./schemaValidatorUtils")

  // This is a separate set of the endpoints with breaking changes
  const servicesWithBreakingChanges: EndPoints = {}

  // Loop through each API which changed, grab their new schema from
  // the metaphysics repo then compare it to their API's schema
  for (const serviceName of servicesWhichAreChangedInThisPR) {
    const service = serviceMap[serviceName]
    const localSchema = await danger.github.utils.fileContents(
      service.localSchemaPath
    )

    const endpoint = isProductionDeployPR ? service.production : service.staging
    const upstreamSchema = await downloadSchemaFromURL(endpoint)

    const breakingChanges = await getBreakingChanges(
      localSchema,
      upstreamSchema
    )

    // Create a new copy of the service, with the breaking changes added
    if (breakingChanges.length) {
      servicesWithBreakingChanges[serviceName] = {
        ...service,
        breakingChanges,
      }
    }
  }

  // Reporting back to the PR - offer a single message for all of the potentially
  // failed services,
  const failedServiceNames = Object.keys(servicesWithBreakingChanges)
  const failedServicesSentence = danger.utils.sentence(failedServiceNames)

  if (failedServiceNames.length === 0) {
    console.log(`No breaking changes for ${failedServicesSentence}`)
    return
  }

  const version = isProductionDeployPR ? "staging" : "production"
  const message = isProductionDeployPR ? fail : warn
  const s = failedServiceNames.length === 1 ? "" : "s"
  const are = failedServiceNames.length === 1 ? "is" : "are"

  message(`
    There ${are} a breaking difference${s} between the **${version}** deployed 
    schema${s} for **${failedServiceNames}**. 
    
    The changes you have made  to the local schema${s} in metaphysics are 
    relying on the deployment of the  upstream service${s}. You should deploy 
    those changes.
    `)

  for (const serviceName of failedServiceNames) {
    const service = servicesWithBreakingChanges[serviceName]
    const url = isProductionDeployPR ? service.staging : service.production

    markdown(`### <a href='${url}'>${serviceName}</a>
${service.breakingChanges!.join("\n - ")}
      `)
  }
}
