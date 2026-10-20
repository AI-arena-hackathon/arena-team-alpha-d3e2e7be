const express = require('express');
const ingestionService = require('./services/ingestionService');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON bodies
app.use(express.json());

// Health endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Ingestion API endpoint for friction reports
app.post('/ingest', async (req, res) => {
  const report = req.body;
  
  // Basic validation
  if (!report || typeof report !== 'object') {
    return res.status(400).json({ error: 'Invalid report format' });
  }
  
  // Required fields
  const requiredFields = ['userId', 'description'];
  for (const field of requiredFields) {
    if (!report[field]) {
      return res.status(400).json({ error: `Missing required field: ${field}` });
    }
  }
  
  // Add timestamp and unique ID
  const reportWithMeta = {
    ...report,
    id: Math.random().toString(36).substr(2, 9),
    timestamp: new Date().toISOString(),
    processed: false
  };
  
  // Simple risk scoring (rule-based)
  let riskScore = 0;
  const riskFactors = [];
  
  // Check for potential privacy issues
  const privacyKeywords = ['password', 'ssn', 'social security', 'credit card'];
  const descriptionLower = report.description.toLowerCase();
  for (const keyword of privacyKeywords) {
    if (descriptionLower.includes(keyword)) {
      riskScore += 3;
      riskFactors.push(`potential_${keyword.replace(' ', '_')}`);
    }
  }
  
  // Check for urgency indicators
  const urgencyKeywords = ['urgent', 'asap', 'immediately', 'critical', 'broken'];
  for (const keyword of urgencyKeywords) {
    if (descriptionLower.includes(keyword)) {
      riskScore += 2;
      riskFactors.push(`urgency_${keyword}`);
    }
  }
  
  // Add risk assessment to report
  reportWithMeta.riskScore = riskScore;
  reportWithMeta.riskFactors = riskFactors;
  reportWithMeta.riskLevel = riskScore >= 5 ? 'high' : riskScore >= 2 ? 'medium' : 'low';
  
  try {
    // Process the report with retry mechanisms (storage and notification)
    const result = await ingestionService.processReport(reportWithMeta);
    
    if (!result.success) {
      // If processing failed after retries, return 500
      return res.status(500).json({ error: result.error });
    }
    
    // Return success response (same format as before)
    res.status(201).json({
      id: reportWithMeta.id,
      status: 'received',
      riskScore: reportWithMeta.riskScore,
      riskLevel: reportWithMeta.riskLevel,
      riskFactors: reportWithMeta.riskFactors
    });
  } catch (error) {
    // Handle any unexpected errors
    console.error('Unexpected error in ingestion API:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Only listen when run directly (not when imported as module)
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Friction-Track backend running on port ${PORT}`);
  });
}

module.exports = app;