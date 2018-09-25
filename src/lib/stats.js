import os from "os"
import _ from "lodash"
import StatsD from "hot-shots"
import config from "config"
import { error } from "./loggers"

const {
  NODE_ENV,
  ENABLE_METRICS,
  STATSD_HOST,
  STATSD_PORT,
  DD_TRACER_SERVICE_NAME,
} = config

const isProd = NODE_ENV === "production"
const enableMetrics = ENABLE_METRICS === "true"
const appMetricsDisable = [
  "http",
  "http-outbound",
  "mongo",
  "socketio",
  "mqlight",
  "postgresql",
  "mqtt",
  "mysql",
  "redis",
  "riak",
  "memcached",
  "oracledb",
  "oracle",
  "strong-oracle",
]

export const statsClient = new StatsD({
  host: STATSD_HOST,
  port: STATSD_PORT,
  globalTags: { service: DD_TRACER_SERVICE_NAME, pod_name: os.hostname() },
  mock: !isProd,
  errorHandler: function(err) {
    error(`Statsd client error ${err}`)
  },
})

if (enableMetrics && isProd) {
  const appmetrics = require("appmetrics")
  appmetrics.configure({
    mqtt: "off",
  })
  const monitoring = appmetrics.monitor()
  _.forEach(appMetricsDisable, (val, idx) => {
    appmetrics.disable(val)
  })

  monitoring.on("loop", loopMetrics => {
    statsClient.timing("loop.count_per_five_seconds", loopMetrics.count)
    statsClient.timing("loop.minimum_loop_duration", loopMetrics.minimum)
    statsClient.timing("loop.maximum_loop_duration", loopMetrics.maximum)
    statsClient.timing("loop.cpu_usage_in_userland", loopMetrics.cpu_user)
    statsClient.timing("loop.cpu_usage_in_system", loopMetrics.cpu_system)
  })

  monitoring.on("eventloop", eventloopMetrics => {
    statsClient.timing("eventloop.latency.min", eventloopMetrics.latency.min)
    statsClient.timing("eventloop.latency.max", eventloopMetrics.latency.max)
    statsClient.timing("eventloop.latency.avg", eventloopMetrics.latency.avg)
  })

  monitoring.on("memory", memoryMetrics => {
    statsClient.gauge("memory.physical", memoryMetrics.physical)
    statsClient.gauge("memory.virtual", memoryMetrics.virtual)
  })

  monitoring.on("gc", gcMetrics => {
    statsClient.gauge("gc.heap_size", gcMetrics.size)
    statsClient.gauge("gc.heap_used", gcMetrics.used)
    statsClient.timing("gc.sweep_duration", gcMetrics.duration, {
      sweep_type: gcMetrics.type,
    })
  })

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
