const mockGravity = jest.fn(() => {
  throw new Error("loaders/legacy/gravity is throwing, as its implementation should be mocked.")
})

mockGravity.with = jest.fn(() => {
  throw new Error("loaders/legacy/gravity#with is throwing, as its implementation should be mocked.")
})

mockGravity.all = jest.fn(() => {
  throw new Error("loaders/legacy/gravity#all is throwing, as its implementation should be mocked.")
})

export default mockGravity
