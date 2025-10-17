// Vercel serverless function entry point
import('../dist/index.js').then(({ default: app }) => {
  module.exports = app;
}).catch(err => {
  console.error('Failed to load server:', err);
  module.exports = (req, res) => {
    res.status(500).json({ error: 'Server initialization failed' });
  };
});

