import { geminiLoaderWithAuthenticationFactory } from "../api"
import btoa from "btoa"

export default () => {
  let convectionTokenLoader
  const convectionAccessTokenLoader = () => convectionTokenLoader()
  const geminiLoader = geminiLoaderWithAuthenticationFactory(convectionAccessTokenLoader)

  // This generates a token with a lifetime of 1 minute, which should be plenty of time to fulfill a full query.
  convectionTokenLoader = name => {
    console.log("OK?")
    debugger
    return Promise.resolve({ Authorization: "Basic: " + btoa(unescape(encodeURIComponent(name + ":"))) })

    // return Promise.resolve(btoa(unescape(encodeURIComponent(name + ":"))))
  }

  return {
    createImageUploadLoader: geminiLoader(
      () => {
        debugger
        return `uploads/new.json`
      },
      { method: "GET" }
    ),
    // submissionCreateLoader: convectionLoader(`submissions`, {}, { method: "POST" }),
    // submissionUpdateLoader: convectionLoader(id => `submissions/${id}`, {}, { method: "PUT" }),
  }
}
