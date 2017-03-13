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
      name: ' Whitespace Abounds ',
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

  describe('name', () => {
    it('strips whitespace from the name', () => {
      const query = `
        {
          show(id: "new-museum-1-2015-triennial-surround-audience") {
            name
          }
        }
      `;
      return runQuery(query)
        .then(data => {
          expect(data).toEqual({
            show: {
              name: 'Whitespace Abounds',
            },
          });
        });
    });

    it('returns null when the name is null', () => {
      const query = `
        {
          show(id: "new-museum-1-2015-triennial-surround-audience") {
            name
          }
        }
      `;
      showData.name = null;
      return runQuery(query)
        .then(data => {
          expect(data).toEqual({
            show: {
              name: null,
            },
          });
        });
    });
  });

  describe('city', () => {
    it('returns the location city if one is set', () => {
      showData.location = { city: 'Quonochontaug' };
      showData.partner_city = 'Something Else';
      const query = `
        {
          show(id: "new-museum-1-2015-triennial-surround-audience") {
            city
          }
        }
      `;
      return runQuery(query)
        .then(data => {
          expect(data).toEqual({
            show: {
              city: 'Quonochontaug',
            },
          });
        });
    });
    it('returns the partner_city if one is set', () => {
      showData.partner_city = 'Quonochontaug';
      showData.location = null;
      const query = `
        {
          show(id: "new-museum-1-2015-triennial-surround-audience") {
            city
          }
        }
      `;
      return runQuery(query)
        .then(data => {
          expect(data).toEqual({
            show: {
              city: 'Quonochontaug',
            },
          });
        });
    });
  });

  describe('kind', () => {
    it('returns fair when a fair booth', () => {
      showData.fair = { id: 'foo' };
      const query = `
        {
          show(id: "new-museum-1-2015-triennial-surround-audience") {
            kind
          }
        }
      `;
      return runQuery(query)
        .then(data => {
          expect(data).toEqual({
            show: {
              kind: 'fair',
            },
          });
        });
    });
    it('returns solo when only one artist in a ref show', () => {
      showData.artists = [];
      showData.artists_without_artworks = [{ id: 'foo' }];
      const query = `
        {
          show(id: "new-museum-1-2015-triennial-surround-audience") {
            kind
          }
        }
      `;
      return runQuery(query)
        .then(data => {
          expect(data).toEqual({
            show: {
              kind: 'solo',
            },
          });
        });
    });
    it('returns group when more than one artist in a ref show', () => {
      showData.artists = [];
      showData.artists_without_artworks = [{ id: 'foo' }, { id: 'bar' }];
      const query = `
        {
          show(id: "new-museum-1-2015-triennial-surround-audience") {
            kind
          }
        }
      `;
      return runQuery(query)
        .then(data => {
          expect(data).toEqual({
            show: {
              kind: 'group',
            },
          });
        });
    });
    it('returns solo when only one artist', () => {
      showData.artists = [{ id: 'foo' }];
      showData.artists_without_artworks = null;
      const query = `
        {
          show(id: "new-museum-1-2015-triennial-surround-audience") {
            kind
          }
        }
      `;
      return runQuery(query)
        .then(data => {
          expect(data).toEqual({
            show: {
              kind: 'solo',
            },
          });
        });
    });
    it('returns group when more than one artist in a regular show', () => {
      showData.artists = [{ id: 'foo' }, { id: 'bar' }];
      showData.artists_without_artworks = null;
      const query = `
        {
          show(id: "new-museum-1-2015-triennial-surround-audience") {
            kind
          }
        }
      `;
      return runQuery(query)
        .then(data => {
          expect(data).toEqual({
            show: {
              kind: 'group',
            },
          });
        });
    });
    it('returns group when only one artist but the show is flagged as group', () => {
      showData.artists = [{ id: 'foo' }];
      showData.artists_without_artworks = null;
      showData.group = true;
      const query = `
        {
          show(id: "new-museum-1-2015-triennial-surround-audience") {
            kind
          }
        }
      `;
      return runQuery(query)
        .then(data => {
          expect(data).toEqual({
            show: {
              kind: 'group',
            },
          });
        });
    });
  });

  describe('href', () => {
    it('returns the href for a regular show', () => {
      showData.is_reference = false;
      const query = `
        {
          show(id: "new-museum-1-2015-triennial-surround-audience") {
            href
          }
        }
      `;
      return runQuery(query)
        .then(data => {
          expect(data).toEqual({
            show: {
              href: '/show/new-museum-1-2015-triennial-surround-audience',
            },
          });
        });
    });
    it('returns null for a reference show', () => {
      const query = `
        {
          show(id: "new-museum-1-2015-triennial-surround-audience") {
            href
          }
        }
      `;
      return runQuery(query)
        .then(data => {
          expect(data).toEqual({
            show: {
              href: null,
            },
          });
        });
    });
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
        expect(data).toEqual({
          show: {
            partner: {
              name: 'Galaxy Partner',
            },
          },
        });
      });
  });

  it('doesnt crash when no partner info is present', () => {
    showData.galaxy_partner_id = null;
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
        expect(data).toEqual({
          show: {
            partner: null,
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
          .toBe('show/new-museum-1-2015-triennial-surround-audience');

        expect(data).toEqual({
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
        expect(data).toEqual({
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
        expect(data).toEqual({
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
          .toBe('show/new-museum-1-2015-triennial-surround-audience');

        expect(data).toEqual({
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
        expect(data).toEqual({
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
        expect(data).toEqual({
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
        expect(data).toEqual({
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
        expect(show).toEqual({
          cover_image: null,
        });
      });
  });
});
