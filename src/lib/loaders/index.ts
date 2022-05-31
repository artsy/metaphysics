import {
  createLoadersWithAuthentication,
  LoadersWithAuthentication,
} from "./loaders_with_authentication"
import {
  createLoadersWithoutAuthentication,
  LoadersWithoutAuthentication,
} from "./loaders_without_authentication"
import { APIOptions } from "./api"
import {
  StaticPathLoader,
  DynamicPathLoader,
  PathGenerator,
} from "./api/loader_interface"

export type ResponseHeaders = { [header: string]: string }

export type BodyAndHeaders<B = any, H = ResponseHeaders> = {
  body: B
  headers: H
  cached?: number
}

// Remove the `headers` key here so we can use pattern matching below to
// differentiate between loaders that are configured to return headers and those
// that are not.
type APIOptionsWithoutHeaders = Pick<
  APIOptions,
  Exclude<keyof APIOptions, "headers">
>

export interface LoaderFactory {
  <Body = any>(
    path: string,
    globalParams?: any,
    pathAPIOptions?: APIOptionsWithoutHeaders
  ): StaticPathLoader<Body>
  <Body = any, PathGeneratorParams = string>(
    path: PathGenerator<PathGeneratorParams>,
    globalParams?: any,
    pathAPIOptions?: APIOptionsWithoutHeaders
  ): DynamicPathLoader<Body, PathGeneratorParams>
  <Body = any>(
    path: string,
    globalParams: any,
    pathAPIOptions: { headers: false } & APIOptionsWithoutHeaders
  ): StaticPathLoader<Body>
  <Body = any, PathGeneratorParams = string>(
    path: PathGenerator<PathGeneratorParams>,
    globalParams: any,
    pathAPIOptions: { headers: false } & APIOptionsWithoutHeaders
  ): DynamicPathLoader<Body, PathGeneratorParams>
  <Body = any, Headers = ResponseHeaders>(
    path: string,
    globalParams: any,
    pathAPIOptions: { headers: true } & APIOptionsWithoutHeaders
  ): StaticPathLoader<BodyAndHeaders<Body, Headers>>
  <Body = any, PathGeneratorParams = string, Headers = ResponseHeaders>(
    path: PathGenerator<PathGeneratorParams>,
    globalParams: any,
    pathAPIOptions: { headers: true } & APIOptionsWithoutHeaders
  ): DynamicPathLoader<BodyAndHeaders<Body, Headers>, PathGeneratorParams>
}

type AllLoaders = LoadersWithoutAuthentication &
  Partial<LoadersWithAuthentication>

interface AvailableLoaders extends AllLoaders {
  unauthenticatedLoaders: LoadersWithoutAuthentication
  authenticatedLoaders: Partial<LoadersWithAuthentication>
}

/**
 * Creates a new set of data loaders for all routes. These should be created for each GraphQL query and passed to the
 * `graphql` query execution function.
 *
 * Only if credentials are provided will the set include authenticated loaders, so before using an authenticated loader
 * it would be wise to check if the loader is not in fact `undefined`.
 */
export const createLoaders = (accessToken, userID, opts): AvailableLoaders => {
  const unauthenticatedLoaders = createLoadersWithoutAuthentication(opts)
  let authenticatedLoaders = {}
  if (accessToken) {
    authenticatedLoaders = createLoadersWithAuthentication(
      accessToken,
      userID,
      opts
    )
  }
  return {
    ...unauthenticatedLoaders,
    ...authenticatedLoaders,
    unauthenticatedLoaders,
    authenticatedLoaders,
  }
}
