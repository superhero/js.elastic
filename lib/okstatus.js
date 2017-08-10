module.exports = (status) => {
  return (status & 200) == 200;//false in case of error
};
