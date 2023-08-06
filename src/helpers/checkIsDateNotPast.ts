const checkIsDateNotPast = (dates: number[]): boolean => {
  const now = new Date();
  const nowAsUTC = new Date(now.toUTCString()).getTime();
  return dates.some((date) => {
    return date <= nowAsUTC;
  });
};

export default checkIsDateNotPast;
