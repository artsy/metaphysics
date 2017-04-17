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
        profile: {
          published: true,
          private: false,
        },
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
          profile {
            is_publically_visible
          }
        }
      }
    }
  `;

  it('is_publically_visible returns true when profile is published', () => {
    return runQuery(query)
      .then(data => {
        expect(data).toEqual({
          fair: {
            id: 'the-armory-show-2017',
            name: 'The Armory Show 2017',
            organizer: {
              profile_id: 'the-armory-show',
              profile: {
                is_publically_visible: true,
              },
            },
          },
        });
      });
  });
});

describe('Fair unpublished organizer profile', () => {
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
        profile: {
          published: false,
          private: false,
        },
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
          profile {
            is_publically_visible
          }
        }
      }
    }
  `;

  it('is_publically_visible returns false when profile is not published', () => {
    return runQuery(query)
      .then(data => {
        expect(data).toEqual({
          fair: {
            id: 'the-armory-show-2017',
            name: 'The Armory Show 2017',
            organizer: {
              profile_id: 'the-armory-show',
              profile: {
                is_publically_visible: false,
              },
            },
          },
        });
      });
  });
});

describe('Fair private organizer profile', () => {
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
        profile: {
          published: true,
          private: true,
        },
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
          profile {
            is_publically_visible
          }
        }
      }
    }
  `;

  it('is_publically_visible returns false when profile is private', () => {
    return runQuery(query)
      .then(data => {
        expect(data).toEqual({
          fair: {
            id: 'the-armory-show-2017',
            name: 'The Armory Show 2017',
            organizer: {
              profile_id: 'the-armory-show',
              profile: {
                is_publically_visible: false,
              },
            },
          },
        });
      });
  });
});
