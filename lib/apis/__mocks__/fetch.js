export default jest.fn(() => {
  throw new Error("api/fetch is throwing, as its implementation should be mocked.")
})
