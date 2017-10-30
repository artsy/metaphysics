# Metaphysics [![CircleCI](https://circleci.com/gh/artsy/metaphysics.svg?style=svg)](https://circleci.com/gh/artsy/metaphysics)

Metaphysics is a [GraphQL](http://graphql.org)-compliant API that wraps various Artsy APIs. You can [try it here](https://metaphysics-staging.artsy.net/) against our staging API.

It is built on `express`, `express-graphql`, and `graphql`. With `graphiql` providing a sandbox to work with.

It is currently used in production all over the place in [Artsy.net](http://github.com/artsy/force/), and the [Artsy iOS App](http://github.com/artsy/eigen)

### Meta

-   **State:** production
-   **Production:** [metaphysics-production.artsy.net](https://metaphysics-production.artsy.net/)
-   **Staging:** [metaphysics-staging.artsy.net](https://metaphysics-staging.artsy.net/)
-   **Point People:** [@alloy](https://github.com/alloy) & [@mzikherman](https://github.com/mzikherman)

### Getting Setup

Read and run setup script:

```
$ cat bin/setup
$ bin/setup
```

Set up your `.env` file based on our example `.env.test` (the variables you must change for development are separated at the bottom). For Artsy staff, grab the config from 1Password.

To start up a development server, clone this repo and run:

```sh
yarn install
npm run dev
```

### Setting up your local GraphiQL

You will need to set up headers with both:

-   `x-access-token` - Get your client ID and secret, use this command to generate a token.
-   `x-user-id` - Go to the [users admin](https://admin-staging.artsy.net/users) and find your user account ID.

If you need to generate a token, [this command](https://artsy.slack.com/archives/C02BC3HEJ/p1492126234025615) will create one for you. Add it to your `.bash_rc.private` and update the values between `<` and `>`.

    alias generate-access-token='curl "https://stagingapi.artsy.net/oauth2/access_token?client_id=><client id>&client_secret=<client secret>&grant_type=credentials&email=<your email>&password=<your password>&scope=offline_access"'

### Testing

`npm test` to run the entire suite
`npm run watch` to spin up the test watcher

### Docs

- [How we use DataLoaders](docs/dataloaders.md)
- [Adding a microservice to Metaphysics](docs/adding_a_new_microservice.md)
- [Debugging with VS Code](docs/debugging_with_vscode.md)


### Deployment

PRs merged to master are deployed to staging via Circle.

We then use the heroku [pipelines](https://blog.heroku.com/archives/2013/7/10/heroku-pipelines-beta) to deploy to production when happy with staging.

Add the staging instance as a git remote named `staging`:

```sh
git remote add staging git@heroku.com:artsy-metaphysics-staging.git
```

Then promote using the command:

```sh
$ heroku pipelines:promote -r staging
```
