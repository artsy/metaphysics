## Adding a gravity endpoint into Metaphysics

This doc is aimed at helping backend devs or beginner front end devs on how to add an existing Gravity endpoint into Metaphysics. This document is living and we encourage and welcome all amendments or updates.

### Before you start

This article assumes that you already have your local machine setup with Metaphysics and have your GraphiQL.app or other app (Postman, Insomnia etc) setup. If you need help with that, you can start [here](https://github.com/artsy/metaphysics#setting-up-your-local-graphiql). It also assumes that the endpoint that you want to add has been deployed to the staging environment and is accessible (any feature toggles needed have also been toggled).

Once that has been completed you can start your local Metaphysics server with `yarn start`. This will generate the new schema files from any new changes and will continue to do so whilst the process is running. Should you have any issues with the schema generation, you can always run `yarn dump:local` in the Metaphysics directory which manually generates the schema changes. This script (and other useful scripts) can be found in the `package.json` file.

With your favourite graphql app, you should be able to hit the local Metaphysics server to refresh the schema. In insomnia, you can click on the "schema" button in the GraphQL panel to manually refresh this, if you don't have auto-refresh turned on (also found in this list). Sidenote: During development Metaphysics should be pointed at Gravity staging (unless otherwise configured in `.env.shared`)

### Adding a GET request

In order to learn how to add a GET request, this section will walk you through an existing GET request and editing an existing field. The request that we want to look at is the artwork request.

<!-- This should render the code inline -->

https://github.com/artsy/metaphysics/blob/79a387cd837d48485bf6a0aa00e8999ad323ff23/src/lib/loaders/loaders_with_authentication/gravity.ts#L39

As seen in the code, this `gravityLoader` takes in an `id` which it passes to the artwork URL. This loader function calls the `gravityLoaderWithAuthenticationFactory` function which eventually calls the gravity api connector which shows how the request will be made to gravity.

<!-- This should render the code inline -->

https://github.com/artsy/metaphysics/blob/79a387cd837d48485bf6a0aa00e8999ad323ff23/src/lib/apis/gravity.ts#L14-L43

If you have worked with Gravity before, this code should be recogniseable. It takes the previously given partial path and makes a call to Gravity for this endpoint. This Gravity loader is then [matched](https://github.com/artsy/metaphysics/blob/79a387cd837d48485bf6a0aa00e8999ad323ff23/src/schema/v2/Match.ts#L33) with its specific type, the Artwork type. This shows GraphQL the structure and type all of the potential fields that can come back from the Gravity endpoint.

<!-- This should render the code inline -->

https://github.com/artsy/metaphysics/blob/79a387cd837d48485bf6a0aa00e8999ad323ff23/src/schema/v2/artwork/index.ts#L139

As can be seen in the Artwork type, there are a large number of fields. This matches with the [Artist model](https://github.com/artsy/gravity/blob/5f8c26cc19831c80300973a00c937844bfd6ece2/app/models/domain/artist.rb#L63) as there is a huge amount of information stored on an Artwork in the database. To focus on a specific field, let's look at the title field.

<!-- This should render the code inline -->

https://github.com/artsy/metaphysics/blob/79a387cd837d48485bf6a0aa00e8999ad323ff23/src/schema/v2/artwork/index.ts#L1227-L1230

As we can see here, there is a `resolve` method which maps the value from Gravity to Metaphysics, depending on whether there is an available title or not. This function can be altered to return something else, as can the type.

Using the title as an example, and by using the below GraphQL query, try to edit the type to be something other than what will be returned, e.g. `GraphQLInt`. You should get an error similar to `Int cannot represent non-integer value`. This is because GraphQL knows that the type of the `title` field should be a String, and when it tries to map the Gravity response to the Artwork type, it fails.

Another thing we can to update is the resolve method. If we change it to be `resolve: () => "No title",` then it will always return `"No title"` irrelevant of the data. This is very simplistic, but gives you an idea of how powerful this resolve function is and how we can use it to change (or not change) the return value of the Gravity response.

```graphql
query artwork($id: String!) {
  artwork(id: $id) {
    title
  }
}
```

```JSON
// Query Variables. These can be
{
	"id": "andy-warhol-georgia-okeeffe"
}
```

### Adding a POST request

<!-- TODO  -->

### Writing a mutation

<!-- TODO  -->

### Tips on writing and debugging locally

- You don't need to restart the server once you make changes. The updates get triggered automatically once you save your changes locally and re-run your query in GraphiQL (or whatever app you use). You should see some lines similar to these below, which shows that it has been updated

```
[@artsy/express-reloadable] File /Users/mitchellhenson/dev/metaphysics/src/schema/v2/partnerArtworksMutation.ts has changed.
[V1] [FEATURE] Enabling Schema Stitching
[V2] [FEATURE] Enabling Schema Stitching
```

- You should be able to see the request that you are making to the gravity REST endpoint in the GraphQL output. This can potentially help pinpoint errors, if it is related to the endpoint URL. This code below is taken from the bottom of a GraphQL request made locally.

```
"extensions": {
		"requests": {
			"gravity": {
				"requests": {
					"partner/5a0323e68b0c146d7634f081/artworks?artsy_shipping_domestic=true": {
						"time": "0s 495.276ms",
						"cache": false,
						"length": "0 B"
					}
				}
			}
		},
		"requestID": "72c50460-119f-11ed-9554-25745ca04f3b"
	}
```

- GraphQL is strongly typed and needs to know the exact inputs and outputs of the endpoint as it mediates between the clients and the REST endpoint. This allows GraphQL tools to know if the request you are making (in Insomnia, for example) is valid, even before you send the request, as it validates the structure against the schema. Similarly for the response, if the actual response from the endpoint does not match the expected structure of the response type from GraphQL, then it will throw an error as it attempts to map them and fails.
- You can always add some more console logs to any resolver to help see what is coming back from the REST endpoint, e.g.

```typescript
  outputFields: {
    partnerArtworksOrError: {
      type: UpdatePartnerArtworksMutationType,
      resolve: (result) => result,
    },
  },
```

can be changed to

```typescript
outputFields: {
    partnerArtworksOrError: {
      type: UpdatePartnerArtworksMutationType,
      resolve: (result) => {
        console.log(result)
        return result
      },
    },
  },
```

- Another way to debug (if you are using Visual Studio Code), is to follow [this article](https://github.com/artsy/metaphysics/blob/main/docs/debugging_with_vscode.md)

### Other links & resources

Should this article not provide you with all the information you need, there are plenty of other great resources that can give more information

- [What is a data loader?](https://github.com/artsy/metaphysics/blob/main/docs/dataloaders.md)
- [Success or Error Pattern Explained](https://artsy.github.io/blog/2018/10/19/where-art-thou-my-error/)
- [GraphQL Schema Design](https://github.com/artsy/README/blob/43c400d81ff9fee7276c3dd934de26b985da362f/playbooks/graphql-schema-design.md)
