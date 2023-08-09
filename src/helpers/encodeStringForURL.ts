const encodeStringForURL = (string: string): string => {
  const encodedArr = new Array(string.length)
    .fill('')
    .map((_, idx) => string.charCodeAt(idx));
  return encodedArr.join('_');
};

export default encodeStringForURL;
