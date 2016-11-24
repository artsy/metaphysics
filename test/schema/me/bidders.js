describe('Me', () => {
  describe('Bidders', () => {
    let gravity;

    const Me = schema.__get__('Me');
    const Bidders = Me.__get__('Bidders');

    beforeEach(() => {
      gravity = sinon.stub();
      gravity.with = sinon.stub().returns(gravity);

      Me.__Rewire__('gravity', gravity);
      Bidders.__Rewire__('gravity', gravity);

      gravity
        // Me fetch
        .onCall(0)
        .returns(Promise.resolve({}));
    });

    afterEach(() => {
      Me.__ResetDependency__('gravity');
      Bidders.__ResetDependency__('gravity');
    });

    it('returns bidder ids that the user is registered in sales for', () => {
      const query = `
        {
          me {
            bidders {
              id
            }
          }
        }
      `;

      gravity
        .withArgs('me/bidders', {})
        .returns(Promise.resolve([
          { id: 'Foo ID' },
          { id: 'Bar ID' },
        ]));

      return runAuthenticatedQuery(query)
      .then(({ me: { bidders } }) => {
        expect(bidders).toEqual([
            { id: 'Foo ID' },
            { id: 'Bar ID' },
        ]);
      });
    });


    it('returns bidder ids for the requested sale', () => {
      const query = `
        {
          me {
            bidders(sale_id: "the-fun-sale") {
              id
            }
          }
        }
      `;

      gravity
        .withArgs('me/bidders', { sale_id: 'the-fun-sale' })
        .returns(Promise.resolve([
          { id: 'Foo ID' },
          { id: 'Bar ID' },
        ]));

      return runAuthenticatedQuery(query)
      .then(({ me: { bidders } }) => {
        expect(bidders).toEqual([
            { id: 'Foo ID' },
            { id: 'Bar ID' },
        ]);
      });
    });
  });
});
