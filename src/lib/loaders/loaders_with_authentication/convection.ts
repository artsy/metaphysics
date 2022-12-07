import factories from "../api"
import config from "config"
import fetch from "node-fetch"
import urljoin from "url-join"
import { GraphQLError } from "graphql"

const { CONVECTION_APP_ID, CONVECTION_API_BASE } = config

interface GraphQLArgs {
  query: string
  variables: any
}

export default (accessToken, opts) => {
  let convectionTokenLoader
  const gravityAccessTokenLoader = () => Promise.resolve(accessToken)

  const {
    gravityLoaderWithAuthenticationFactory,
    convectionLoaderWithAuthenticationFactory,
  } = factories(opts)

  const convectionAccessTokenLoader = () =>
    convectionTokenLoader().then((data) => data.token)

  const gravityLoader = gravityLoaderWithAuthenticationFactory(
    gravityAccessTokenLoader
  )
  const convectionLoader = convectionLoaderWithAuthenticationFactory(
    convectionAccessTokenLoader
  )

  // This generates a token with a lifetime of 1 minute, which should be plenty of time to fulfill a full query.
  convectionTokenLoader = gravityLoader(
    "me/token",
    { client_application_id: CONVECTION_APP_ID },
    { method: "POST" }
  )

  const convectionGraphQLLoader = async <T = unknown>({
    query,
    variables,
  }: GraphQLArgs): Promise<Record<string, T>> => {
    const { token } = await convectionTokenLoader()

    const body = JSON.stringify({
      query,
      variables,
    })

    const response = await fetch(urljoin(CONVECTION_API_BASE, "graphql"), {
      method: "POST",
      body,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    })

    const json = await response.json()
    const { data: convectionData, error, errors: convectionErrors } = json

    if (error) {
      throw new Error(`[loaders/convection.ts]: ${error.message}`)
      // If the convection request failed for some reason, throw its errors.
    } else if (convectionErrors) {
      const errors = convectionErrors.reduce((acc, error) => {
        return acc + " " + error["message"]
      }, "From convection service:")

      throw new GraphQLError(`[loaders/convection.ts]: ${errors}`)
    } else {
      return convectionData
    }
  }

  return {
    assetCreateLoader: convectionLoader(`assets`, {}, { method: "POST" }),
    convectionGraphQLLoader,
    convectionTokenLoader,
    createConsignmentInquiryLoader: convectionLoader(
      "consignment_inquiries",
      {},
      { method: "POST" }
    ),
    submissionCreateLoader: convectionLoader(
      `submissions`,
      {},
      { method: "POST" }
    ),
    submissionsLoader: convectionLoader(`submissions`),
    submissionUpdateLoader: convectionLoader(
      (id) => `submissions/${id}`,
      {},
      { method: "PUT" }
    ),
  }
}
