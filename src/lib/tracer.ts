import config from "config"
import { verbose as debug, error } from "./loggers"
import tracer from "dd-trace"
import { Tags } from "opentracing"

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
  } as any)
  tracer.use("http", {
    service: `${DD_TRACER_SERVICE_NAME}.http-client`,
  })
}

const createCommand = (command: string) => <T>(
  promise: Promise<T>
): Promise<T> => {
  const parentScope = tracer.scopeManager().active()
  const span = tracer.startSpan("memcached", {
    childOf: parentScope && parentScope.span(),
    tags: {
      [Tags.SPAN_KIND]: Tags.SPAN_KIND_RPC_CLIENT,
      [Tags.DB_TYPE]: "memcached",
      "service.name": `${DD_TRACER_SERVICE_NAME}.memcached`,
      "resource.name": command,
      "span.type": "memcached",
    },
  })

  return promise.then(
    result => {
      span.finish()
      return result
    },
    err => {
      const tags = {
        "error.type": err.name,
        "error.msg": err.message,
      }
      if (!err.message.includes("Cache miss")) {
        tags["error.stack"] = err.stack
      }
      span.addTags(tags)
      span.finish()
      throw err
    }
  )
}

export function createCacheTracer() {
  return {
    get: createCommand("get"),
    set: createCommand("set"),
    delete: createCommand("delete"),
  }
}
