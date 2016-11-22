describe('Sale type', () => {
  const Sale = schema.__get__('Sale');

  const sale = {
    id: 'foo-foo',
    _id: '123',
  };

  beforeEach(() => {
    Sale.__Rewire__('gravity', sinon.stub().returns(Promise.resolve(sale)));
  });

  afterEach(() => {
    Sale.__ResetDependency__('gravity');
  });

  describe('buyers premium', () => {
    it('returns a valid object even if the sale has no buyers premium', () => {
      const query = `
        {
          sale(id: "foo-foo") {
            _id
            buyers_premium {
              amount
              cents
            }
          }
        }
      `;

      return runQuery(query)
        .then(data => {
          expect(data).to.eql({
            sale: {
              _id: '123',
              buyers_premium: null,
            },
          });
        });
    });

    it('returns a valid object if there is a complete buyers premium', () => {
      sale.buyers_premium = {
        schedule: [
          {
            min_amount_cents: 10000,
            currency: 'USD',
          },
        ],
      };

      const query = `
        {
          sale(id: "foo-foo") {
            _id
            buyers_premium {
              amount
              cents
            }
          }
        }
      `;

      return runQuery(query)
        .then(data => {
          expect(data).to.eql({
            sale: {
              _id: '123',
              buyers_premium: [{
                amount: '$100',
                cents: 10000,
              }],
            },
          });
        });
    });

    it('returns a valid object if the buyers premium is missing a schedule', () => {
      sale.buyers_premium = {};

      const query = `
        {
          sale(id: "foo-foo") {
            _id
            buyers_premium {
              amount
              cents
            }
          }
        }
      `;

      return runQuery(query)
        .then(data => {
          expect(data).to.eql({
            sale: {
              _id: '123',
              buyers_premium: null,
            },
          });
        });
    });
  });
});
