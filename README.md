[![Build Status](https://semaphoreci.com/api/v1/projects/accc4cab-8844-44d3-ba87-e2e73335592a/587408/badge.svg)](https://semaphoreci.com/artsy-it/metaphysics)

Metaphysics is a [GraphQL](http://graphql.org)-compliant API for the Artsy v1 API. You can [try it here](https://metaphysics-staging.artsy.net/) against our staging API.

It is built on `express`, `express-graphql`, and `graphql`. With `graphiql` providing a sandbox to work with.

It is currently used in production all over the place in [Artsy.net](http://github.com/artsy/force/), and the [Artsy iOS App](http://github.com/artsy/eigen)

### Meta

* __State:__ production
* __Production:__ [metaphysics-production.artsy.net](https://metaphysics-production.artsy.net/)
* __Staging:__ [metaphysics-staging.artsy.net](https://metaphysics-staging.artsy.net/)
* __CI:__ [Semaphore](https://semaphoreapp.com/artsy-it/metaphysics/)
* __Point People:__ [@alloy](https://github.com/alloy) & [@mzikherman](https://github.com/mzikherman)

### Getting Setup

Set up your `.env` file based on our example `.env.test` (the variables you must change for development are separated at the bottom).

Install memcached and Yarn if you don't already have them:
``` sh
brew install memcached
npm install -g yarn
```

To start up a development server, clone this repo and run:

``` sh
yarn install
npm run dev
```

If you are using VS Code, you can read [debugging with VS Code](docs/debugging_with_vscode.md) to get inline debugging.

### Testing

`npm test` to run the entire suite
`npm run watch` to spin up the test watcher

### Deployment

PRs merged to master are deployed to staging via Semaphore.

We then use the heroku [pipelines](https://blog.heroku.com/archives/2013/7/10/heroku-pipelines-beta) to deploy to production when happy with staging.

Add the staging instance as a git remote named `staging`, then promote using the command:

``` sh
$ heroku pipelines:promote -r staging
```
