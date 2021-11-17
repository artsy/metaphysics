# Hybrid connection

_Tools for building a relay connection from multiple sources_

This is a small module that builds a relay connection which is served from multiple sources. It aims to have a similar interface to [`connectionFromArraySlice`](https://github.com/graphql/graphql-relay-js/blob/17231860ee64431009c193be2e6ac444936a88ea/src/connection/arrayConnection.js#L49), which serializes its cursors as `arrayconnection:{index}`, replacing a single index with a serialized (query) string of last-seen indexes(\*) for each source collection as well as the overall position (0-based) of the node.

It exports a single function, `fetchHybridConnection` which accepts a map of keys(arbitrary strings for each source) and values (fetchers which can respect `limit`/`offset` args). The function decodes the `after` cursor if present and fetches from each source using its own separately-tracked offset arguments. Then it attaches new offsets and cursors before returning the expected connection interface.

Example:

```ts
const result = await fetchHybridConnection({
  args: { first: 4 },
  fetchers: {
    // a fetcher for messages
    msg: ({limit, offset, sort}) => fetchMessages(limit, offset, sort),

    // a fetcher for order events that requires a little
    ord: async ({limit, offset}) => {
      const all = await fetchEvents({sort})
      return {
        totalCount: all.length
        nodes: all.slice(offset, limit)
      }
    },
  },
  // final transformations on the full query result like sorting
  transform: (args, nodes) => {
    return nodes.sort((a, b) =>
      args.sort === 'DESC'
      ? Date.parse(b.created_at) - Date.parse(a.created_at)
      : Date.parse(a.created_at) - Date.parse(b.created_at)
    )
  }
)

result ===
  {
    edges: [
      {
        cursor: "b2Zmc2V0czpfcG9zaXRpb249MCZtc2c9MSZvcmQ9MA==",
        node: { /* the node */ },
      },
      {
        cursor: "b2Zmc2V0czpfcG9zaXRpb249MSZtc2c9MSZvcmQ9MQ==",
        node: {},
      },
      {
        cursor: "b2Zmc2V0czpfcG9zaXRpb249MiZtc2c9MiZvcmQ9MQ==",
        node: {},
      },
      {
        cursor: "b2Zmc2V0czpfcG9zaXRpb249MyZtc2c9MyZvcmQ9MQ==",
        node: {},
      },
    ],
    pageInfo: {
      /* Page info */
    },
  }
const { cursor } = result.edges[3]

Buffer.from(cursor, "base64").toString("utf-8") ===
  "offsets:_position=3&msg=3&ord=1"
```

**Caveats**

- Only supports one-directional relay pagination args `first`/`after` and descending sort
- Expects fetchers to accept `limit`/`offset` args (plus a descending sort)
- If a new element is added to the front of the list (eg a new message in a chat) the offsets will all be off which will probably screw up querying. This seems like an inherent limitation of offset-based pagination.

> (\*) Under the hood, the HybridOffsets tracks position (index in overall collection) and the source offsets differently: The former is the _0-based index_ in the entire collection, while the former is the _offset_ in that collection. Thus an 'empty' offsets object for the above example would look like `{ a: 0, b: 0 _position: null }`. A PR to clean up this confusing bit would be great.
