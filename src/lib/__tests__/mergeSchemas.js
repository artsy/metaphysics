import { createConvectionLink } from "lib/mergeSchemas"

const runLinkChain = (link, op, complete) =>
  link.request(op).subscribe({ complete })

// FIXME: This seems to be hitting the actual network and thus fails without it.
describe("convection link", () => {
  it("passes request ID headers to the fetch", () => {
    expect.assertions(1)

    const link = createConvectionLink()
    const defaultContext = {
      graphqlContext: {
        res: {
          locals: {
            requestIDs: {
              requestID: "req123",
              traceId: "trace123",
              parentSpanId: "span123",
            },
            dataLoaders: {},
          },
        },
      },
    }

    const op = {
      setContext: jest.fn(),
      getContext: () => defaultContext,
    }
    // As the link is an observable chain, we need to wrap it in a promise so that Jest can wait for it to resolve
    return new Promise(done => {
      runLinkChain(link, op, () => {
        expect(op.setContext).toBeCalledWith({
          headers: {
            "X-Request-Id": "req123",
            "x-datadog-parent-id": "span123",
            "x-datadog-trace-id": "trace123",
          },
        })

        done()
      })
    })
  })

  describe("when authenticated", () => {
    it("also gravity auth HTTP headers to the fetch", () => {
      expect.assertions(1)

      // The difference here is that locals will now include a dataloader named convectionTokenLoader
      // which would normally only show up in locals if you have an auth'd user
      const link = createConvectionLink()
      const defaultContext = {
        graphqlContext: {
          res: {
            locals: {
              requestIDs: {
                requestID: "req123",
                traceId: "trace123",
                parentSpanId: "span123",
              },
              dataLoaders: {
                convectionTokenLoader: () =>
                  Promise.resolve({ token: "token_123" }),
              },
            },
          },
        },
      }

      const op = {
        setContext: jest.fn(),
        getContext: () => defaultContext,
      }
      // As the link is an observable chain, we need to wrap it in a promise so that Jest can wait for it to resolve
      return new Promise(done => {
        runLinkChain(link, op, () => {
          expect(op.setContext).toBeCalledWith({
            headers: {
              "X-Request-Id": "req123",
              Authorization: "Bearer token_123",
              "x-datadog-parent-id": "span123",
              "x-datadog-trace-id": "trace123",
            },
          })

          done()
        })
      })
    })
  })
})
