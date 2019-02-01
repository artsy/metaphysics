import createLoaders from "../lib/loaders"

export interface RootValues {
  /** Optionally you can include an access token for a logged in user */
  accessToken: string | undefined
  /** Optionally you can include a user token for a logged in user */
  userID: string | undefined
  /** Optionally you should include a timezone for the user */
  defaultTimezone: string | undefined

  /** The schema used by the internal exchange graphql engine */
  exchangeSchema: GraphQLSchema
}

/**
 * The root values we pass into the GraphQL query resolver,
 * contains optional user information, and all of our data-loaders.
 * */
export type RootValue = RootValues & ReturnType<typeof createLoaders>

declare module "graphql/type" {
  interface GraphQLResolveInfo {
    /**
     * Where we store user/data-loader context, yes there's a context
     * object but without a big refactor it's not happening soon.
     */
    readonly rootValue: RootValue
  }
}
