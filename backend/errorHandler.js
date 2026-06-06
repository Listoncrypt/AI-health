/**
 * HealthPulse AI - Express Error Handling Middleware
 */
module.exports = (err, req, res, next) => {
  // Log the error stack for server-side debugging
  console.error('Unhandled Server Error:', err.stack || err);
  
  // Respond with a clean 500 JSON payload as requested
  res.status(500).json({ error: 'Internal server error' });
};
