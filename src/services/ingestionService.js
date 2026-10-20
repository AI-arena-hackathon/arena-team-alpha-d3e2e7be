// Ingestion Service for Friction-Track
// Handles storing reports and sending notifications with retry mechanisms

// Simulate DynamoDB storage with random failure for demonstration
const storeReport = async (report) => {
  // Simulate random failure (10% chance) to test retry
  // In production, this would be replaced with actual DynamoDB call
  // Skip failure in test environment to avoid flaky tests
  if (process.env.NODE_ENV === 'test') {
    // No failure in test
  } else if (Math.random() < 0.1) {
    throw new Error('DynamoDB storage failed');
  }
  
  // Simulate successful storage
  // In a real implementation, we would return the stored item with DynamoDB metadata
  return {
    id: report.id,
    ...report,
    storedAt: new Date().toISOString()
  };
};

// Simulate SNS notification with random failure for demonstration
const notifySNS = async (report) => {
  // Simulate random failure (10% chance) to test retry
  // In production, this would be replaced with actual SNS publish
  // Skip failure in test environment to avoid flaky tests
  if (process.env.NODE_ENV === 'test') {
    // No failure in test
  } else if (Math.random() < 0.1) {
    throw new Error('SNS notification failed');
  }
  
  // Simulate successful notification
  return {
    messageId: Math.random().toString(36).substr(2, 9),
    timestamp: new Date().toISOString()
  };
};

// Exponential backoff delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Retry operation with exponential backoff
const retryOperation = async (operation, maxRetries = 3, baseDelay = 100) => {
  let lastError;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (i === maxRetries - 1) {
        // Last attempt, throw the error
        throw error;
      }
      // Wait before retrying with exponential backoff
      const delayMs = baseDelay * Math.pow(2, i);
      await delay(delayMs);
    }
  }
  // This should never be reached, but just in case
  throw lastError;
};

// Process a friction report with retry mechanisms
const processReport = async (report) => {
  try {
    // Store the report with retry
    const storedReport = await retryOperation(() => storeReport(report));
    
    // Notify via SNS with retry
    await retryOperation(() => notifySNS(storedReport));
    
    return {
      success: true,
      storedReport
    };
  } catch (error) {
    // If all retries fail, return an error
    return {
      success: false,
      error: error.message
    };
  }
};

module.exports = {
  storeReport,
  notifySNS,
  retryOperation,
  processReport
};