import sinon from 'sinon';
import { graphql } from 'graphql';
import schema from '../../schema';

describe('PartnerShow type', () => {
  const PartnerShow = schema.__get__('PartnerShow');
  let total = null;

  beforeEach(() => {
    const gravity = sinon.stub();

    total = sinon.stub();

    gravity.returns(Promise.resolve({
      id: 'new-museum-1-2015-triennial-surround-audience',
      start_at: '2015-02-25T12:00:00+00:00',
      end_at: '2015-05-24T12:00:00+00:00',
      press_release: '**foo** *bar*',
      displayable: true,
      partner: {
        id: 'new-museum',
      },
    }));

    PartnerShow.__Rewire__('gravity', gravity);
    PartnerShow.__Rewire__('total', total);
  });

  afterEach(() => {
    PartnerShow.__ResetDependency__('gravity');
    PartnerShow.__ResetDependency__('total');
  });

  it('includes a formattable start and end date', () => {
    const query = `
      {
        partner_show(id: "new-museum-1-2015-triennial-surround-audience") {
          id
          start_at(format: "dddd, MMMM Do YYYY, h:mm:ss a")
          end_at(format: "YYYY")
        }
      }
    `;

    return graphql(schema, query)
      .then(({ data }) => {
        PartnerShow.__get__('gravity').args[0][0]
          .should.equal('show/new-museum-1-2015-triennial-surround-audience');

        data.should.eql({
          partner_show: {
            id: 'new-museum-1-2015-triennial-surround-audience',
            start_at: 'Wednesday, February 25th 2015, 12:00:00 pm',
            end_at: '2015',
          },
        });
      });
  });

  it('includes a formatted exhibition period', () => {
    const query = `
      {
        partner_show(id: "new-museum-1-2015-triennial-surround-audience") {
          exhibition_period
        }
      }
    `;

    return graphql(schema, query)
      .then(({ data }) => {
        data.should.eql({
          partner_show: {
            exhibition_period: 'Feb 25 – May 24, 2015',
          },
        });
      });
  });

  it('includes the html version of markdown', () => {
    const query = `
      {
        partner_show(id: "new-museum-1-2015-triennial-surround-audience") {
          press_release(format: markdown)
        }
      }
    `;

    return graphql(schema, query)
      .then(({ data }) => {
        PartnerShow.__get__('gravity').args[0][0]
          .should.equal('show/new-museum-1-2015-triennial-surround-audience');

        data.should.eql({
          partner_show: {
            press_release: '<p><strong>foo</strong> <em>bar</em></p>\n',
          },
        });
      });
  });

  it('includes the total number of artworks', () => {
    total
      .onCall(0)
      .returns(Promise.resolve(42));

    const query = `
      {
        partner_show(id: "new-museum-1-2015-triennial-surround-audience") {
          artworks_count
        }
      }
    `;

    return graphql(schema, query)
      .then(({ data }) => {
        data.should.eql({
          partner_show: {
            artworks_count: 42,
          },
        });
      });
  });

  it('includes the number of artworks by a specific artist', () => {
    total
      .onCall(0)
      .returns(Promise.resolve(2));

    const query = `
      {
        partner_show(id: "new-museum-1-2015-triennial-surround-audience") {
          artworks_count(artist_id: "juliana-huxtable")
        }
      }
    `;

    return graphql(schema, query)
      .then(({ data }) => {
        data.should.eql({
          partner_show: {
            artworks_count: 2,
          },
        });
      });
  });
});
