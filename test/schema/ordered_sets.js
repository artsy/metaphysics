describe('OrderedSets type', () => {
  const OrderedSets = schema.__get__('OrderedSets');

  beforeEach(() => {
    const gravity = sinon.stub();

    gravity
      // OrderedSets
      .onCall(0)
      .returns(Promise.resolve([{
        id: '52dd3c2e4b8480091700027f',
        item_type: 'Gene',
        key: 'artists:featured-genes',
        name: 'Featured Genes',
        description: 'These Genes are featured',
      }]))
      // GeneItems
      .onCall(1)
      .returns(Promise.resolve([{
        name: 'Painting',
      }]));

    OrderedSets.__Rewire__('gravity', gravity);
  });

  afterEach(() => {
    OrderedSets.__ResetDependency__('gravity');
  });

  it('fetches sets by key', () => {
    const query = `
      {
        ordered_sets(key: "artists:featured-genes") {
          id
          name
          description
          genes: items {
            ... on GeneItem {
              name
            }
          }
        }
      }
    `;

    return runQuery(query)
      .then(data => {
        expect(OrderedSets.__get__('gravity').args[0]).toEqual([
          'sets',
          { key: 'artists:featured-genes', public: true },
        ]);

        expect(OrderedSets.__get__('gravity').args[1]).toEqual([
          'set/52dd3c2e4b8480091700027f/items',
        ]);

        expect(data).toEqual({
          ordered_sets: [{
            id: '52dd3c2e4b8480091700027f',
            name: 'Featured Genes',
            description: 'These Genes are featured',
            genes: [{
              name: 'Painting',
            }],
          }],
        });
      });
  });
});
