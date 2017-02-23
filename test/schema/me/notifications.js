import { assign } from 'lodash';

describe('Me', () => {
  describe('Notifications', () => {
    const gravity = sinon.stub();
    const Me = schema.__get__('Me');
    const Notifications = Me.__get__('Notifications');

    beforeEach(() => {
      gravity.with = sinon.stub().returns(gravity);

      Me.__Rewire__('gravity', gravity);
      Notifications.__Rewire__('gravity', gravity);

      gravity
        // Me fetch
        .onCall(0)
        .returns(Promise.resolve({}));
    });

    afterEach(() => {
      Me.__ResetDependency__('gravity');
      Notifications.__ResetDependency__('gravity');
    });

    it('returns notification feed items w/ Relay pagination', () => {
      const query = `
        {
          me {
            notifications_connection(first: 1) {
              pageInfo {
                hasNextPage
              }
              edges {
                node {
                  status
                  date(format: "YYYY")
                  artworks {
                    title
                  }
                }
              }
            }
          }
        }
      `;

      const artworkStub = { artists: [] };

      const artwork1 = assign({}, artworkStub, { title: 'Artwork1' });
      const artwork2 = assign({}, artworkStub, { title: 'Artwork2' });

      const expectedConnectionData = {
        pageInfo: {
          hasNextPage: true,
        },
        edges: [{
          node: {
            status: 'READ',
            date: '2017',
            artworks: [{ title: 'Artwork1' }, { title: 'Artwork2' }],
          },
        }],
      };

      gravity
        // Feed fetch
        .onCall(1)
        .returns(Promise.resolve({
          total: 2,
          feed: [
            {
              status: 'read',
              object_ids: ['artwork1', 'artwork2'],
              date: '2017-02-17T17:19:44.000Z',
            },
          ],
        }))

        // Artwork fetches
        .onCall(2)
        .returns(Promise.resolve([artwork1, artwork2]));

      return runAuthenticatedQuery(query)
      .then(({ me: { notifications_connection } }) => {
        expect(notifications_connection).toEqual(expectedConnectionData);
      });
    });
  });
});
