const formatError = (error) => {
  const formattedError = { success: false, data: undefined };
  if (error.message) {
    formattedError.data = error.message;
  } else if (error.response.data.msg) {
    formattedError.data = error.response.data.msg;
  }
  return formattedError;
};

module.exports = {
  formatError,
};
