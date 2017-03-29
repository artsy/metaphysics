describe('UpdateConversation', () => {
  const gravity = sinon.stub();
  const impulse = sinon.stub();
  const UpdateConversation = schema.__get__('UpdateConversation');

  beforeEach(() => {
    gravity.with = sinon.stub().returns(gravity);
    impulse.with = sinon.stub().returns(impulse);

    UpdateConversation.__Rewire__('gravity', gravity);
    UpdateConversation.__Rewire__('impulse', impulse);
  });

  afterEach(() => {
    UpdateConversation.__ResetDependency__('gravity');
    UpdateConversation.__ResetDependency__('impulse');
  });

  it('updates and returns a conversation', () => {
    const mutation = `
      mutation {
        updateConversation(id: "3", buyer_outcome: "too expensive") {
          id
          initial_message
          from_email
        }
      }
    `;

    const conversation = {
      id: '3',
      initial_message: 'omg im sooo interested',
      from_email: 'percy@cat.com',
    };

    const expectedConversationData = {
      id: '3',
      initial_message: 'omg im sooo interested',
      from_email: 'percy@cat.com',
    };

    gravity
      .onCall(0)
      .returns(Promise.resolve({ token: 'token' }));

    impulse
      .onCall(0)
      .returns(Promise.resolve(conversation));

    return runAuthenticatedQuery(mutation)
    .then(({ updateConversation }) => {
      expect(updateConversation).toEqual(expectedConversationData);
    });
  });
});
