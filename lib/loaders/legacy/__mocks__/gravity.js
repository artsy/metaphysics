const mockGravity = jest.fn(() => {
  throw new Error("loaders/legacy/gravity is throwing, as its implementation should be mocked.")
})

mockGravity.with = jest.fn(() => {
  throw new Error(
    "loaders/legacy/gravity#with is throwing, as its implementation should be mocked. " +
      "Note that this call expects a function (which is pass the auth token) " +
      "which returns a function that returns the response."
  )
})

mockGravity.all = jest.fn(() => {
  throw new Error("loaders/legacy/gravity#all is throwing, as its implementation should be mocked.")
})

export default mockGravity
