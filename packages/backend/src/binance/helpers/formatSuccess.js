const formatSuccess = (success) => {
  const formattedSuccess = { success: true, data: undefined };
  if (success.data) {
    formattedSuccess.data = success.data;
    return formattedSuccess;
  }
};

module.exports = {
  formatSuccess,
};
