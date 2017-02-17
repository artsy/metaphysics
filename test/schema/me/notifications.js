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

    it('returns notification feed items', () => {
      const query = `
        {
          me {
            notifications {
              status
              date(format: "YYYY")
              artworks {
                title
              }
            }
          }
        }
      `;

      const artworkStub = { artists: [] };

      const artwork1 = assign({}, artworkStub, { title: 'Artwork1' });
      const artwork2 = assign({}, artworkStub, { title: 'Artwork2' });

      gravity
        // Feed fetch
        .onCall(1)
        .returns(Promise.resolve({
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
      .then(({ me: { notifications } }) => {
        expect(notifications).toEqual([
          {
            status: 'READ',
            date: '2017',
            artworks: [{ title: 'Artwork1' }, { title: 'Artwork2' }],
          },
        ]);
      });
    });
  });
});
