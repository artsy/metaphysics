## Adding a gravity endpoint into Metaphysics

This doc is aimed at helping backend devs or beginner front end devs on how to add an existing gravity endpoint into Metaphysics.

This article assumes that you already have your local machine setup and have your graphiql.app or other app (Postman, Insomnia etc) setup. If you need help with that, you can start [here](https://github.com/artsy/metaphysics#setting-up-your-local-graphiql)

### Steps to add an existing endpoint

1. Find an existing PR or commit which adds something similar to what you want. If you are looking for a PUT endpoint, then [this](https://github.com/artsy/metaphysics/pull/3918) is a great example.
1. Follow the structure of the PR to add your own endpoint and input/outputs. Some further tips can be found below.
1. After the code has been written, you can start your local Metaphysics server with `yarn start`. This will generate the new schema files from the new changes and will continue to do so whilst the process is running. Should you have any issues with the schema generation, you can always run `yarn dump:local` in the Metaphysics directory which manually generates the schema changes. This script (and other useful scripts) can be found in the `package.json` file.
1. With your favourite graphql app, you should be able to hit the local Metaphysics server to refresh the schema. In insomnia, you can click on the "schema" button in the GraphQL panel to manually refresh this, if you don't have auto-refresh turned on (also found in this list). Sidenote: During development Metaphysics should be pointed at Gravity staging (unless otherwise configured in `.env.shared`)
1. Work through the errors, making sure to read the message in its entirety. Also don't hesitate to add it to the errors section below if useful.

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

- GraphQL is strongly typed and needs to know the exact inputs and outputs of the endpoint as it mediates between the clients and the REST endpoint. This is why you need to set up a union type which instructs GraphQL on what both responses will look like. This allows GraphQL tools to know if the request you are making (in Insomnia, for example) is valid, even before you send the request.
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

### Potential Errors

This below error points to the fact that the `UpdatePartnerArtworksMutationType` was not resolving for either the `SuccessType` or the `FailureType`. GraphQL is very strict and it needs to categorize everything into types and fails when it can't. The solution to this was to ensure that the `SuccessType` was correctly defined. This means that the `isTypeOf` check needs to look for a success criteria in the response. In this scenario, it was incorrect and needed to be updated to `isTypeOf: (data) => data.success`.

```json
"message": "Abstract type UpdatePartnerArtworksMutationType must resolve to an Object type at runtime for field UpdatePartnerArtworksMutationPayload.partnerArtworksRequestOrError with value { success: 0, errors: { count: 4, ids: [Array] }, clientMutationId: undefined }, received \"undefined\". Either the UpdatePartnerArtworksMutationType type should provide a \"resolveType\" function or each possible type should provide an \"isTypeOf\" function.",
```
