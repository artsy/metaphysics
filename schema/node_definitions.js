import positron from '../lib/loaders/positron';
import gravity from '../lib/apis/gravity';
import { nodeDefinitions, fromGlobalId } from 'graphql-relay';

export default nodeDefinitions((globalId) =>
  let { type, id } = fromGlobalId(globalId);
  switch (type) {
    case 'Ping':
      return gravity('system/ping');
      break;
    case 'Article':
      return positron(`articles/${id}`);
    default:
      return null;
  }
});
