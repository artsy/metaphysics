import moment from 'moment';

describe('Show type', () => {
  const Show = schema.__get__('Show');
  const ExternalPartner = schema.__get__('ExternalPartner');
  let total = null;
  let gravity = null;
  let galaxy = null;
  let showData = null;
  let galaxyData = null;

  beforeEach(() => {
    gravity = sinon.stub();
    total = sinon.stub();
    galaxy = sinon.stub();

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
      is_reference: true,
    };
    gravity.returns(Promise.resolve(showData));

    galaxyData = {
      id: '1',
      name: 'Galaxy Partner',
      _links: 'blah',
    };
    galaxy.returns(Promise.resolve(galaxyData));

    Show.__Rewire__('gravity', gravity);
    ExternalPartner.__Rewire__('galaxy', galaxy);
    Show.__Rewire__('total', total);
  });

  afterEach(() => {
    Show.__ResetDependency__('gravity');
    ExternalPartner.__ResetDependency__('galaxy');
    Show.__ResetDependency__('total');
  });

  it('includes the galaxy partner information when galaxy_partner_id is present', () => {
    showData.galaxy_partner_id = 'galaxy-partner';
    showData.partner = null;
    const query = `
      {
        show(id: "new-museum-1-2015-triennial-surround-audience") {
          partner {
            ... on ExternalPartner {
              name
            }
          }
        }
      }
    `;
    return runQuery(query)
      .then(data => {
        expect(data).to.eql({
          show: {
            partner: {
              name: 'Galaxy Partner',
            },
          },
        });
      });
  });

  it('includes a formattable start and end date', () => {
    const query = `
      {
        show(id: "new-museum-1-2015-triennial-surround-audience") {
          id
          start_at(format: "dddd, MMMM Do YYYY, h:mm:ss a")
          end_at(format: "YYYY")
        }
      }
    `;

    return runQuery(query)
      .then(data => {
        expect(Show.__get__('gravity').args[0][0])
          .to.equal('show/new-museum-1-2015-triennial-surround-audience');

        expect(data).to.eql({
          show: {
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
        show(id: "new-museum-1-2015-triennial-surround-audience") {
          exhibition_period
        }
      }
    `;

    return runQuery(query)
      .then(data => {
        expect(data).to.eql({
          show: {
            exhibition_period: 'Feb 25 – May 24, 2015',
          },
        });
      });
  });

  it('includes an update on upcoming status changes', () => {
    showData.end_at = moment().add(1, 'd');

    const query = `
      {
        show(id: "new-museum-1-2015-triennial-surround-audience") {
          status_update
        }
      }
    `;

    return runQuery(query)
      .then(data => {
        expect(data).to.eql({
          show: {
            status_update: 'Closing tomorrow',
          },
        });
      });
  });

  it('includes the html version of markdown', () => {
    const query = `
      {
        show(id: "new-museum-1-2015-triennial-surround-audience") {
          press_release(format: markdown)
        }
      }
    `;

    return runQuery(query)
      .then(data => {
        expect(Show.__get__('gravity').args[0][0])
          .to.equal('show/new-museum-1-2015-triennial-surround-audience');

        expect(data).to.eql({
          show: {
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
        show(id: "new-museum-1-2015-triennial-surround-audience") {
          counts {
            artworks
          }
        }
      }
    `;

    return runQuery(query)
      .then(data => {
        expect(data).to.eql({
          show: {
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
        show(id: "new-museum-1-2015-triennial-surround-audience") {
          counts {
            eligible_artworks
          }
        }
      }
    `;

    return runQuery(query)
      .then(data => {
        expect(data).to.eql({
          show: {
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
        show(id: "new-museum-1-2015-triennial-surround-audience") {
          counts {
            artworks(artist_id: "juliana-huxtable")
          }
        }
      }
    `;

    return runQuery(query)
      .then(data => {
        expect(data).to.eql({
          show: {
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
        show(id: "new-museum-1-2015-triennial-surround-audience") {
          cover_image {
            id
          }
        }
      }
    `;

    return runQuery(query)
      .then(({ show }) => {
        expect(show).to.eql({
          cover_image: null,
        });
      });
  });
});
