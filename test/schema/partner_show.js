import moment from 'moment';

describe('PartnerShow type', () => {
  const PartnerShow = schema.__get__('PartnerShow');
  let total = null;
  let gravity = null;
  let showData = null;

  beforeEach(() => {
    gravity = sinon.stub();
    total = sinon.stub();

    showData = {
      id: 'new-museum-1-2015-triennial-surround-audience',
      start_at: '2015-02-25T12:00:00+00:00',
      end_at: '2015-05-24T12:00:00+00:00',
      press_release: '**foo** *bar*',
      displayable: true,
      partner: {
        id: 'new-museum',
      },
      display_on_partner_profile: true,
      eligible_artworks_count: 8,
    };
    gravity.returns(Promise.resolve(showData));

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

    return runQuery(query)
      .then(data => {
        expect(PartnerShow.__get__('gravity').args[0][0])
          .to.equal('show/new-museum-1-2015-triennial-surround-audience');

        expect(data).to.eql({
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

    return runQuery(query)
      .then(data => {
        expect(data).to.eql({
          partner_show: {
            exhibition_period: 'Feb 25 – May 24, 2015',
          },
        });
      });
  });

  it('includes an update on upcoming status changes', () => {
    showData.end_at = moment().add(1, 'd');

    const query = `
      {
        partner_show(id: "new-museum-1-2015-triennial-surround-audience") {
          status_update
        }
      }
    `;

    return runQuery(query)
      .then(data => {
        expect(data).to.eql({
          partner_show: {
            status_update: 'Closing tomorrow',
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

    return runQuery(query)
      .then(data => {
        expect(PartnerShow.__get__('gravity').args[0][0])
          .to.equal('show/new-museum-1-2015-triennial-surround-audience');

        expect(data).to.eql({
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
          counts {
            artworks
          }
        }
      }
    `;

    return runQuery(query)
      .then(data => {
        expect(data).to.eql({
          partner_show: {
            counts: {
              artworks: 42,
            },
          },
        });
      });
  });

  it('includes the total number of eligible artworks', () => {
    const query = `
      {
        partner_show(id: "new-museum-1-2015-triennial-surround-audience") {
          counts {
            eligible_artworks
          }
        }
      }
    `;

    return runQuery(query)
      .then(data => {
        expect(data).to.eql({
          partner_show: {
            counts: {
              eligible_artworks: 8,
            },
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
          counts {
            artworks(artist_id: "juliana-huxtable")
          }
        }
      }
    `;

    return runQuery(query)
      .then(data => {
        expect(data).to.eql({
          partner_show: {
            counts: {
              artworks: 2,
            },
          },
        });
      });
  });

  it('does not return errors when there is no cover image', () => {
    gravity
      .onCall(1)
      .returns(Promise.resolve([]));

    const query = `
      {
        partner_show(id: "new-museum-1-2015-triennial-surround-audience") {
          cover_image {
            id
          }
        }
      }
    `;

    return runQuery(query)
      .then(({ partner_show }) => {
        expect(partner_show).to.eql({
          cover_image: null,
        });
      });
  });
});
