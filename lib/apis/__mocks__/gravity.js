export default jest.fn(() => {
  throw new Error("api/gravity is throwing, as its implementation should be mocked.")
})
