const infoForDebugging = (url, params) => `

URL: ${url}
Params: ${JSON.stringify(params, null, "  ")}

If you'd like to try running with a debugger to understand what's going on:

> open Chrome, and load up chrome://inspect/ and click on "dedicated dev tools"

Rerun jest with the debugger attached:

>  node --inspect node_modules/.bin/jest --watch --bail --runInBand
`
const isDebug = typeof v8debug === "object" || /--debug|--inspect/.test(process.execArgv.join(" "))

const mockGravity = jest.fn((url, params) => {
  if (isDebug) {
    debugger // eslint-disable-line no-debugger
  } else {
    throw new Error(
      "loaders/legacy/gravity is throwing, as its implementation should be mocked." + infoForDebugging(url, params)
    )
  }
})

mockGravity.with = jest.fn((url, params) => {
  if (isDebug) {
    debugger // eslint-disable-line no-debugger
  } else {
    throw new Error(
      "loaders/legacy/gravity#with is throwing, as its implementation should be mocked. " +
        "Note that this call expects a function (which is pass the auth token) " +
        "which returns a function that returns the response." +
        infoForDebugging(url, params)
    )
  }
})

mockGravity.all = jest.fn(() => {
  throw new Error("loaders/legacy/gravity#all is throwing, as its implementation should be mocked.")
})

export default mockGravity
