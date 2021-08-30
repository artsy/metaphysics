import urljoin from "url-join"
import config from "config"
import { createRemoteExecutor } from "../lib/createRemoteExecutor"
import { responseLoggerMiddleware } from "../middleware/responseLoggerMiddleware"

const { KAWS_API_BASE } = config

export const createKawsExecutor = () => {
  return createRemoteExecutor(urljoin(KAWS_API_BASE, "graphql"), {
    middleware: [responseLoggerMiddleware("Kaws")],
  })
}
