
describe('Fair type', () => {
  const Fair = schema.__get__('Fair');
  let gravity = null;
  let fairData = null;

  beforeEach(() => {
    gravity = sinon.stub();

    fairData = {
      id: 'the-armory-show-2017',
      name: 'The Armory Show 2017',
      organizer: {
        profile_id: 'the-armory-show',
      },
    };

    gravity.returns(Promise.resolve(fairData));

    Fair.__Rewire__('gravity', gravity);
  });

  afterEach(() => {
    Fair.__ResetDependency__('gravity');
  });

  const query = `
    {
      fair(id: "the-armory-show-2017") {
        id
        name
        organizer {
          profile_id
        }
        has_published_organizer_profile
      }
    }
  `;

  it('has_published_fair_organize returns true when profile is published', () => {
    const profileData = {
      id: 'the-armory-show',
      published: true,
      private: false,
    };

    gravity
      .onCall(1)
      .returns(Promise.resolve(profileData));

    return runQuery(query)
      .then(data => {
        expect(Fair.__get__('gravity').args[1][0])
          .toBe('profile/the-armory-show');

        expect(data).toEqual({
          fair: {
            id: 'the-armory-show-2017',
            name: 'The Armory Show 2017',
            organizer: { profile_id: 'the-armory-show' },
            has_published_organizer_profile: true,
          },
        });
      });
  });

  it('has_published_fair_organize returns false when profile is not published', () => {
    const profileData = {
      id: 'the-armory-show',
      published: false,
      private: false,
    };

    gravity
      .onCall(1)
      .returns(Promise.resolve(profileData));

    return runQuery(query)
      .then(data => {
        expect(Fair.__get__('gravity').args[1][0])
          .toBe('profile/the-armory-show');

        expect(data).toEqual({
          fair: {
            id: 'the-armory-show-2017',
            name: 'The Armory Show 2017',
            organizer: { profile_id: 'the-armory-show' },
            has_published_organizer_profile: false,
          },
        });
      });
  });

  it('has_published_fair_organize returns false when profile is private', () => {
    const profileData = {
      id: 'the-armory-show',
      published: true,
      private: true,
    };

    gravity
      .onCall(1)
      .returns(Promise.resolve(profileData));

    return runQuery(query)
      .then(data => {
        expect(Fair.__get__('gravity').args[1][0])
          .toBe('profile/the-armory-show');

        expect(data).toEqual({
          fair: {
            id: 'the-armory-show-2017',
            name: 'The Armory Show 2017',
            organizer: { profile_id: 'the-armory-show' },
            has_published_organizer_profile: false,
          },
        });
      });
  });
});
