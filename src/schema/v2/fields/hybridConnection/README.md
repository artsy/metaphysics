# Hybrid connection

_Tools for building a relay connection from multiple sources_

This is a small module that builds a relay connection which is served from multiple sources. It aims to have a similar interface to [`connectionFromArraySlice`](https://github.com/graphql/graphql-relay-js/blob/17231860ee64431009c193be2e6ac444936a88ea/src/connection/arrayConnection.js#L49), which serializes its cursors as `arrayconnection:{index}`, replacing a single index with a serialized (query) string of last-seen indexes(\*) for each source collection as well as the overall position (0-based) of the node. The hybrid connection serializes each node's position in the overall collection _as well as_ that of the last seen of each source's nodes in its own collection.

It exports a single function, `fetchHybridConnection` which accepts a map of keys(arbitrary strings for each source) and values (fetchers which can respect `limit`/`offset`/`sort` args). The function decodes the cursor if present and fetches from each source using its own separately-tracked offset arguments. A final `transform` function argument may be used to sort or transform the collection of nodes. Then it attaches new offsets and cursors before returning the expected connection interface.

**In order to work as expected in constructing a collection from multiple sources** the arguments to `fetchHybridConnection()` _must_ implement multiple sorts:

- Each function provided to `fetchers` must provide a consistently-sorted result (provide a `sort` via `args` if necessary)
- `transform` must be able to apply identical sorting logic to the combined connection

**Caveats** (PRs welcome)

- Only supports one-directional relay pagination args `first`/`after`
- Implementation detail: the `HybridOffsets` object (which becomes our cursor) tracks position in the combined collection and the source offsets differently: The former, `_position` (in the entire collection) is the _0-based index_, while the latter for each individual source is the _offset_ in that collection. Thus an 'empty' offsets object (before the first element has been added) would look like `{ sourceA: 0, sourceB: 0, _position: null }`.

Example:

```ts
const result = await fetchHybridConnection({
  // The relay pagination args, plus an optional `sort`
  args: { first: 4 },
  // Fetchers for each source in the connection
  fetchers: {
    // a fetcher that can delegate to a typical paginated api
    message: ({limit, offset, sort}) => fetchMessages(limit, offset, sort),

    // another fetcher that houses pagination logic within the resolver
    orderEvent: async ({limit, offset}) => {
      const all = await fetchAllEvents({sort})
      return {
        totalCount: all.length
        nodes: all.slice(offset, limit)
      }
    },
  },
  // final transformations on the full query result (including combined sorting)
  transform: (args, nodes) => {
    return nodes.sort((a, b) =>
      args.sort === 'DESC'
      ? Date.parse(b.created_at) - Date.parse(a.created_at)
      : Date.parse(a.created_at) - Date.parse(b.created_at)
    )
  }
)

// The result contains our nodes with cursors...
console.log(result)
  // => {
  //   edges: [
  //     {
  //       cursor: "b2Zmc2V0czpfcG9zaXRpb249MCZtZXNzYWdlPTEmb3JkZXJFdmVudD0w",
  //       node: { /* the node */ },
  //     },
  //     {
  //       cursor: "b2Zmc2V0czpfcG9zaXRpb249MSZtZXNzYWdlPTEmb3JkZXJFdmVudD0x",
  //       node: {},
  //     },
  //     {
  //       cursor: "b2Zmc2V0czpfcG9zaXRpb249MiZtZXNzYWdlPTImb3JkZXJFdmVudD0x",
  //       node: {},
  //     },
  //     {
  //       cursor: "b2Zmc2V0czpfcG9zaXRpb249MyZtZXNzYWdlPTMmb3JkZXJFdmVudD0x",
  //       node: {},
  //     },
  //   ],
  //   pageInfo: {
  //     /* Page info */
  //   },
  // }

// And those cursors encode each node's place in *all* collections
// (an implementation detail which makes the hybrid connection possible)
const { cursor } = result.edges[3]

console.log(Buffer.from(cursor, "base64").toString("utf-8"))
  // => "offsets:_position=3&message=3&orderEvent=1"
```
