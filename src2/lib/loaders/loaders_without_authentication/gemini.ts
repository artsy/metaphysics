import gemini from "../../apis/gemini"
import { unescape } from "querystring"

import { uncachedLoaderFactory } from "../api/loader_without_cache_factory"

const toBase64 = (string) =>
  Buffer.from(unescape(encodeURIComponent(string)), "binary").toString("base64")
const geminiUncachedLoader = uncachedLoaderFactory(gemini, "gemini")

export default () => ({
  // The outer function is so that we can pass params from the schema,
  // into the gemini api options.
  createNewGeminiAssetLoader: ({ name, acl }) =>
    geminiUncachedLoader("uploads/new.json", {
      acl,
      headers: {
        Authorization: "Basic " + toBase64(name + ":"),
      },
    }),

  createNewGeminiEntryAssetLoader: ({
    template_key,
    source_key,
    source_bucket,
    metadata,
  }) =>
    geminiUncachedLoader("entries.json", {
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
})
