There are two main types of tests in metaphysics:

### Unit Tests

These typically are your usual jest tests, they tend to look like this:

```js
it("returns false if user is not found by email", async () => {
  const query = gql`
    {
      user(email: "nonexistentuser@bar.com") {
        userAlreadyExists
      }
    }
  `
  // [setup the test]
  const { user } = await runAuthenticatedQuery(query, { userByEmailLoader })
  expect(user.userAlreadyExists).toEqual(false)
})
```

We want a lot of these. They're simple to write, and time-cheap. You can run
`yarn jest --watch` to have these running as you work.

#### Running queries in tests

Query helpers live in [`src/schema/v2/test/utils.ts`](/src/schema/v2/test/utils.ts).
Both resolve with the response `data` on success and reject with the error on failure.

- **`runQuery(query, context?, variableValues?)`** — unauthenticated request. Pass
  the loaders and context the resolver needs.

- **`runAuthenticatedQuery(query, context?)`** — same, but logged in
  (`userID: "user-42"`) and mocks all authenticated loaders, so you only pass the
  ones you care about. Use it for anything under `me { … }`.

Pass GraphQL variables via the third argument:

```js
await runQuery(query, context, { id: "andy-warhol" })
```

#### Asserting on behavior

Mock loaders with `jest.fn()` and check how they were called, not just what came back:

```js
const followedShowsLoader = jest.fn(() =>
  Promise.resolve({ body: [], headers: {} })
)

await runAuthenticatedQuery(query, { followedShowsLoader })

expect(followedShowsLoader).toHaveBeenCalledWith({
  size: 10,
  offset: 0,
  total_count: true,
  user_id: "user-42",
})
```

For error cases, assert on the rejected promise:

```js
await expect(
  runAuthenticatedQuery(query, { followedShowsLoader })
).rejects.toMatchInlineSnapshot(`[GraphQLError: Cannot find valid city]`)
```

### Integration Tests

There are two main sources for integration/functional tests:

- [`src/integration/__tests__/integration.test.ts`](/src/integration/__tests__/integration.test.ts) launches the entire GraphQL server and makes a single dummy query. This is done to verify the entire schema works correctly. It runs in a normal jest run.

- [`src/integration/__tests__/runStoredQueryTests.ts`](/src/integration/__tests__/runStoredQueryTests.ts) uses most of our stored queries to verify that no errors occurs in the query. This is a script, you can run it via `test:validQueries`.
