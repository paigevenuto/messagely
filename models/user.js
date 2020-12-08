const ExpressError = require("../expressError");
const db = require("../db");
const bcrypt = require("bcrypt");
const { BCRYPT_WORK_FACTOR } = require("../config");

/** User class for message.ly */

/** User of the site. */

class User {
  /** register new user -- returns
   *    {username, password, first_name, last_name, phone}
   */

  static async register({ username, password, first_name, last_name, phone }) {
    let pass_hash = await bcrypt.hash(password, BCRYPT_WORK_FACTOR);
    let results = await db.query(
      `
      INSERT INTO users (username, password, first_name, last_name, phone, join_at, last_login_at)
      VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING username, password, first_name, last_name, phone
      `,
      [username, pass_hash, first_name, last_name, phone]
    );
    return results.rows[0];
  }

  /** Authenticate: is this username/password valid? Returns boolean. */

  static async authenticate(username, password) {
    let hashed_pass = await db.query(
      `
            SELECT password FROM users
            WHERE username=$1
            `,
      [username]
    );
    return await bcrypt.compare(password, hashed_pass.rows[0].password);
  }

  /** Update last_login_at for user */

  static async updateLoginTimestamp(username) {
    let results = await db.query(
      `
            UPDATE users SET last_login_at=CURRENT_TIMESTAMP WHERE username=$1
            `,
      [username]
    );
    if (!results.rowCount) {
      const err = new ExpressError("Not Found", 404);
      return next(err);
    }
  }

  /** All: basic info on all users:
   * [{username, first_name, last_name, phone}, ...] */

  static async all() {
    let results = await db.query(
      `
            SELECT username, first_name, last_name, phone
            FROM users
            `
    );
    return results.rows;
  }

  /** Get: get user by username
   *
   * returns {username,
   *          first_name,
   *          last_name,
   *          phone,
   *          join_at,
   *          last_login_at } */

  static async get(username) {
    let results = await db.query(
      `
            SELECT username, first_name, last_name, phone, join_at, last_login_at
            FROM users
            WHERE username=$1
            `,
      [username]
    );
    if (!results.rowCount) {
      const err = new ExpressError("Not Found", 404);
      return next(err);
    }
    return results.rows[0];
  }

  /** Return messages from this user.
   *
   * [{id, to_user, body, sent_at, read_at}]
   *
   * where to_user is
   *   {username, first_name, last_name, phone}
   */

  static async messagesFrom(username) {
    let results = await db.query(
      `
            SELECT m.id, m.to_username, m.body, m.sent_at, m.read_at, u.username, u.first_name, u.last_name, u.phone
            FROM messages AS m
            LEFT JOIN users AS u
            ON u.username = m.to_username
            WHERE from_username=$1
            `,
      [username]
    );
    results = results.rows.map(function (x) {
      return {
        id: x.id,
        to_user: {
          username: x.username,
          first_name: x.first_name,
          last_name: x.last_name,
          phone: x.phone,
        },
        body: x.body,
        sent_at: x.sent_at,
        read_at: x.read_at,
      };
    });
    return results;
  }

  /** Return messages to this user.
   *
   * [{id, from_user, body, sent_at, read_at}]
   *
   * where from_user is
   *   {id, first_name, last_name, phone}
   */

  static async messagesTo(username) {
    let results = await db.query(
      `
            SELECT m.id, m.from_username, m.body, m.sent_at, m.read_at, u.username, u.first_name, u.last_name, u.phone
            FROM messages AS m
            LEFT JOIN users AS u
            ON u.username = m.from_username
            WHERE to_username=$1
            `,
      [username]
    );
    results = results.rows.map(function (x) {
      return {
        id: x.id,
        from_user: {
          username: x.username,
          first_name: x.first_name,
          last_name: x.last_name,
          phone: x.phone,
        },
        body: x.body,
        sent_at: x.sent_at,
        read_at: x.read_at,
      };
    });
    return results;
  }
}

module.exports = User;
