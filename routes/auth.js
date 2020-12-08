const Router = require("express").Router;
const User = require("../models/user");
const ExpressError = require("../expressError");

const jwt = require("jsonwebtoken");
const { SECRET_KEY } = require("../config");

const router = new Router();

/** POST /login - login: {username, password} => {token}
 *
 * Make sure to update their last-login!
 *
 **/

router.post("/login", async function (req, res, next) {
  try {
    let { username, password } = request.body;
    let authResult = await User.authenticate(username, password);
    if (!authResult) {
      const err = new ExpressError("Invalid credentials", 400);
      return next(err);
    }
    let token = jwt.sign(username, SECRET_KEY);
    User.updateLoginTimestamp(username);
    return res.json({ token });
  } catch (err) {
    return next(err);
  }
});

/** POST /register - register user: registers, logs in, and returns token.
 *
 * {username, password, first_name, last_name, phone} => {token}.
 *
 *  Make sure to update their last-login!
 */

router.post("/register", async function (req, res, next) {
  try {
    let username = await User.register(req.body);
    if (!username) {
      const err = new ExpressError("Username already taken", 400);
      return next(err);
    }
    let token = jwt.sign(username, SECRET_KEY);
    User.updateLoginTimestamp(username);
    return res.json({ token });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
