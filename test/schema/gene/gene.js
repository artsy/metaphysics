describe('Gene', () => {
  describe('For just querying the gene artworks', () => {
    const Gene = schema.__get__('Gene');
    const filterArtworks = Gene.__get__('filterArtworks');

    // If this test fails because it's making a gravity request to /gene/x, it's
    // because the AST checks to find out which nodes we're requesting
    // is not working correctly. This test is to make sure we don't
    // request to gravity.

    beforeEach(() => {
      const gravity = sinon.stub();
      gravity.with = sinon.stub().returns(gravity);
      gravity.withArgs('filter/artworks', { gene_id: '500-1000-ce', aggregations: ['total'] })
        .returns(Promise.resolve({
          hits: [
            { id: 'oseberg-norway-queens-ship', title: "Queen's Ship", artists: [] },
          ],
        }));
      filterArtworks.__Rewire__('gravity', gravity);
    });

    afterEach(() => {
      filterArtworks.__ResetDependency__('gravity');
    });

    it('returns filtered artworks', () => {
      const query = `
        {
          gene(id: "500-1000-ce") {
            filtered_artworks(aggregations:[TOTAL]){
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

  // The key distinction here is that because the query contains
  // metadata about the gene, then gravity will have to be called,
  // and in the test mocked out. Whereas above, it does not need
  // to happen.

  describe('For querying the gene artworks + gene metadata', () => {
    const Gene = schema.__get__('Gene');
    const filterArtworks = Gene.__get__('filterArtworks');

    beforeEach(() => {
      const gravity = sinon.stub();
      gravity.with = sinon.stub().returns(gravity);
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
            filtered_artworks(aggregations:[TOTAL]){
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
