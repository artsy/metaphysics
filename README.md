# Metaphysics

Metaphysics is a [GraphQL](http://graphql.org)-compliant API that wraps various
Artsy APIs. You can [try it here](https://metaphysics-staging.artsy.net/)
against our staging API.

It is built on `express`, `express-graphql`, and `graphql`. With `graphiql`
providing a sandbox to work with.

It is currently used in production all over the place in
[Artsy.net](http://github.com/artsy/force/), and the
[Artsy iOS App](http://github.com/artsy/eigen)

## Meta [![CircleCI](https://circleci.com/gh/artsy/metaphysics.svg?style=svg)](https://circleci.com/gh/artsy/metaphysics) [![codecov](https://codecov.io/gh/artsy/metaphysics/branch/main/graph/badge.svg)](https://codecov.io/gh/artsy/metaphysics)

- **State:** production
- **CI/Deploys:** [CircleCi](https://circleci.com/gh/artsy/metaphysics); merged PRs to `artsy/metaphysics#main` are automatically deployed to staging; PRs from `staging` to `release` are automatically deployed to production. [Start a deploy...](https://github.com/artsy/metaphysics/compare/release...staging?expand=1)
- **Production:**
  - [Endpoint](https://metaphysics-production.artsy.net/v2)
  - [Kubernetes deployment dashboard](https://kubernetes.prd.artsy.systems/#!/deployment/default/metaphysics-web?namespace=default)
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
  - [Endpoint](https://metaphysics-staging.artsy.net/v2)
  - [Kubernetes deployment dashboard](https://kubernetes.stg.artsy.systems/#!/deployment/default/metaphysics-web?namespace=default)
  - [Datadog Monitoring - GraphQL Queries](https://app.datadoghq.com/apm/service/metaphysics.graphql-query/graphql.query?env=staging)
  - [Datadog Monitoring - GraphQL Resolver](https://app.datadoghq.com/apm/service/metaphysics.graphql-resolver/graphql.resolver?env=staging)
  - [Datadog Monitoring - Express](https://app.datadoghq.com/apm/service/metaphysics.request/express.request?env=staging)
  - [Datadog Monitoring - HTTP Client](https://app.datadoghq.com/apm/service/metaphysics.http-client/http.request?env=staging)
  - [Datadog Monitoring - Cache](https://app.datadoghq.com/apm/service/metaphysics.memcached/cache?env=staging)
  - [Sentry error reporting](https://sentry.io/artsynet/metaphysics-staging/)
  - [Papertrail logs](https://papertrailapp.com/groups/3674473/events?q=host%3Ametaphysics-web)
- **Point People:** [@mzikherman](https://github.com/mzikherman)

### Getting Setup

To get yourself set up with all the project's dependencies:

```sh
git clone https://github.com/artsy/metaphysics
cd metaphysics

# Run the setup script
./scripts/setup.sh
```

This will pull the environment variables from aws into .env.shared.
It will also overwrite .env with the values in .env.example. If you need to override any of these values
or add new .env values place them in the .env file.

### Development

With your dependencies set up, you can run Metaphysics by running:

```sh
yarn start
```

Which will start the server on http://localhost:3000

Be sure that memcached is no longer running before starting hokusai by running

```sh
brew services stop memcached
```

_Recommended:_ You can run the commands inside the terminal in VS Code, then the
debugger will be hooked up by default.

### Setting up your local GraphiQL

We recommend the [graphiql.app](https://github.com/skevy/graphiql-app) client
for testing queries locally.

You will need to set up headers with both:

- `x-access-token` - Open https://staging.artsy.net, sign in and evaluate `sd.CURRENT_USER.accessToken` in a dev console _(CMD+Shift+C in Chrome)_.
- `x-user-id` - As above, but `sd.CURRENT_USER.id`.

_If you're new to GraphQL, you can checkout [Artsy's GraphQL Workshop](https://github.com/artsy/graphql-workshop)._

For `GraphQL Endpoint`, set it to `http://localhost:3000/v2`.

**Note that `/v2` is the default** and `/v1` has been fully deprecated and removed.

### Introspection Setup

Getting docs for the schema on MP in your playground of choice (Postman, Insomnia, Altair, etc) is called introspection.

Introspection is available by default when developing.

Introspection on staging and production are for internal use only, so artsy devs can use it to make development for MP clients (eigen, force, etc) easier, but it is and should not be used by any of the clients or anyone else.

In order to set this up in your playground of choice (Postman, Insomnia, Altair, etc), you need to send the following header:

```
Authorization: Bearer <secret>
```

and replace `<secret>` with the value you get from hokusai using

```
hokusai staging env get INTROSPECT_TOKEN
hokusai production env get INTROSPECT_TOKEN
```

or the contents of `Metaphysics INTROSPECT_TOKEN` in 1Password.

### Sample Queries

Once you have the GraphiQL client running against your local service,
you can verify things are working by executing these queries:

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

- [Intro to GraphQL](https://github.com/artsy/graphql-workshop)
- [How we use DataLoaders](docs/dataloaders.md)
- [Adding a GraphQL micro-service to Metaphysics](docs/adding_a_new_graphql_microservice.md)
- [Adding a rest micro-service to Metaphysics](docs/adding_a_new_rest_microservice.md)
- [Debugging with VS Code](docs/debugging_with_vscode.md)
- [GraphQL Schema Design][]

[graphql schema design]: https://github.com/artsy/README/blob/main/playbooks/graphql-schema-design.md

### Docker and Kubernetes setup

This is deployed using Hokusai to manage Docker and Kubernetes. To replicate
this:

- Install [Docker for Mac](https://github.com/artsy/hokusai#requirements) and
  [Hokusai](https://github.com/artsy/hokusai#setup)

  ```sh
  $ brew tap caskroom/cask && brew cask install docker
  $ pip install hokusai
  ```

  If you are using your system Python distribution, you may need to run this as:

  ```sh
  $ sudo pip install hokusai --ignore-installed
  ```

- Configure Hokusai

  ```sh
  export AWS_ACCESS_KEY_ID={{ MY_AWS_ACCESS_KEY_ID }}
  export AWS_SECRET_ACCESS_KEY={{ MY_AWS_SECRET_ACCESS_KEY }}
  hokusai configure --kubectl-version {{ kubectl_version }} --s3-bucket {{ kubectl_config_s3_bucket }} --s3-key {{ kubectl_config_s3_key }}
  hokusai check
  ```

  Artsy staff should find follow the instructions in
  https://github.com/artsy/potential/blob/main/platform/Kubernetes.md#hokusai

- Start the server

  ```sh
  hokusai dev start
  ```

### Testing

- Run tests in the Docker Compose test stack via Hokusai:

  ```sh
  hokusai test
  ```

- Or, to run tests locally: `npm test` to run the entire suite `npm run watch`
  to spin up the test watcher

## About Artsy

<a href="https://www.artsy.net/">
  <img align="left" src="https://avatars2.githubusercontent.com/u/546231?s=200&v=4"/>
</a>

This project is the work of engineers at [Artsy][footer_website], the world's
leading and largest online art marketplace and platform for discovering art.
One of our core [Engineering Principles][footer_principles] is being [Open
Source by Default][footer_open] which means we strive to share as many details
of our work as possible.

You can learn more about this work from [our blog][footer_blog] and by following
[@ArtsyOpenSource][footer_twitter] or explore our public data by checking out
[our API][footer_api]. If you're interested in a career at Artsy, read through
our [job postings][footer_jobs]!

[footer_website]: https://www.artsy.net/
[footer_principles]: https://github.com/artsy/README/blob/main/culture/engineering-principles.md
[footer_open]: https://github.com/artsy/README/blob/main/culture/engineering-principles.md#open-source-by-default
[footer_blog]: https://artsy.github.io/
[footer_twitter]: https://twitter.com/ArtsyOpenSource
[footer_api]: https://developers.artsy.net/
[footer_jobs]: https://www.artsy.net/jobs
