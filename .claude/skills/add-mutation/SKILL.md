---
name: add-mutation
description: Template and checklist for adding a GraphQL mutation to Metaphysics v2 that calls an upstream REST service (usually Gravity), including the Success/Failure union, error handling, loader, registration and tests.
---

# Add a mutation

`docs/` has no guide for mutations, so the code is the source of truth. Reference implementation: `src/schema/v2/me/requestEmailBackfillMutation.ts` and its test in `src/schema/v2/me/__tests__/requestEmailBackfillMutation.test.ts`. Open both before you start. If they differ from the template below, follow the files and update this skill in the same PR.

For the steps that do have docs, read them first and treat them as the source of truth:

- Loaders: [docs/dataloaders.md](../../../docs/dataloaders.md)
- A new upstream service: [docs/adding_a_new_rest_microservice.md](../../../docs/adding_a_new_rest_microservice.md)
- Tests: [docs/testing.md](../../../docs/testing.md)
- Schema dump: [docs/automated-schema-updates.md](../../../docs/automated-schema-updates.md)

## 1. Loader

Add a write loader to `src/lib/loaders/loaders_with_authentication/<service>.ts`, keeping the object alphabetical:

```ts
updateThingLoader: gravityLoader(
  (id) => `thing/${id}`,
  {},
  { method: "PUT" }
),
```

Call it with `(id, body)`. Write loaders are always authenticated, so they are `undefined` for signed-out requests.

## 2. Mutation file

Name it `<verb><Thing>Mutation.ts` next to the type it changes. Names follow the mutation name:

- Types: `<Name>Success`, `<Name>Failure`, `<Name>ResponseOrError`
- Output field: named after what it returns (`thingOrError`), never `responseOrError`

```ts
const SuccessType = new GraphQLObjectType<any, ResolverContext>({
  name: "UpdateThingSuccess",
  isTypeOf: (data) => data._type !== "GravityMutationError",
  fields: () => ({
    thing: { type: ThingType, resolve: (result) => result },
  }),
})

const FailureType = new GraphQLObjectType<any, ResolverContext>({
  name: "UpdateThingFailure",
  isTypeOf: (data) => data._type === "GravityMutationError",
  fields: () => ({
    mutationError: { type: GravityMutationErrorType, resolve: (err) => err },
  }),
})

const ResponseOrErrorType = new GraphQLUnionType({
  name: "UpdateThingResponseOrError",
  types: [SuccessType, FailureType],
  resolveType: (data) =>
    data._type === "GravityMutationError"
      ? "UpdateThingFailure"
      : "UpdateThingSuccess",
})

export const updateThingMutation = mutationWithClientMutationId<
  Input,
  any,
  ResolverContext
>({
  name: "UpdateThing",
  description: "…",
  inputFields: {
    id: { type: new GraphQLNonNull(GraphQLString), description: "…" },
    // camelCase inputs; map to snake_case in the loader body
  },
  outputFields: {
    thingOrError: {
      type: ResponseOrErrorType,
      resolve: (result) => result,
    },
  },
  mutateAndGetPayload: async ({ id, ...input }, { updateThingLoader }) => {
    if (!updateThingLoader) {
      throw new Error("You need to be signed in to perform this action")
    }

    try {
      return await updateThingLoader(id, { some_field: input.someField })
    } catch (error) {
      const formattedErr = formatGravityError(error)
      if (formattedErr) {
        return { ...formattedErr, _type: "GravityMutationError" }
      }
      throw new Error(error)
    }
  },
})
```

Rules:

- Give every input field and the mutation a `description`. Keep input fields alphabetical.
- Only send keys the caller provided on update mutations, so a missing input doesn't null out a field upstream.
- Return upstream 4xx errors through the Failure branch (`formatGravityError`), and throw anything else.
- Return the changed object, not a boolean, so clients can update their cache.

## 3. Register

Import the mutation in `src/schema/v2/schema.ts` and add it to the mutation fields. Keep both lists alphabetical, even where the surrounding entries aren’t.

## 4. Tests

Put tests in `__tests__/<name>Mutation.test.ts` and use the helpers from `docs/testing.md`. Cover three cases:

1. **Success:** assert the loader was called with the right ID and snake_case body, and check the `… on <Name>Success` result.
2. **Upstream failure:** reject with `new HTTPError("http://artsy.net - {}", 4xx, { type: "error", message: "…", detail: {} })` and check `mutationError.message` on the Failure branch.
3. **Signed out:** `runQuery(mutation, {})` rejects with “You need to be signed in to perform this action”.

## 5. Finish

1. Run `yarn dump:local` and commit `_schemaV2.graphql`.
2. Run `yarn jest <test file>`, `yarn type-check` and `yarn lint`.
3. Run the `live-check` skill on a throwaway record: the happy path, one deliberate failure, then clean up the record.
