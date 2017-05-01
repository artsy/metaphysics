const gravityData = {
  id: "saved-artwork",
  name: "Saved Artwork",
  default: true,
  description: "",
  image_url: null,
  image_versions: null,
  private: false
};

describe("Collections", () => {
  describe("Handles getting collection metadata", () => {
    const Collection = schema.__get__("Collection");

    beforeEach(() => {
      const gravity = sinon.stub();
      gravity.with = sinon.stub().returns(gravity);
      gravity
        .withArgs("collection/saved-artwork", { user_id: null })
        .returns(Promise.resolve(gravityData));

      Collection.__Rewire__("gravity", gravity);
    });

    afterEach(() => {
      Collection.__ResetDependency__("gravity");
    });

    it("returns collection metadata", () => {
      const query = `
        {
          collection(id: "saved-artwork") {
            name
            private
            default
          }
        }
      `;
      return runQuery(query).then(data => {
        expect(data).toMatchSnapshot();
      });
    });
  });
});
