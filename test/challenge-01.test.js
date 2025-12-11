const request = require('supertest');
const app = require('../challenge/auth-challenge-01');

describe('Desafio 01: Sistema de Autenticação', () => {
  describe('POST /api/register', () => {
    it('deve registar um novo utilizador', async () => {
      const response = await request(app)
        .post('/api/register')
        .send({
          username: 'testuser',
          password: 'password123',
          email: 'test@example.com'
        });
      
      expect(response.status).toBe(201);
      expect(response.body.message).toBe('User registered successfully');
    });

    it('deve impedir o registo de utilizador duplicado', async () => {
      await request(app)
        .post('/api/register')
        .send({
          username: 'duplicate',
          password: 'pass123',
          email: 'dup1@example.com'
        });
      
      const response = await request(app)
        .post('/api/register')
        .send({
          username: 'duplicate',
          password: 'pass456',
          email: 'dup2@example.com'
        });
      
      expect(response.status).toBe(409);
    });

    it('deve validar campos obrigatórios', async () => {
      const response = await request(app)
        .post('/api/register')
        .send({
          username: 'testuser'
        });
      
      expect(response.status).toBe(400);
    });

    it('não deve armazenar palavras-passe em texto simples', async () => {
      await request(app)
        .post('/api/register')
        .send({
          username: 'secureuser',
          password: 'mypassword',
          email: 'secure@example.com'
        });
      
      const loginResponse = await request(app)
        .post('/api/login')
        .send({
          username: 'secureuser',
          password: 'mypassword'
        });
      
      expect(loginResponse.status).toBe(200);
      // A palavra-passe deve estar encriptada, não em texto simples
    });
  });

  describe('POST /api/login', () => {
    beforeEach(async () => {
      await request(app)
        .post('/api/register')
        .send({
          username: 'logintest',
          password: 'testpass',
          email: 'login@example.com'
        });
    });

    it('deve fazer login com credenciais válidas', async () => {
      const response = await request(app)
        .post('/api/login')
        .send({
          username: 'logintest',
          password: 'testpass'
        });
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body.user.username).toBe('logintest');
    });

    it('deve rejeitar credenciais inválidas', async () => {
      const response = await request(app)
        .post('/api/login')
        .send({
          username: 'logintest',
          password: 'wrongpass'
        });
      
      expect(response.status).toBe(401);
    });

    it('deve incluir expiração do token', async () => {
      const response = await request(app)
        .post('/api/login')
        .send({
          username: 'logintest',
          password: 'testpass'
        });
      
      const jwt = require('jsonwebtoken');
      const decoded = jwt.decode(response.body.token);
      
      expect(decoded).toHaveProperty('exp');
    });
  });

  describe('GET /api/profile', () => {
    let token;

    beforeEach(async () => {
      await request(app)
        .post('/api/register')
        .send({
          username: 'profileuser',
          password: 'profilepass',
          email: 'profile@example.com'
        });
      
      const loginResponse = await request(app)
        .post('/api/login')
        .send({
          username: 'profileuser',
          password: 'profilepass'
        });
      
      token = loginResponse.body.token;
    });

    it('deve retornar perfil com token válido', async () => {
      const response = await request(app)
        .get('/api/profile')
        .set('Authorization', `Bearer ${token}`);
      
      expect(response.status).toBe(200);
      expect(response.body.user.username).toBe('profileuser');
    });

    it('não deve expor a palavra-passe no perfil', async () => {
      const response = await request(app)
        .get('/api/profile')
        .set('Authorization', `Bearer ${token}`);
      
      expect(response.status).toBe(200);
      expect(response.body.user).not.toHaveProperty('password');
    });

    it('deve rejeitar pedido sem cabeçalho de autorização', async () => {
      const response = await request(app)
        .get('/api/profile');
      
      expect(response.status).toBe(401);
    });

    it('deve rejeitar token inválido', async () => {
      const response = await request(app)
        .get('/api/profile')
        .set('Authorization', 'Bearer invalid-token-here');
      
      expect(response.status).toBe(401);
    });
  });

  describe('DELETE /api/users/:id', () => {
    let token;
    let userId;

    beforeEach(async () => {
      const registerResponse = await request(app)
        .post('/api/register')
        .send({
          username: 'deleteuser',
          password: 'deletepass',
          email: 'delete@example.com'
        });
      
      const loginResponse = await request(app)
        .post('/api/login')
        .send({
          username: 'deleteuser',
          password: 'deletepass'
        });
      
      token = loginResponse.body.token;
      userId = loginResponse.body.user.id;
    });

    it('deve requerer autenticação', async () => {
      const response = await request(app)
        .delete(`/api/users/${userId}`);
      
      expect(response.status).toBe(401);
    });

    it('deve efetivamente eliminar o utilizador', async () => {
      await request(app)
        .delete(`/api/users/${userId}`)
        .set('Authorization', `Bearer ${token}`);
      
      const profileResponse = await request(app)
        .get('/api/profile')
        .set('Authorization', `Bearer ${token}`);
      
      expect(profileResponse.status).toBe(404);
    });
  });
});
