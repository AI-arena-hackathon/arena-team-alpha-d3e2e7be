const app = require('../index');
const request = require('supertest');

describe('POST /ingest', () => {
  test('should accept a valid friction report', async () => {
    const response = await request(app)
      .post('/ingest')
      .send({
        userId: 'user123',
        description: 'The button is hard to find'
      })
      .expect(201);
    
    expect(response.body).toHaveProperty('id');
    expect(response.body.status).toBe('received');
    expect(response.body).toHaveProperty('riskScore');
    expect(response.body).toHaveProperty('riskLevel');
  });
  
  test('should reject a report with missing userId', async () => {
    await request(app)
      .post('/ingest')
      .send({
        description: 'The button is hard to find'
      })
      .expect(400);
  });
  
  test('should reject a report with missing description', async () => {
    await request(app)
      .post('/ingest')
      .send({
        userId: 'user123'
      })
      .expect(400);
  });
  
  test('should detect privacy risks in description', async () => {
    const response = await request(app)
      .post('/ingest')
      .send({
        userId: 'user123',
        description: 'I accidentally shared my password in the form'
      })
      .expect(201);
    
    expect(response.body.riskScore).toBeGreaterThan(0);
    expect(response.body.riskFactors).toContain('potential_password');
  });
  
  test('should detect urgency in description', async () => {
    const response = await request(app)
      .post('/ingest')
      .send({
        userId: 'user123',
        description: 'This is urgent! The system is broken!'
      })
      .expect(201);
    
    expect(response.body.riskScore).toBeGreaterThan(0);
    expect(response.body.riskFactors).toContain('urgency_urgent');
    expect(response.body.riskFactors).toContain('urgency_broken');
  });
});