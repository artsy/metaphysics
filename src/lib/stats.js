import StatsD from "hot-shots"

import config from "config"
import { error } from "./loggers"

const {
  NODE_ENV,
  STATSD_HOST,
  STATSD_PORT,
} = config

const isTest = NODE_ENV === "test"

export const statsClient = new StatsD({
  host: STATSD_HOST,
  port: STATSD_PORT,
  globalTags: { service: 'metaphysics' },
  mock: isTest,
  errorHandler: function (err) {
    error(`Statsd client error ${err}`);
  }
})
