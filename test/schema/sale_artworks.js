import sinon from 'sinon';
import { graphql } from 'graphql';
import schema from '../../schema';

describe('SaleArtworks type', () => {
  const SaleArtworks = schema.__get__('SaleArtworks');

  beforeEach(() => {
    const gravity = sinon.stub();

    gravity.returns(Promise.resolve({
      id: 'kaws-untitled',
      sale_id: 'whitney-art-party-2013',
    }));

    SaleArtworks.__Rewire__('gravity', gravity);
  });

  afterEach(() => {
    SaleArtworks.__ResetDependency__('gravity');
  });

  it('returns multiple sale artworks', () => {
    const query = `
      {
        sale_artworks(ids: ["kaws-untitled", "kaws-untitled2"]) {
          id
          sale_id
        }
      }
    `;

    return graphql(schema, query)
      .then(({ data }) => {
        SaleArtworks.__get__('gravity').args[0][0]
          .should.equal('sale_artwork/kaws-untitled');

        data.should.eql({
          sale_artworks: [
            {
              id: 'kaws-untitled',
              sale_id: 'whitney-art-party-2013',
            },
            {
              id: 'kaws-untitled',
              sale_id: 'whitney-art-party-2013',
            },
          ],
        });
      });
  });
});
