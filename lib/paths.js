const path = require('path');

// Persistent storage paths. On Railway (ephemeral filesystem) point these at a
// mounted volume so the database and uploaded images survive redeploys:
//   DB_PATH=/data/drivershield.db
//   UPLOADS_DIR=/data/uploads
// Locally they default to the in-repo locations so dev needs no configuration.
const DB_PATH = process.env.DB_PATH
  ? path.resolve(process.env.DB_PATH)
  : path.join(__dirname, '..', 'db', 'drivershield.db');

const UPLOADS_DIR = process.env.UPLOADS_DIR
  ? path.resolve(process.env.UPLOADS_DIR)
  : path.join(__dirname, '..', 'public', 'uploads');

module.exports = { DB_PATH, UPLOADS_DIR };