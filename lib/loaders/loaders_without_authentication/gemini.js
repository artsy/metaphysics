// @ts-check

import factories from "../api"
import { unescape } from "querystring"

const toBase64 = string => new Buffer(unescape(encodeURIComponent(string)), "binary").toString("base64")

export default () => {
  const { geminiLoader } = factories()
  return {
    createNewGeminiAssetLoader: (name, acl) =>
      geminiLoader(`uploads/new.json?acl=${acl}`, {
        acl,
        headers: { Authorization: "Basic " + toBase64(name + ":") },
      }),
    createNewGeminiEntryAssetLoader: (template_key, source_key, source_bucket, metadata) =>
      geminiLoader("entries.json", {
        method: "POST",
        form: {
          entry: {
            template_key,
            source_key,
            source_bucket,
            metadata,
          },
        },
        headers: {
          Authorization: "Basic " + toBase64(template_key + ":"),
        },
      }),
  }
}
