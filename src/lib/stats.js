import os from "os"
import StatsD from "hot-shots"
import config from "config"
import { error } from "./loggers"

export function createStatsClient() {
  const {
    NODE_ENV,
    ENABLE_METRICS,
    STATSD_HOST,
    STATSD_PORT,
    DD_TRACER_SERVICE_NAME,
  } = config

  const isProd = NODE_ENV === "production"
  const enableMetrics = ENABLE_METRICS === "true"

  const statsClient = new StatsD({
    host: STATSD_HOST,
    port: STATSD_PORT,
    globalTags: { service: DD_TRACER_SERVICE_NAME, pod_name: os.hostname() },
    mock: !isProd,
    errorHandler: function (err) {
      error(`Statsd client error ${err}`)
    },
  })

  if (enableMetrics && isProd) {
    setInterval(() => {
      statsClient.gauge(
        "process.active_handles",
        process._getActiveHandles().length
      )
      statsClient.gauge(
        "process.active_requests",
        process._getActiveRequests().length
      )
    }, 5000)
  }

  return statsClient
}
