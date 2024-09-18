Metaphysics can be queried through its CDN endpoint, `metaphysics-[staging|production]-alt.artsy.net`.

That endpoint routes through [Cloudflare edge locations](https://www.cloudflare.com/network/) to [a worker](../workers/caching/) with access to a geographically-distributed cache. Upon cache misses, those requests fall through to the live Metaphysics application at `metaphysics-[staging|production].artsy.net`.

## Caching behaviors

Queries that include any `X-Access-Token` header or a `Cache-Control` header containing `no-cache` will _not_ read from or write to the CDN cache. Instead, they will fall through to the Metaphysics back-end. All other queries _will_ be cached for a default of 1h (`max-age=3600`), configurable in each worker's environment variables.

Requests may specify a custom `Cache-Control: max-age=*` lower or higher than the default. The worker will respect the provided expiration, responding with data up to that expiration in age, and writing results to the cache for up to that interval.

As opposed to a typical CDN, Metaphysics' CDN endpoint will cache responses to POST requests, and do so based on the entire request body (including `query`, `documentID`, and `variables`).

## `@cacheable` directive

As a convenience for clients, Metaphysics' schema declares support for a custom `@cacheable` directive on queries. This directive _has no impact_ on how Metaphysics responds to a query, but clients may use middleware to set request headers based on its presence. For example, by withholding the `X-Access-Token` header on such requests, [Force enables](https://github.com/artsy/force/blob/main/src/System/Relay/createRelaySSREnvironment.ts) certain non-personalized queries to leverage the cache.

## Examples

A cacheable query without a match in the edge-cache (i.e., cache miss):

```bash
curl -vvv -H "Content-Type: application/json" -d '{"query":"{ artist(id: \"andy-warhol\") { slug } }"}' https://metaphysics-staging-alt.artsy.net/v2
...
< cf-cache-status: DYNAMIC
< cache-control: max-age=3600
...
{"data":{"artist":{"slug":"andy-warhol"}}...
```

The same query _with_ a match (i.e., cache hit):

```bash
...
< cf-cache-status: HIT
< age: 1201
< cache-control: max-age=3600
...
```

Queries that specify a custom cache expiration may similarly hit or miss, but respect the provided expiration:

```bash
curl -vvv -H "Content-Type: application/json" -H "Cache-Control: max-age=60" -d '{"query":"{ artist(id: \"andy-warhol\") { slug } }"}' https://metaphysics-staging-alt.artsy.net/v2
...
< cf-cache-status: HIT
< age: 18
< cache-control: max-age=60
...
```

Queries with `X-Access-Token` or `Cache-Control: no-cache` headers will never be HITs:

```bash
curl -vvv -H "Content-Type: application/json" -H "Cache-Control: no-cache" -d '{"query":"{ artist(id: \"andy-warhol\") { slug } }"}' https://metaphysics-staging-alt.artsy.net/v2
...
< cf-cache-status: DYNAMIC
...
curl -vvv -H "Content-Type: application/json" -H "X-Access-Token: redacted" -d '{"query":"{ artist(id: \"andy-warhol\") { slug } }"}' https://metaphysics-staging-alt.artsy.net/v2
...
< cf-cache-status: DYNAMIC
...
```
