import { assign } from 'lodash';

describe('Artist type', () => {
  const Artist = schema.__get__('Artist');
  let artist = null;

  beforeEach(() => {
    artist = {
      id: 'foo-bar',
      name: 'Foo Bar',
      bio: null,
      blurb: null,
      birthday: null,
      artworks_count: 42,
    };

    Artist.__Rewire__('gravity', sinon.stub().returns(Promise.resolve(artist)));

    Artist.__Rewire__('positron', sinon.stub().returns(
      Promise.resolve({
        count: 22,
      })
    ));

    const total = sinon.stub();
    total
      .onCall(0)
      .returns(Promise.resolve(42));
    Artist.__Rewire__('total', total);
  });

  afterEach(() => {
    Artist.__ResetDependency__('gravity');
    Artist.__ResetDependency__('total');
    Artist.__ResetDependency__('positron');
  });

  it('fetches an artist by ID', () => {
    return runQuery('{ artist(id: "foo-bar") { id, name } }')
      .then(data => {
        expect(Artist.__get__('gravity').args[0][0]).to.equal('artist/foo-bar');
        expect(data.artist.id).to.equal('foo-bar');
        expect(data.artist.name).to.equal('Foo Bar');
      });
  });

  it('returns the total number of partner shows for an artist', () => {
    const query = `
      {
        artist(id: "foo-bar") {
          counts {
            partner_shows
          }
        }
      }
    `;

    return runQuery(query)
      .then(data => {
        expect(data).to.eql({
          artist: {
            counts: {
              partner_shows: 42,
            },
          },
        });
      });
  });

  it('returns the total number of related artists for an artist', () => {
    const query = `
      {
        artist(id: "foo-bar") {
          counts {
            related_artists
          }
        }
      }
    `;

    return runQuery(query)
      .then(data => {
        expect(data).to.eql({
          artist: {
            counts: {
              related_artists: 42,
            },
          },
        });
      });
  });

  it('returns the total number of related articles for an artist', () => {
    const query = `
      {
        artist(id: "foo-bar") {
          counts {
            articles
          }
        }
      }
    `;

    return runQuery(query)
      .then(data => {
        expect(data).to.eql({
          artist: {
            counts: {
              articles: 22,
            },
          },
        });
      });
  });

  it('returns false if artist has no metadata', () => {
    const query = `
      {
        artist(id: "foo-bar") {
          has_metadata
        }
      }
    `;

    return runQuery(query)
      .then(data => {
        expect(data).to.eql({
          artist: {
            has_metadata: false,
          },
        });
      });
  });
  describe('when formatting nationality and birthday string', () => {
    it('replaces born with b.', () => {
      artist.birthday = 'Born 2000';

      const query = `
        {
          artist(id: "foo-bar") {
            formatted_nationality_and_birthday
          }
        }
      `;

      return runQuery(query)
        .then(data => {
          expect(data).to.eql({
            artist: {
              formatted_nationality_and_birthday: 'b. 2000',
            },
          });
        });
    });

    it('adds b. to birthday if only a date is provided', () => {
      artist.birthday = '2000';

      const query = `
        {
          artist(id: "foo-bar") {
            formatted_nationality_and_birthday
          }
        }
      `;

      return runQuery(query)
        .then(data => {
          expect(data).to.eql({
            artist: {
              formatted_nationality_and_birthday: 'b. 2000',
            },
          });
        });
    });

    it('does not change birthday if birthday contains Est.', () => {
      artist.birthday = 'Est. 2000';

      const query = `
        {
          artist(id: "foo-bar") {
            formatted_nationality_and_birthday
          }
        }
      `;

      return runQuery(query)
        .then(data => {
          expect(data).to.eql({
            artist: {
              formatted_nationality_and_birthday: 'Est. 2000',
            },
          });
        });
    });

    it('returns both if both are provided', () => {
      artist.birthday = '2000';
      artist.nationality = 'Martian';

      const query = `
        {
          artist(id: "foo-bar") {
            formatted_nationality_and_birthday
          }
        }
      `;

      return runQuery(query)
        .then(data => {
          expect(data).to.eql({
            artist: {
              formatted_nationality_and_birthday: 'Martian, b. 2000',
            },
          });
        });
    });

    it('returns only nationality if no birthday is provided', () => {
      artist.nationality = 'Martian';

      const query = `
        {
          artist(id: "foo-bar") {
            formatted_nationality_and_birthday
          }
        }
      `;

      return runQuery(query)
        .then(data => {
          expect(data).to.eql({
            artist: {
              formatted_nationality_and_birthday: 'Martian',
            },
          });
        });
    });

    it('returns null if neither are provided', () => {
      const query = `
        {
          artist(id: "foo-bar") {
            formatted_nationality_and_birthday
          }
        }
      `;

      return runQuery(query)
        .then(data => {
          expect(data).to.eql({
            artist: {
              formatted_nationality_and_birthday: null,
            },
          });
        });
    });
  });

  describe('biography_blurb', () => {
    it('returns the blurb if present', () => {
      artist.blurb = 'catty blurb';
      const query = `
        {
          artist(id: "foo-bar") {
            blurb
          }
        }
      `;

      return runQuery(query)
        .then(data => {
          expect(data).to.eql({
            artist: {
              blurb: 'catty blurb',
            },
          });
        });
    });
  });

  describe('biography_blurb', () => {
    describe('with partner_bio set to true', () => {
      describe('with a featured partner bio', () => {
        beforeEach(() => {
          Artist.__ResetDependency__('gravity');
          const gravity = sinon.stub();
          Artist.__Rewire__('gravity', gravity);
          gravity
            // Artist
            .onCall(0)
            .returns(Promise.resolve(assign({}, artist)))
            // PartnerArtist
            .onCall(1)
            .returns(Promise.resolve([assign({}, {
              biography: 'new catty bio',
              partner: { name: 'Catty Partner', id: 'catty-partner' },
            })]));
        });
        afterEach(() => {
          const query = `
            {
              artist(id: "foo-bar") {
                biography_blurb(partner_bio: true) {
                  text
                  credit
                  partner_id
                }
              }
            }
          `;

          return runQuery(query)
            .then(data => {
              expect(data).to.eql({
                artist: {
                  biography_blurb: {
                    text: 'new catty bio',
                    credit: 'Submitted by Catty Partner',
                    partner_id: 'catty-partner',
                  },
                },
              });
            });
        });
        it('returns the featured partner bio without an artsy blurb', () => {
        });

        it('returns the featured partner bio with an artsy blurb', () => {
          artist.blurb = 'artsy blurb';
        });
      });
      it('returns the artsy blurb if there is no featured partner bio', () => {
        artist.blurb = 'artsy blurb';
        const query = `
          {
            artist(id: "foo-bar") {
              biography_blurb {
                text
                credit
                partner_id
              }
            }
          }
        `;

        return runQuery(query)
          .then(data => {
            expect(data).to.eql({
              artist: {
                biography_blurb: {
                  text: 'artsy blurb',
                  credit: null,
                  partner_id: null,
                },
              },
            });
          });
      });
    });
    it('returns the blurb if present', () => {
      artist.blurb = 'catty blurb';
      const query = `
        {
          artist(id: "foo-bar") {
            biography_blurb {
              text
              credit
              partner_id
            }
          }
        }
      `;

      return runQuery(query)
        .then(data => {
          expect(data).to.eql({
            artist: {
              biography_blurb: {
                text: 'catty blurb',
                credit: null,
                partner_id: null,
              },
            },
          });
        });
    });

    it('returns the featured bio if there is no Artsy one', () => {
      Artist.__ResetDependency__('gravity');
      const gravity = sinon.stub();
      Artist.__Rewire__('gravity', gravity);
      gravity
        // Artist
        .onCall(0)
        .returns(Promise.resolve(assign({}, artist)))
        // PartnerArtist
        .onCall(1)
        .returns(Promise.resolve([assign({}, {
          biography: 'new catty bio',
          partner: { name: 'Catty Partner', id: 'catty-partner' },
        })]));

      const query = `
        {
          artist(id: "foo-bar") {
            biography_blurb {
              text
              credit
              partner_id
            }
          }
        }
      `;

      return runQuery(query)
        .then(data => {
          expect(data).to.eql({
            artist: {
              biography_blurb: {
                text: 'new catty bio',
                credit: 'Submitted by Catty Partner',
                partner_id: 'catty-partner',
              },
            },
          });
        });
    });
  });
  describe('concerning works count', () => {
    it('returns a formatted description including works for sale', () => {
      artist.published_artworks_count = 42;
      artist.forsale_artworks_count = 21;

      const query = `
        {
          artist(id: "foo-bar") {
            formatted_artworks_count
          }
        }
      `;

      return runQuery(query)
        .then(data => {
          expect(data).to.eql({
            artist: {
              formatted_artworks_count: '42 works, 21 for sale',
            },
          });
        });
    });

    it('returns only works if none are for sale', () => {
      artist.published_artworks_count = 42;
      artist.forsale_artworks_count = 0;

      const query = `
        {
          artist(id: "foo-bar") {
            formatted_artworks_count
          }
        }
      `;

      return runQuery(query)
        .then(data => {
          expect(data).to.eql({
            artist: {
              formatted_artworks_count: '42 works',
            },
          });
        });
    });

    it('returns null when there are no works', () => {
      artist.published_artworks_count = 0;
      artist.forsale_artworks_count = 0;

      const query = `
        {
          artist(id: "foo-bar") {
            formatted_artworks_count
          }
        }
      `;

      return runQuery(query)
        .then(data => {
          expect(data).to.eql({
            artist: {
              formatted_artworks_count: null,
            },
          });
        });
    });

    it('returns a singular string if only one work for sale', () => {
      artist.published_artworks_count = 1;
      artist.forsale_artworks_count = 0;

      const query = `
        {
          artist(id: "foo-bar") {
            formatted_artworks_count
          }
        }
      `;

      return runQuery(query)
        .then(data => {
          expect(data).to.eql({
            artist: {
              formatted_artworks_count: '1 work',
            },
          });
        });
    });
  });
});
