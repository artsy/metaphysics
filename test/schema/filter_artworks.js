describe('Filter Artworks', () => {
  describe('Does not pass along the medium param if it is "*"', () => {
    const Gene = schema.__get__('Gene');
    const filterArtworks = Gene.__get__('filterArtworks');

    beforeEach(() => {
      const gravity = sinon.stub();
      gravity.with = sinon.stub().returns(gravity);
      // This is the key to the test
      // the 2nd parameter _should not_ include the mediums option, even though it's included below
      gravity.withArgs('filter/artworks', { gene_id: '500-1000-ce', aggregations: ['total'] })
        .returns(Promise.resolve({
          hits: [
            { id: 'oseberg-norway-queens-ship', title: "Queen's Ship", artists: [] },
          ],
        }));

      const gene = { id: '500-1000-ce', browseable: true, family: '' };
      Gene.__Rewire__('gravity', sinon.stub().returns(Promise.resolve(gene)));
      filterArtworks.__Rewire__('gravity', gravity);
    });

    afterEach(() => {
      filterArtworks.__ResetDependency__('gravity');
      Gene.__ResetDependency__('gravity');
    });

    it('returns filtered artworks, and makes a gravity call', () => {
      const query = `
        {
          gene(id: "500-1000-ce") {
            name
            filtered_artworks(aggregations:[TOTAL], medium: "*"){
              hits {
                id
              }
            }
          }
        }
      `;

      return runQuery(query).then(({ gene: { filtered_artworks: { hits } } }) => {
        expect(hits).toEqual([{ id: 'oseberg-norway-queens-ship' }]);
      });
    });
  });
});
