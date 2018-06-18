import StatsD from "hot-shots"
import appmetrics from "appmetrics"

import config from "config"
import { error } from "./loggers"

const {
  NODE_ENV,
  ENABLE_METRICS,
  STATSD_HOST,
  STATSD_PORT,
} = config

const isTest = NODE_ENV === "test"
const enableMetrics = ENABLE_METRICS === "true"

export const statsClient = new StatsD({
  host: STATSD_HOST,
  port: STATSD_PORT,
  globalTags: { service: 'metaphysics' },
  mock: isTest,
  errorHandler: function (err) {
    error(`Statsd client error ${err}`);
  }
})

if (enableMetrics && !isTest) {
  appmetrics.configure({
    mqtt: 'off'
  })
  const monitoring = appmetrics.monitor()

  monitoring.on('eventloop', (eventloopMetrics) => {
    console.log(eventloopMetrics)
    statsClient.timing('eventloop.latency.min', eventloopMetrics.latency.min)
    statsClient.timing('eventloop.latency.max', eventloopMetrics.latency.max)
    statsClient.timing('eventloop.latency.avg', eventloopMetrics.latency.avg)
  })
}
