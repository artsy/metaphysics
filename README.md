[![Build Status](https://semaphoreci.com/api/v1/projects/accc4cab-8844-44d3-ba87-e2e73335592a/589351/badge.svg)](https://semaphoreapp.com/artsy-it/metaphysics)

Metaphysics is a [GraphQL](http://graphql.org)-compliant API for the Artsy v1 API. You can [try it here](http://metaphysics-staging.artsy.net/) against our staging API.

It is built on `express`, `express-graphql`, and `graphql`. With `graphiql` providing a sandbox to work with.

It is currently used in production from the `/artists/` route on [artsy.net](https://artsy.net/artists). To see it's usage, check out  [`force-public/apps/artists/routes.coffee`](https://github.com/artsy/force-public/tree/f60e582dd115bc794964e3db8e26a870c54e1bfd/apps/artists).

### Meta

* __State:__ production
* __Production:__ [metaphysics-production.artsy.net](https://metaphysics-production.artsy.net)
* __Staging:__ [artsy-metaphysics-staging.herokuapp.com/](http://metaphysics-staging.artsy.net/)
* __CI:__ [Semaphore](https://semaphoreapp.com/artsy-it/metaphysics/)
* __Point People:__ [@dzucconi](https://github.com/dzucconi) & [@broskoski](https://github.com/broskoski)

### Getting Setup

To start up a development server, clone this repo and run:

``` sh
npm install
npm run dev
```

after setting up your `.env` file based on our example `.env.test`.

### Deployment

PRs merged to master are deployed to staging via Semaphore.

We then use the heroku [pipelines](https://blog.heroku.com/archives/2013/7/10/heroku-pipelines-beta) to deploy to production when happy with staging.
