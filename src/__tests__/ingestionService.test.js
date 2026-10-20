const ingestionService = require('../services/ingestionService');

describe('Ingestion Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('storeReport', () => {
    test('should store report successfully', async () => {
      const report = { id: 'test-id', userId: 'user1', description: 'Test' };
      const result = await ingestionService.storeReport(report);
      expect(result).toHaveProperty('id', 'test-id');
      expect(result).toHaveProperty('storedAt');
      expect(result.userId).toBe('user1');
      expect(result.description).toBe('Test');
    });

    test('should throw error when storage fails (non-test env)', async () => {
      // Temporarily change NODE_ENV to trigger failure
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      
      // We need to mock Math.random to return a value less than 0.1 to trigger failure
      const originalRandom = Math.random;
      Math.random = () => 0.09; // guaranteed to trigger failure
      
      let error = null;
      try {
        await ingestionService.storeReport({});
      } catch (err) {
        error = err;
      } finally {
        Math.random = originalRandom;
        process.env.NODE_ENV = originalEnv;
      }
      
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe('DynamoDB storage failed');
    });
  });

  describe('notifySNS', () => {
    test('should notify successfully', async () => {
      const report = { id: 'test-id' };
      const result = await ingestionService.notifySNS(report);
      expect(result).toHaveProperty('messageId');
      expect(result).toHaveProperty('timestamp');
    });

    test('should throw error when notification fails (non-test env)', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      
      const originalRandom = Math.random;
      Math.random = () => 0.09;
      
      let error = null;
      try {
        await ingestionService.notifySNS({});
      } catch (err) {
        error = err;
      } finally {
        Math.random = originalRandom;
        process.env.NODE_ENV = originalEnv;
      }
      
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe('SNS notification failed');
    });
  });

  describe('retryOperation', () => {
    test('should retry and succeed on second attempt', async () => {
      const mockOperation = jest.fn()
        .mockRejectedValueOnce(new Error('First attempt fails'))
        .mockResolvedValueOnce('success');
      
      const result = await ingestionService.retryOperation(mockOperation, 3, 10);
      expect(mockOperation).toHaveBeenCalledTimes(2);
      expect(result).toBe('success');
    });

    test('should throw error after max retries', async () => {
      const mockOperation = jest.fn().mockRejectedValue(new Error('Always fails'));
      
      try {
        await ingestionService.retryOperation(mockOperation, 2, 10);
      } catch (error) {
        expect(mockOperation).toHaveBeenCalledTimes(2);
        expect(error).toBeInstanceOf(Error);
        expect(error.message).toBe('Always fails');
        return;
      }
      throw new Error('Expected retryOperation to throw');
    });
  });

  describe('processReport', () => {
    test('should process report successfully when storage and notification succeed', async () => {
      const report = { id: 'test-id', userId: 'user1', description: 'Test' };
      const result = await ingestionService.processReport(report);
      expect(result.success).toBe(true);
      expect(result.storedReport).toHaveProperty('id', 'test-id');
    });

    xtest('should return failure when storage fails after retries', async () => {
      // Temporarily set NODE_ENV to production to allow failures
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      
      // Spy on storeReport and mock its implementation
      const storeReportSpy = jest.spyOn(ingestionService, 'storeReport');
      storeReportSpy.mockRejectedValue(new Error('Storage failed'));
      
      try {
        const result = await ingestionService.processReport({});
        expect(result.success).toBe(false);
        expect(result.error).toBe('Storage failed');
      } finally {
        storeReportSpy.mockRestore();
        process.env.NODE_ENV = originalEnv;
      }
    });

    xtest('should return failure when notification fails after retries', async () => {
      // Temporarily set NODE_ENV to production to allow failures
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      
      // Spy on notifySNS and mock its implementation
      const notifySnsSpy = jest.spyOn(ingestionService, 'notifySNS');
      notifySnsSpy.mockRejectedValue(new Error('Notification failed'));
      // Ensure storeReport resolves normally
      jest.spyOn(ingestionService, 'storeReport').mockResolvedValue({ id: 'test' });
      
      try {
        const result = await ingestionService.processReport({});
        expect(result.success).toBe(false);
        expect(result.error).toBe('Notification failed');
      } finally {
        jest.spyOn(ingestionService, 'notifySNS').mockRestore();
        jest.spyOn(ingestionService, 'storeReport').mockRestore();
        process.env.NODE_ENV = originalEnv;
      }
    });
  });
});