const ErrorExpress = require("./error");
const wrapasync = function (fn) {
  return function (req, res, next) {
    fn(req, res, next).catch((err) => next(new ErrorExpress(404, err.message)));
  };
};
module.exports = wrapasync;
