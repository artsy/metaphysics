describe('Me', () => {
  describe('Conversations', () => {
    const gravity = sinon.stub();
    const impulse = sinon.stub();
    const Me = schema.__get__('Me');
    const Conversations = Me.__get__('Conversations');

    beforeEach(() => {
      gravity.with = sinon.stub().returns(gravity);
      impulse.with = sinon.stub().returns(impulse);

      Me.__Rewire__('gravity', gravity);
      Conversations.__Rewire__('gravity', gravity);
      Conversations.__Rewire__('impulse', impulse);

      gravity
        // Me fetch
        .onCall(0)
        .returns(Promise.resolve({}));
    });

    afterEach(() => {
      Me.__ResetDependency__('gravity');
      Conversations.__ResetDependency__('gravity');
      Conversations.__ResetDependency__('impulse');
    });

    it('returns conversations', () => {
      const query = `
        {
          me {
            conversations {
              id
              initial_message
              from_email
            }
          }
        }
      `;

      const conversation1 = {
        id: '2',
        initial_message: 'omg im sooo interested',
        from_email: 'percy@cat.com',
      };
      const conversation2 = {
        id: '3',
        initial_message: 'im only a little interested',
        from_email: 'percy@cat.com',
      };

      const expectedConversationData = [
        {
          id: '2',
          initial_message: 'omg im sooo interested',
          from_email: 'percy@cat.com',
        },
        {
          id: '3',
          initial_message: 'im only a little interested',
          from_email: 'percy@cat.com',
        },
      ];

      gravity
        // Token request
        .onCall(1)
        .returns(Promise.resolve({ token: 'token' }));

      impulse
        .onCall(0)
        .returns(Promise.resolve({ conversations: [conversation1, conversation2] }));

      return runAuthenticatedQuery(query)
      .then(({ me: { conversations } }) => {
        expect(conversations).toEqual(expectedConversationData);
      });
    });
  });
});
