const app = require('../index');
const request = require('supertest');

test('GET /health returns {"status":"ok"}', async () => {
  const response = await request(app).get('/health');
  expect(response.status).toBe(200);
  expect(response.body).toEqual({ status: 'ok' });
});