describe("GeneFamily", () => {
  describe("A basic test", () => {
    it("returns foo", () => {
      const query = `
        {
          gene_family {
            foo
          }
        }
      `

      return runQuery(query).then(({ gene_family: { foo } }) => {
        expect(foo).toEqual("foo")
      })
    })
  })
})
