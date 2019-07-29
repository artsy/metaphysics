declare module "relay-cursor-paging" {
  import { GraphQLFieldConfigArgumentMap } from "graphql"

  function pageable(
    args?: GraphQLFieldConfigArgumentMap
  ): GraphQLFieldConfigArgumentMap

  interface CursorPageable {
    // Backward Paging Arguments
    before?: string
    last?: number

    // Forward Paging Arguments
    after?: string
    first?: number

    [key: string]: any
  }

  // These are copied from the relay-cursor-paging lib
  // https://github.com/darthtrevino/relay-cursor-paging/blob/master/src/interfaces.ts
  interface PagingParameters {
    offset: number
    limit: number
  }

  function getPagingParameters(input: CursorPageable): PagingParameters
}
