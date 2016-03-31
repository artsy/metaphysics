import sinon from 'sinon';
import { graphql } from 'graphql';
import schema from '../../schema';

describe('PartnerShows type', () => {
  const PartnerShows = schema.__get__('PartnerShows');
  const PartnerShow = PartnerShows.__get__('PartnerShow');

  beforeEach(() => {
    const gravity = sinon.stub();

    gravity
      .onCall(0)
      .returns(Promise.resolve([
        {
          id: 'new-museum-solo-show',
          partner: {
            id: 'new-museum',
          },
        },
        {
          id: 'new-museum-group-show',
          partner: {
            id: 'new-museum',
          },
        },
        {
          id: 'new-museum-fair-booth',
          partner: {
            id: 'new-museum',
          },
        },
      ]))
      .onCall(1)
      .returns(Promise.resolve({
        artists: [{}],
        fair: null,
      }))
      .onCall(2)
      .returns(Promise.resolve({
        artists: [{}, {}],
        fair: null,
      }))
      .onCall(3)
      .returns(Promise.resolve({
        artists: [{}],
        fair: { id: 'existy' },
      }));

    PartnerShows.__Rewire__('gravity', gravity);
    PartnerShow.__Rewire__('gravity', gravity);
  });

  afterEach(() => {
    PartnerShows.__ResetDependency__('gravity');
    PartnerShow.__ResetDependency__('gravity');
  });

  describe('#kind', () => {
    it('returns the correct computed `kind` field for each show', () => {
      const query = `
        {
          partner_shows {
            id
            kind
          }
        }
      `;

      return graphql(schema, query)
        .then(({ data }) =>
          data.should.eql({
            partner_shows: [
              { id: 'new-museum-solo-show', kind: 'solo' },
              { id: 'new-museum-group-show', kind: 'group' },
              { id: 'new-museum-fair-booth', kind: 'fair' },
            ],
          }));
    });
  });
});
