const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Only listen when run directly (not when imported as module)
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Friction-Track backend running on port ${PORT}`);
  });
}

module.exports = app;