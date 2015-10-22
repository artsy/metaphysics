import request from 'request';

export default function(path, data) {
  if (typeof path !== 'string') {
    path = path.join('/');
  };

  return new Promise((resolve, reject) => {
    let url = process.env.API_ENDPOINT + '/' + path;

    console.log('requesting:', url);

    request(url, {
      headers: { 'X-AUTHENTICATION-TOKEN': process.env.AUTHENTICATION_TOKEN },
      method: 'GET',
      qs: data,
    }, (err, response) => {
      if (err) return reject(err);
      let parsed = typeof response.body === 'string' ? JSON.parse(response.body) : response.body;
      resolve(parsed);
    });
  });
};
