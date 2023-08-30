module.exports = (fn) => {
  return (req, res, next) => {
    //like this returns a promise, and that's what we want.
    fn(req, res, next).catch(next);
  };
};
