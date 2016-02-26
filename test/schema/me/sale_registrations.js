import sinon from 'sinon';
import { graphql } from 'graphql';
import schema from '../../../schema';

describe('Me', () => {
  describe('SaleRegistrations', () => {
    const gravity = sinon.stub();
    const Me = schema.__get__('Me');
    const SaleRegistrations = Me.__get__('SaleRegistrations');

    beforeEach(() => {
      gravity.with = sinon.stub().returns(gravity);

      Me.__Rewire__('gravity', gravity);
      SaleRegistrations.__Rewire__('gravity', gravity);

      gravity
        // Me fetch
        .onCall(0)
        .returns(Promise.resolve({}));
    });

    afterEach(() => {
      Me.__ResetDependency__('gravity');
      SaleRegistrations.__ResetDependency__('gravity');
    });

    it('returns the sales along with the registration status', () => {
      const query = `
        {
          me {
            sale_registrations {
              is_registered
              sale {
                name
              }
            }
          }
        }
      `;

      gravity
        // Sale fetch
        .onCall(1)
        .returns(Promise.resolve([
          { name: 'Foo Sale' },
          { name: 'Bar Sale' },
        ]))

        // Registration fetches
        .onCall(2)
        .returns(Promise.resolve([]))
        .onCall(3)
        .returns(Promise.resolve([{ id: 'bidder-id' }]));

      return graphql(schema, query, { accessToken: 'foo' })
        .then(({ data: { me: { sale_registrations } } }) => {
          sale_registrations.should.eql([
            { is_registered: false, sale: { name: 'Foo Sale' } },
            { is_registered: true, sale: { name: 'Bar Sale' } },
          ]);
        });
    });
  });
});
