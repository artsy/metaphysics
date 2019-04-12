import config from "config"
import { verbose as debug, error } from "./loggers"
import tracer from "dd-trace"

const { DD_TRACER_SERVICE_NAME, DD_TRACER_HOSTNAME, PRODUCTION_ENV } = config

export function init() {
  tracer.init({
    service: DD_TRACER_SERVICE_NAME,
    hostname: DD_TRACER_HOSTNAME,
    plugins: false,
    logger: { debug, error },
    debug: !PRODUCTION_ENV,
  })

  tracer.use("express", {
    // We want the root spans of MP to be labelled as just `metaphysics`
    service: DD_TRACER_SERVICE_NAME,
    headers: ["User-Agent", "X-User-ID"],
  })

  tracer.use("graphql", {
    service: `${DD_TRACER_SERVICE_NAME}.graphql`,
    /**
     * NOTE: This means we capture _all_ variables. When/if needed, we can
     *       use this callback to redact sensitive variables.
     */
    variables: variables => variables,
  })

  tracer.use("http", {
    service: `${DD_TRACER_SERVICE_NAME}.http-client`,
  })

  tracer.use("memcached", {
    service: `${DD_TRACER_SERVICE_NAME}.memcached`,
  })
}
