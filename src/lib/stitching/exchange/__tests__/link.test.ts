import { createExchangeLink } from "../link"

jest.mock("dd-trace", () => {
  return {
    scopeManager: () => ({
      active: () => ({
        span: () => ({
          context: () => ({
            spanId: "span123",
            traceId: "trace123",
          }),
        }),
      }),
    }),
  }
})

const runLinkChain = (link, op, complete) =>
  link.request(op).subscribe({ complete })

// FIXME: This seems to be hitting the actual network and thus fails without it.
xdescribe("exchange link", () => {
  it("passes request ID headers to the fetch", done => {
    expect.assertions(1)

    const link = createExchangeLink()
    const defaultContext = {
      graphqlContext: {
        res: {
          locals: {
            requestIDs: {
              requestID: "req123",
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

    runLinkChain(link, op, () => {
      expect(op.setContext).toBeCalledWith({
        headers: {
          "x-request-id": "req123",
          "x-datadog-parent-id": "span123",
          "x-datadog-trace-id": "trace123",
        },
      })
      done()
    })
  })

  describe("when authenticated", () => {
    it("also gravity auth HTTP headers to the fetch", done => {
      expect.assertions(1)

      // The difference here is that locals will now include a dataloader named exchangeTokenLoader
      // which would normally only show up in locals if you have an auth'd user
      const link = createExchangeLink()
      const defaultContext = {
        graphqlContext: {
          res: {
            locals: {
              requestIDs: {
                requestID: "req123",
              },
              dataLoaders: {
                exchangeTokenLoader: () =>
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
      runLinkChain(link, op, () => {
        expect(op.setContext).toBeCalledWith({
          headers: {
            Authorization: "Bearer token_123",
            "x-request-id": "req123",
            "x-datadog-parent-id": "span123",
            "x-datadog-trace-id": "trace123",
          },
        })
        done()
      })
    })
  })
})
