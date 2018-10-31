# Metaphysics [![CircleCI](https://circleci.com/gh/artsy/metaphysics.svg?style=svg)](https://circleci.com/gh/artsy/metaphysics)

Metaphysics is a [GraphQL](http://graphql.org)-compliant API that wraps various
Artsy APIs. You can [try it here](https://metaphysics-staging.artsy.net/)
against our staging API.

It is built on `express`, `express-graphql`, and `graphql`. With `graphiql`
providing a sandbox to work with.

It is currently used in production all over the place in
[Artsy.net](http://github.com/artsy/force/), and the
[Artsy iOS App](http://github.com/artsy/eigen)

### Meta

- **State:** production
- **Production:**
  - [Endpoint](https://metaphysics-production.artsy.net/)
  - [Kubernetes deployment dashboard](https://kubernetes.artsy.net/#!/deployment/default/metaphysics-web?namespace=default)
  - [Datadog Monitoring - Overview](https://app.datadoghq.com/screen/302489/metaphysics-production)
  - [Datadog Monitoring - GraphQL Queries](https://app.datadoghq.com/apm/service/metaphysics.graphql-query/graphql.query?env=production)
  - [Datadog Monitoring - GraphQL Resolver](https://app.datadoghq.com/apm/service/metaphysics.graphql-resolver/graphql.resolver?env=production)
  - [Datadog Monitoring - Express](https://app.datadoghq.com/apm/service/metaphysics.request/express.request?env=production)
  - [Datadog Monitoring - HTTP Requests](https://app.datadoghq.com/apm/service/metaphysics.http-Requests/http.request?env=production)
  - [Datadog Monitoring - Cache](https://app.datadoghq.com/apm/service/metaphysics.memcached/cache?env=production)
  - [DataDog Monitoring - ELB](https://app.datadoghq.com/dash/816823/metaphysics-production-elb)
  - [DataDog Monitoring - NodeJS VM / Custom Metrics](https://app.datadoghq.com/dash/635153/metaphysics-queries)
  - [Sentry error reporting](https://sentry.io/artsynet/metaphysics-production/)
  - [Papertrail logs](https://papertrailapp.com/groups/3675843/events?q=host%3Ametaphysics-web)
  - [When Disaster Strikes](https://joe.artsy.net/job/refresh-metaphysics-production/)
- **Staging:**
  - [Endpoint](https://metaphysics-staging.artsy.net/)
  - [Kubernetes deployment dashboard](https://kubernetes-staging.artsy.net/#!/deployment/default/metaphysics-web?namespace=default)
  - [Datadog Monitoring - GraphQL Queries](https://app.datadoghq.com/apm/service/metaphysics.graphql-query/graphql.query?env=staging)
  - [Datadog Monitoring - GraphQL Resolver](https://app.datadoghq.com/apm/service/metaphysics.graphql-resolver/graphql.resolver?env=staging)
  - [Datadog Monitoring - Express](https://app.datadoghq.com/apm/service/metaphysics.request/express.request?env=staging)
  - [Datadog Monitoring - HTTP Client](https://app.datadoghq.com/apm/service/metaphysics.http-client/http.request?env=staging)
  - [Datadog Monitoring - Cache](https://app.datadoghq.com/apm/service/metaphysics.memcached/cache?env=staging)
  - [Sentry error reporting](https://sentry.io/artsynet/metaphysics-staging/)
  - [Papertrail logs](https://papertrailapp.com/groups/3674473/events?q=host%3Ametaphysics-web)
- **Point People:** [@alloy](https://github.com/alloy) &
  [@mzikherman](https://github.com/mzikherman)

### Getting Setup

To get yourself set up with all the project's dependencies:

```
git clone https://github.com/artsy/metaphysics
cd metaphysics

# Install node modules
yarn install
# Installed system tools (like cache servers)
brew bundle
# Get set up with a default env
cp .env.example .env
```

For Artsy staff wanting to expand on your `.env`, you can use `hokusai staging env get` to see staging's env vars.

### Development

With your dependencies set up, you can run Metaphysics by running:

```sh
yarn dev
```

Which will start the server on http://localhost:5001

_Recommended:_ You can run the commands inside the terminal in VS Code, then the
debugger will be hooked up by default.

### Setting up your local GraphiQL

We recommend the [graphiql.app](https://github.com/skevy/graphiql-app) client
for testing queries locally.

You will need to set up headers with both:

- `x-access-token` - Evaluate `sd.CURRENT_USER.accessToken` in a dev console on
  staging.artsy.net (sign in first, obvs).
- `x-user-id` - As above, but `sd.CURRENT_USER.id`.

### Sample Queries

Once you have the GraphiQL client running against your local service,
you can verify things are working by executing these queries:

#### Get popular artists

```
{
  popular_artists {
    artists {
      name
    }
  }
}
```

#### Get your account information

```
{
  me {
    name
    email
  }
}
```

If any of these queries fail, it's probable that you misconfigured your
`x-access-token` or `x-user-id` HTTP headers.

### Docs

- [How we use DataLoaders](docs/dataloaders.md)
- [Adding a microservice to Metaphysics](docs/adding_a_new_microservice.md)
- [Debugging with VS Code](docs/debugging_with_vscode.md)

### Docker and Kubernetes setup

This is deployed using Hokusai to manage Docker and Kubernetes. To replicate
this:

- Install [Docker for Mac](https://github.com/artsy/hokusai#requirements) and
  [Hokusai](https://github.com/artsy/hokusai#setup)

  ```
  $ brew tap caskroom/cask && brew cask install docker
  $ pip install hokusai
  ```

  If you are using your system Python distribution, you may need to run this as:

  ```
  $ sudo pip install hokusai --ignore-installed
  ```

- Configure Hokusai

  ```
  $ export AWS_ACCESS_KEY_ID={{ MY_AWS_ACCESS_KEY_ID }}
  $ export AWS_SECRET_ACCESS_KEY={{ MY_AWS_SECRET_ACCESS_KEY }}
  $ hokusai configure --kubectl-version {{ kubectl_version }} --s3-bucket {{ kubectl_config_s3_bucket }} --s3-key {{ kubectl_config_s3_key }}
  $ hokusai check
  ```

  Artsy staff should find follow the instructions in
  https://github.com/artsy/potential/blob/master/platform/Kubernetes.md#hokusai

### Testing

- Run tests in the Docker Compose test stack via Hokusai:

  ```
  $ hokusai test
  ```

- Or, to run tests locally: `npm test` to run the entire suite `npm run watch`
  to spin up the test watcher

### Deployment

PRs merged to the `master` branch are automatically deployed to staging. The
release on staging can be promoted to production via the command `hokusai pipeline promote --git-remote [upstream|origin]`. The `--git-remote` option pushes a meaningful tag name to the git remote, so use whichever git remote points to Artsy's repository and not a fork (run `git remote -v` to see your git remotes and URLs). (If you accidentally push the git tags to the incorrect remote, you can run `git push upstream production-tag-name` to push a single tag to Artsy's repo.)

See Hokusai's
[docs on the Staging -> Production pipeline](https://github.com/artsy/hokusai/blob/master/docs/Command_Reference.md#working-with-the-staging---production-pipeline)
for more details.

## Interacting with the staging and production deployments

Use `hokusai staging`
[commands](https://github.com/artsy/hokusai/blob/master/docs/Command_Reference.md#working-with-the-kubernetes-staging-environment)
to interact with the staging environment.

Use `hokusai production`
[commands](https://github.com/artsy/hokusai/blob/master/docs/Command_Reference.md#working-with-the-kubernetes-production-environment)
to interact with the production environment.

(To deploy, see [Deployment](#deployment) section above.)
