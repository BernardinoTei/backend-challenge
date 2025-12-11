const request = require('supertest');
const app = require('../challenge/middleware-challenge-03');

describe('Desafio 03: Middleware e Validação de Pedidos', () => {
  describe('Ordem do Middleware', () => {
    it('deve tratar erros adequadamente', async () => {
      // Forçar um erro enviando JSON mal formado
      const response = await request(app)
        .post('/api/products')
        .set('Content-Type', 'application/json')
        .set('x-api-key', 'admin-key-123')
        .send('{"invalid": json}');
      
      expect([400, 500]).toContain(response.status);
    });

    it('deve registar pedidos sem falhar', async () => {
      // Pedido sem corpo não deve quebrar o middleware de registo
      const response = await request(app)
        .get('/api/public');
      
      expect(response.status).toBe(200);
    });
  });

  describe('Autenticação por Chave API', () => {
    it('deve permitir acesso com chave API válida', async () => {
      const response = await request(app)
        .get('/api/protected')
        .set('x-api-key', 'user-key-456');
      
      expect(response.status).toBe(200);
      expect(response.body.user).toBe('user1');
    });

    it('deve rejeitar chave API em falta', async () => {
      const response = await request(app)
        .get('/api/protected');
      
      expect(response.status).toBe(401);
    });

    it('deve rejeitar chave API inválida', async () => {
      const response = await request(app)
        .get('/api/protected')
        .set('x-api-key', 'invalid-key');
      
      expect(response.status).toBe(401);
    });

    it('não deve chamar next() após enviar resposta de erro', async () => {
      const response = await request(app)
        .get('/api/protected')
        .set('x-api-key', 'invalid-key');
      
      // Deve obter exatamente uma resposta, não múltiplas
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Autorização Baseada em Funções', () => {
    it('deve permitir acesso de administrador com função de admin', async () => {
      const response = await request(app)
        .get('/api/admin')
        .set('x-api-key', 'admin-key-123');
      
      expect(response.status).toBe(200);
      expect(response.body.allUsers).toBeDefined();
    });

    it('deve negar acesso de administrador a utilizadores regulares', async () => {
      const response = await request(app)
        .get('/api/admin')
        .set('x-api-key', 'user-key-456');
      
      expect(response.status).toBe(403);
    });

    it('deve tratar objeto de utilizador em falta de forma elegante', async () => {
      const response = await request(app)
        .get('/api/admin')
        .set('x-api-key', 'invalid-key');
      
      // Não deve falhar, deve retornar 401 ou 403
      expect([401, 403, 500]).toContain(response.status);
    });
  });

  describe('Validação de Entrada', () => {
    it('deve criar produto com entrada válida', async () => {
      const response = await request(app)
        .post('/api/products')
        .set('x-api-key', 'admin-key-123')
        .send({
          name: 'Test Product',
          price: 99.99,
          stock: 10
        });
      
      expect(response.status).toBe(201);
      expect(response.body.name).toBe('Test Product');
      expect(response.body.price).toBe(99.99);
      expect(response.body.stock).toBe(10);
    });

    it('deve rejeitar campos obrigatórios em falta', async () => {
      const response = await request(app)
        .post('/api/products')
        .set('x-api-key', 'admin-key-123')
        .send({
          name: 'Incomplete Product'
        });
      
      expect(response.status).toBe(400);
    });

    it('deve validar que o preço é um número', async () => {
      const response = await request(app)
        .post('/api/products')
        .set('x-api-key', 'admin-key-123')
        .send({
          name: 'Product',
          price: 'not-a-number',
          stock: 10
        });
      
      expect(response.status).toBe(400);
    });

    it('deve validar que o stock é um número positivo', async () => {
      const response = await request(app)
        .post('/api/products')
        .set('x-api-key', 'admin-key-123')
        .send({
          name: 'Product',
          price: 50,
          stock: -5
        });
      
      expect(response.status).toBe(400);
    });

    it('não deve criar produto com valores NaN', async () => {
      const response = await request(app)
        .post('/api/products')
        .set('x-api-key', 'admin-key-123')
        .send({
          name: 'Product',
          price: 'invalid',
          stock: 'invalid'
        });
      
      if (response.status === 201) {
        expect(response.body.price).not.toBeNaN();
        expect(response.body.stock).not.toBeNaN();
      } else {
        expect(response.status).toBe(400);
      }
    });
  });

  describe('Operações em Lote', () => {
    it('deve eliminar múltiplos produtos', async () => {
      const response = await request(app)
        .delete('/api/products/batch')
        .set('x-api-key', 'admin-key-123')
        .send({
          ids: [1, 2, 3]
        });
      
      expect(response.status).toBe(200);
      expect(response.body.deletedIds).toHaveLength(3);
    });

    it('deve validar array de ids', async () => {
      const response = await request(app)
        .delete('/api/products/batch')
        .set('x-api-key', 'admin-key-123')
        .send({
          ids: 'not-an-array'
        });
      
      expect([400, 500]).toContain(response.status);
    });

    it('deve requerer função de administrador', async () => {
      const response = await request(app)
        .delete('/api/products/batch')
        .set('x-api-key', 'user-key-456')
        .send({
          ids: [1, 2, 3]
        });
      
      expect(response.status).toBe(403);
    });
  });

  describe('Upload de Ficheiro', () => {
    it('deve validar que o objeto de ficheiro existe', async () => {
      const response = await request(app)
        .post('/api/upload')
        .set('x-api-key', 'user-key-456')
        .send({});
      
      expect([400, 500]).toContain(response.status);
    });

    it('deve validar o tamanho do ficheiro', async () => {
      const response = await request(app)
        .post('/api/upload')
        .set('x-api-key', 'user-key-456')
        .send({
          file: {
            name: 'large.pdf',
            size: 20000000
          }
        });
      
      expect(response.status).toBe(400);
    });

    it('deve aceitar ficheiro válido', async () => {
      const response = await request(app)
        .post('/api/upload')
        .set('x-api-key', 'user-key-456')
        .send({
          file: {
            name: 'document.pdf',
            size: 5000000
          }
        });
      
      expect(response.status).toBe(200);
    });
  });

  describe('Cadeia de Middleware Assíncrono', () => {
    it('deve tratar middleware assíncrono adequadamente', async () => {
      const response = await request(app)
        .post('/api/process')
        .set('x-api-key', 'user-key-456')
        .send({});
      
      // Deve obter exatamente uma resposta
      expect(response.status).toBe(200);
      expect(response.body.message).toBeDefined();
    });

    it('não deve enviar múltiplas respostas', async () => {
      // Fazer múltiplos pedidos para testar condições de corrida
      const promises = Array(10).fill(null).map(() =>
        request(app)
          .post('/api/process')
          .set('x-api-key', 'user-key-456')
          .send({})
      );
      
      const responses = await Promise.all(promises);
      
      // Todas as respostas devem ser válidas (não erro 'headers already sent')
      responses.forEach(response => {
        expect([200, 429]).toContain(response.status);
      });
    });
  });

  describe('Tratamento de Erros', () => {
    it('deve capturar e tratar erros adequadamente', async () => {
      // Tentar causar um erro
      const response = await request(app)
        .post('/api/products')
        .set('x-api-key', 'admin-key-123')
        .set('Content-Type', 'application/json')
        .send('invalid json');
      
      expect([400, 500]).toContain(response.status);
      expect(response.body).toHaveProperty('error');
    });

    it('não deve falhar com erros inesperados', async () => {
      const response = await request(app)
        .post('/api/upload')
        .set('x-api-key', 'user-key-456')
        .send({ file: null });
      
      expect([400, 500]).toContain(response.status);
    });
  });
});
