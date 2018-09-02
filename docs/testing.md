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

### Integration Tests

There are two main sources for integration/functional tests:

- [`src/__tests__/integration.test.ts`](/src/__tests__/integration.test.ts) launches the entire GraphQL server and makes a single dummy query. This is done to verify the entire schema works correctly. It runs in a normal jest run.

- [`src/__tests__/runStoredQueryTests.ts`](/src/__tests__/runStoredQueryTests.ts) uses most of our stored queries to verify that no errors occurs in the query. This is a script, you can run it via `test:validQueries`.
