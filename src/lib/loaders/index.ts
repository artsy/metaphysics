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

type ResponseHeaders = { [header: string]: string }

export type BodyAndHeaders<B = any, H = ResponseHeaders> = {
  body: B
  headers: H
}

export interface LoaderFactory {
  <Body = any>(
    path: string,
    globalParams?: any,
    pathAPIOptions?: APIOptions
  ): StaticPathLoader<Body>
  <Body = any, PathGeneratorParams = string>(
    path: PathGenerator<PathGeneratorParams>,
    globalParams?: any,
    pathAPIOptions?: APIOptions
  ): DynamicPathLoader<Body, PathGeneratorParams>
  <Body = any>(
    path: string,
    globalParams: any,
    pathAPIOptions: { headers: false } & APIOptions
  ): StaticPathLoader<Body>
  <Body = any, PathGeneratorParams = string>(
    path: PathGenerator<PathGeneratorParams>,
    globalParams: any,
    pathAPIOptions: { headers: false } & APIOptions
  ): DynamicPathLoader<Body, PathGeneratorParams>
  <Body = any, Headers = ResponseHeaders>(
    path: string,
    globalParams: any,
    pathAPIOptions: { headers: true } & APIOptions
  ): StaticPathLoader<BodyAndHeaders<Body, Headers>>
  <Body = any, PathGeneratorParams = string, Headers = ResponseHeaders>(
    path: PathGenerator<PathGeneratorParams>,
    globalParams: any,
    pathAPIOptions: { headers: true } & APIOptions
  ): DynamicPathLoader<BodyAndHeaders<Body, Headers>, PathGeneratorParams>
}

/**
 * Creates a new set of data loaders for all routes. These should be created for each GraphQL query and passed to the
 * `graphql` query execution function.
 *
 * Only if credentials are provided will the set include authenticated loaders, so before using an authenticated loader
 * it would be wise to check if the loader is not in fact `undefined`.
 */
export default (
  accessToken,
  userID,
  opts
): LoadersWithoutAuthentication & Partial<LoadersWithAuthentication> => {
  const loaders = createLoadersWithoutAuthentication(opts)
  if (accessToken) {
    return Object.assign(
      {},
      loaders,
      createLoadersWithAuthentication(accessToken, userID, opts)
    )
  }
  return loaders
}
