import debug from 'debug';

const log = debug('info');

export default {
  start: (key) => {
    const start = process.hrtime();
    log(`Loading: ${key}`);
    return start;
  },

  end: (start) => {
    const end = process.hrtime(start);
    log(`Elapsed: ${end[1] / 1000000}ms`);
    return end;
  },
};
