import moment from 'moment';

export function exhibitionPeriod(startAt, endAt) {
  const startMoment = moment(startAt);
  const endMoment = moment(endAt);
  const thisMoment = moment();

  let startFormat = 'MMM D';
  if (startMoment.year() !== endMoment.year()) {
    startFormat = startFormat.concat(', YYYY');
  }

  let endFormat = 'D';
  if (endMoment.year() !== thisMoment.year()) {
    endFormat = endFormat.concat(', YYYY');
  }
  if (!(startMoment.year() === endMoment.year() && startMoment.month() === endMoment.month())) {
    endFormat = 'MMM '.concat(endFormat);
  }

  return `${startMoment.format(startFormat)} – ${endMoment.format(endFormat)}`;
}
