[![Build Status](https://semaphoreci.com/api/v1/projects/accc4cab-8844-44d3-ba87-e2e73335592a/587408/badge.svg)](https://semaphoreci.com/artsy-it/metaphysics)

Metaphysics is a [GraphQL](http://graphql.org)-compliant API for the Artsy v1 API. You can [try it here](https://metaphysics-staging.artsy.net/) against our staging API.

It is built on `express`, `express-graphql`, and `graphql`. With `graphiql` providing a sandbox to work with.

It is currently used in production from the `/artists/` route on [artsy.net](https://artsy.net/artists). To see its usage, check out  [`force-public/apps/artists/routes.coffee`](https://github.com/artsy/force-public/blob/f60e582dd115bc794964e3db8e26a870c54e1bfd/apps/artists/routes.coffee#L6-L53).

### Meta

* __State:__ production
* __Production:__ [metaphysics-production.artsy.net](https://metaphysics-production.artsy.net/)
* __Staging:__ [metaphysics-staging.artsy.net](https://metaphysics-staging.artsy.net/)
* __CI:__ [Semaphore](https://semaphoreapp.com/artsy-it/metaphysics/)
* __Point People:__ [@dzucconi](https://github.com/dzucconi) & [@broskoski](https://github.com/broskoski)

### Getting Setup

Set up your `.env` file based on our example `.env.test` (the variables you must change for development are separated at the bottom).

Install memcached if you haven't:
```
brew install memcached
```

To start up a development server, clone this repo and run:

``` sh
npm install
npm run dev
```

### Testing

`npm test` to run the entire suite
`npm run spec test/your/path/to/file.js` to run a single spec

### Deployment

PRs merged to master are deployed to staging via Semaphore.

We then use the heroku [pipelines](https://blog.heroku.com/archives/2013/7/10/heroku-pipelines-beta) to deploy to production when happy with staging.

Add the staging instance as a git remote named `staging`

``` sh
git remote add staging https://git.heroku.com/artsy-metaphysics-staging.git
```

then promote using the command:

``` sh
heroku pipelines:promote -r staging
```
