import { getPagingParameters } from "relay-cursor-paging"
import { connectionFromArraySlice } from "graphql-relay"

// options are connection related arguments
// params are params passed into gravity to scope the results
const followArtistsResolver = (params, options, config) => {
  if (!config.followedArtistsLoader) return null
  const { limit: size, offset } = getPagingParameters(options)
  const gravityArgs = {
    size,
    offset,
    total_count: true,
    ...params,
  }
  return config.followedArtistsLoader(gravityArgs).then(({ body, headers }) => {
    return connectionFromArraySlice(body, options, {
      arrayLength: parseInt(headers["x-total-count"] || "0", 10),
      sliceStart: offset,
    })
  })
}

export default followArtistsResolver
