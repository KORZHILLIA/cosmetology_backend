const extractJoiErrorLabel = (errorDetails: any) => {
  return errorDetails[0].context.label;
};

export default extractJoiErrorLabel;
