const Router = require("express").Router;
const Message = require("../models/message");
const User = require("../models/user");
const ExpressError = require("../expressError");

const jwt = require("jsonwebtoken");
const { SECRET_KEY } = require("../config");

const router = new Router();

/** GET /:id - get detail of message.
 *
 * => {message: {id,
 *               body,
 *               sent_at,
 *               read_at,
 *               from_user: {username, first_name, last_name, phone},
 *               to_user: {username, first_name, last_name, phone}}
 *
 * Make sure that the currently-logged-in users is either the to or from user.
 *
 **/

router.get("/:id", ensureLoggedIn, async function (req, res, next) {
  try {
    let message = await Message.get(req.params.id);
    if (!message) {
      const err = new ExpressError("Message not found", 400);
      return next(err);
    }
    let username = req.user.username;
    if (
      username != message.to_user.username &&
      username != message.from_user.username
    ) {
      const err = new ExpressError("Unauthorized to view message", 400);
      return next(err);
    }
    return res.json({ message });
  } catch (err) {
    return next(err);
  }
});

/** POST / - post message.
 *
 * {to_username, body} =>
 *   {message: {id, from_username, to_username, body, sent_at}}
 *
 **/

router.post("/", ensureLoggedIn, function (req, res, next) {
  try {
    let {to_username, body} = req.params;
    let from_username = req.user.username;
    let to_user = await User.get(to_user)
    if (!to_user) {
      const err = new ExpressError("Recipient user not found", 404);
      return next(err);
    }
    let result = await Message.create({from_username, to_username, body});
    if (!result) {
      const err = new ExpressError("Error message", 400);
      return next(err);
    }
    return req.json{ result };
  } catch (err) {
    return next(err);
  }
});

/** POST/:id/read - mark message as read:
 *
 *  => {message: {id, read_at}}
 *
 * Make sure that the only the intended recipient can mark as read.
 *
 **/

router.get("/:id/read", ensureLoggedIn, async function (req, res, next) {
  try {
    let message = await Message.get(req.params.id);
    if (!message) {
      const err = new ExpressError("Message not found", 400);
      return next(err);
    }
    let username = req.user.username;
    if (username != message.to_user.username) {
      const err = new ExpressError("Unauthorized to update message", 400);
      return next(err);
    }
    let result = await Message.markRead(req.params.id);
    return res.json({ result });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
