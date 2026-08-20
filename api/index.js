const path = require('path');
const app = require(path.join(__dirname, '../server/dist/app')).default;
const { connectDatabase } = require(path.join(__dirname, '../server/dist/config/db.config'));

let isConnected = false;

module.exports = async (req, res) => {
  if (!isConnected) {
    try {
      await connectDatabase();
      isConnected = true;
    } catch (err) {
      console.error('Vercel Serverless DB Error:', err);
    }
  }
  return app(req, res);
};
