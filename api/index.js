const app = require('../server/dist/app').default;
const { connectDatabase } = require('../server/dist/config/db.config');

let isConnected = false;

module.exports = async (req, res) => {
  if (!isConnected) {
    try {
      await connectDatabase();
      isConnected = true;
    } catch (err) {
      console.error('Vercel Serverless Database connection error:', err);
    }
  }
  return app(req, res);
};
