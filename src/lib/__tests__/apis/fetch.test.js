it("passes", () => {
  // Hi
})

// it("tries to parse the response when there is a String and resolves with it", () => {
//   const request = sinon.stub().yields(null, {
//     statusCode: 200,
//     body: JSON.stringify({ foo: "bar" }),
//   })
//   fetch.__Rewire__("request", request)

//   return gravity("foo/bar").then(({ body: { foo } }) => {
//     expect(foo).toBe("bar")
//   })
// })

// it("rejects request errors", () => {
//   const request = sinon.stub().yields(new Error("bad"))
//   fetch.__Rewire__("request", request)

//   return expectPromiseRejectionToMatch(gravity("foo/bar"), /bad/)
// })

// it("rejects API errors", () => {
//   const request = sinon
//     .stub()
//     .yields(null, { statusCode: 401, body: "Unauthorized" })
//   fetch.__Rewire__("request", request)

//   return expectPromiseRejectionToMatch(gravity("foo/bar"), /Unauthorized/)
// })

// it("rejects parse errors", () => {
//   const request = sinon
//     .stub()
//     .yields(null, { statusCode: 200, body: "not json" })
//   fetch.__Rewire__("request", request)

//   return expectPromiseRejectionToMatch(
//     gravity("foo/bar"),
//     /Unexpected token/
//   )
// })
