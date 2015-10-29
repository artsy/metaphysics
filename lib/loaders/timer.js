import debug from 'debug';

let log = debug('info');

export default {
  start: (key) => {
    let start = process.hrtime();
    log(`Loading: ${key}`);
    return start;
  },

  end: (start) => {
    let end = process.hrtime(start);
    log(`Elapsed: ${end[1] / 1000000}ms`);
    return end;
  }
};
