### The 1 paragraph explaination of DataLoader

[DataLoader](https://github.com/facebook/dataloader) is a per-request cache, we use a new DataLoader on each API route.
A DataLoader takes all of our external API requests and batches them together. This means that we should never end up
calling the same request twice with complex queries.

For example, with this query:

```graphql
{
  # GET artists/popular
  popular_artists(size: 5) {
    artists {
      # GET artist/:id
      name
      # GET artist/:id/artworks
      artworks_connection(first: 5) {
        edges {
          node {
            title
            artist {
              # GET artist/:id
              name
            }
          }
        }
      }
    }
  }
}
```

See how in the above query we ask for `# GET artist/:id` twice, in the popular artists' name, and then later in the
artwork's artist - using the dataloader pattern that call would only happen once.

### How we use DataLoader

Our usage has a few moving parts:

- The `api` object: for example [`/lib/apis/gravity.js`][api_grav] - it is a wrapper around [fetch][fetch] that
  customizes the request to the service. The params tend to differ depending on the authentication method for that
  server.

- The `loader factory` - there are three loader factories. They all end up exposing the same API, so your tests should
  be the same shape regardless of the servers or types of calls you need to make.

  When an unauthenticated API call is made we take the result and store it in memcache, then the next time (potentially
  on another user's request) the cached result is passed back and we update memcache for the next request.

  - [`loader_without_authentication_factory`][no_auth_loader] for API requests which can call the `api` directly and be
    safely cached in memcache.
  - [`loader_with_authentication_factory`][auth_loader] for API requests that _could_ require a call for an
    authentication token (like the examples in [Adding a New Microservice][new_micro].)
  - [`loader_one_off_factory`][one_off_loader] for API requests which have custom auth schemes, or need to ignore cache
    completely.

- The `loader` themselves. These are a set of functions which [are exposed][loaders] as properties on the root object
  during the resolving stages of our graphQL implementation.

  ```js
  import { gravityLoaderWithoutAuthenticationFactory as gravityLoader } from "../api"

  export default {
    artistArtworksLoader: gravityLoader(id => `artist/${id}/artworks`),
    artistLoader: gravityLoader(id => `artist/${id}`),
    // [...]
  }
  ```

  This is used inside the schema, when you need to make a request to gravity, for example:

  ```js
  export const ArtistType = new GraphQLObjectType({
  name: "Artist",
  interfaces: [NodeInterface],
  isTypeOf: obj => has(obj, "birthday") && has(obj, "artworks_count"),
  fields: () => {
    return {

      // [...]

      artworks_connection: {
      type: artworkConnection,
      args: pageable({
        sort: ArtworkSorts,
        filter: {
          type: new GraphQLList(ArtistArtworksFilters),
        },
        published: {
          type: GraphQLBoolean,
          defaultValue: true,
        },
      }),

      resolve: async (artist, options, request, { rootValue: { artistArtworksLoader } }) => {
        const { limit: size, offset } = getPagingParameters(options)
        const { sort, filter, published } = options

        const gravityArgs = { size, offset, sort, filter, published }
        const artworks = await artistArtworksLoader(artist.id, gravityArgs)

        return connectionFromArraySlice(artworks, options, {
          arrayLength: artistArtworkArrayLength(artist, filter),
          sliceStart: offset,
        })
      },
    },
    // [...]
  ```

[api_grav]: https://github.com/artsy/metaphysics/blob/master/lib/apis/gravity.js
[fetch]: https://github.com/artsy/metaphysics/blob/master/lib/apis/fetch.js
[no_auth_loader]: https://github.com/artsy/metaphysics/blob/master/lib/loaders/api/loader_without_authentication_factory.js
[auth_loader]: https://github.com/artsy/metaphysics/blob/master/lib/loaders/api/loader_with_authentication_factory.js
[one_off_loader]: https://github.com/artsy/metaphysics/blob/master/lib/loaders/api/loader_one_off_factory.js
[new_micro]: https://github.com/artsy/metaphysics/blob/master/docs/adding_a_new_microservice.md
[loaders]: https://github.com/artsy/metaphysics/blob/master/lib/loaders/index.js
