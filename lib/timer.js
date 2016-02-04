import { info } from './loggers';

export default (key) => {
  const start = process.hrtime();

  return {
    start: () => {
      info(`Loading: ${key}`);
      return start;
    },

    end: () => {
      const end = process.hrtime(start);
      info(`Elapsed: ${end[0]}s ${end[1] / 1000000}ms - ${key}`);
      return end;
    },
  };
};
