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

* **State:** production
* **Production:**
  [Endpoint](https://metaphysics-production.artsy.net/)
  [Kubernetes deployment dashboard](https://kubernetes.artsy.net/#!/deployment/default/metaphysics-web?namespace=default)
  [DataDog monitoring dashboard](https://app.datadoghq.com/apm/service/metaphysics/metaphysics.query?env=production)
  [Sentry error reporting dashboard](https://sentry.io/artsynet/metaphysics-production/)
  [Papertrail logs dashboard](https://papertrailapp.com/groups/3675843/events?q=host%3Ametaphysics-web)
* **Staging:**
  [Endpoint](https://metaphysics-staging.artsy.net/)
  [Kubernetes deployment dashboard](https://kubernetes-staging.artsy.net/#!/deployment/default/metaphysics-web?namespace=default)
  [DataDog monitoring dashboard](https://app.datadoghq.com/apm/service/metaphysics/metaphysics.query?env=staging)
  [Sentry error reporting dashboard](https://sentry.io/artsynet/metaphysics-staging/)
  [Papertrail logs dashboard](https://papertrailapp.com/groups/3674473/events?q=host%3Ametaphysics-web)
* **Point People:** [@alloy](https://github.com/alloy) &
  [@mzikherman](https://github.com/mzikherman)

### Getting Setup

Read and run setup script:

```
$ cat bin/setup
$ bin/setup
```

Set up your `.env` file based on `.env.example`. For Artsy staff, grab the
keys/secrets from 1Password.

### Docker and Kubernetes setup

* Install [Docker for Mac](https://github.com/artsy/hokusai#requirements) and [Hokusai](https://github.com/artsy/hokusai#setup)
  ```
  $ brew tap caskroom/cask && brew cask install docker
  $ pip install hokusai
  ```

  If you are using your system Python distribution, you may need to run this as:
  ```
  $ sudo pip install hokusai --ignore-installed
  ```

* Configure Hokusai
  ```
  $ export AWS_ACCESS_KEY_ID={{ MY_AWS_ACCESS_KEY_ID }}
  $ export AWS_SECRET_ACCESS_KEY={{ MY_AWS_SECRET_ACCESS_KEY }}
  $ hokusai configure --kubectl-version {{ kubectl_version }} --s3-bucket {{ kubectl_config_s3_bucket }} --s3-key {{ kubectl_config_s3_key }}
  $ hokusai check
  ```

  Artsy staff should find follow the instructions in https://github.com/artsy/potential/blob/master/platform/Kubernetes.md#hokusai

### Development

To start up a development server, run:

```sh
yarn install
npm run dev
```

### Setting up your local GraphiQL

You will need to set up headers with both:

* `x-access-token` - Get your client ID and secret, use this command to generate
  a token.
* `x-user-id` - Go to the [users admin](https://admin-staging.artsy.net/users)
  and find your user account ID.

If you need to generate a token,
[this command](https://artsy.slack.com/archives/C02BC3HEJ/p1492126234025615)
will create one for you. Add it to your `.bash_rc.private` and update the values
between `<` and `>`.

    alias generate-access-token='curl "https://stagingapi.artsy.net/oauth2/access_token?client_id=><client id>&client_secret=<client secret>&grant_type=credentials&email=<your email>&password=<your password>&scope=offline_access"'

### Testing

* Run tests in the Docker Compose test stack via Hokusai:
  ```
  $ hokusai test
  ```

* Or, to run tests locally:
  `npm test` to run the entire suite `npm run watch` to spin up the test watcher

### Docs

* [How we use DataLoaders](docs/dataloaders.md)
* [Adding a microservice to Metaphysics](docs/adding_a_new_microservice.md)
* [Debugging with VS Code](docs/debugging_with_vscode.md)

### Deployment

PRs merged to the `master` branch are automatically deployed to staging. The release on staging can be promoted to production via the command `hokusai pipeline promote`.  See Hokusai's [docs on the Staging -> Production pipeline](https://github.com/artsy/hokusai/blob/master/docs/Command_Reference.md#working-with-the-staging---production-pipeline) for more details.

## Interacting with the staging and production deployments

Use `hokusai staging` [commands](https://github.com/artsy/hokusai/blob/master/docs/Command_Reference.md#working-with-the-kubernetes-staging-environment) to interact with the staging environment.

Use `hokusai production` [commands](https://github.com/artsy/hokusai/blob/master/docs/Command_Reference.md#working-with-the-kubernetes-production-environment) to interact with the production environment.
