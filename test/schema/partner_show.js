import sinon from 'sinon';
import { graphql } from 'graphql';
import schema from '../../schema';

describe('PartnerShow type', () => {
  let PartnerShow = schema.__get__('PartnerShow');

  beforeEach(() => {
    let gravity = sinon.stub();

    gravity.returns(Promise.resolve({
      id: 'new-museum-1-2015-triennial-surround-audience',
      start_at: '2015-02-25T12:00:00+00:00',
      end_at: '2015-05-24T12:00:00+00:00',
      press_release: "**foo** *bar*"
    }));

    PartnerShow.__Rewire__('gravity', gravity);
  });

  afterEach(() => {
    PartnerShow.__ResetDependency__('gravity');
  });

  it('includes a formattable start and end date', () => {
    let query = `
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
            end_at: '2015'
          }
        });
      });
  });

  it('includes the html version of markdown', () => {
    let query = `
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
            press_release: '<p><strong>foo</strong> <em>bar</em></p>\n'
          }
        })
      });
  });
});
