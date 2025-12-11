const request = require('supertest');
const app = require('../challenge/async-challenge-02');

describe('Desafio 02: Operações Assíncronas e Condições de Corrida', () => {
  describe('GET /api/products', () => {
    it('deve retornar todos os produtos', async () => {
      const response = await request(app).get('/api/products');
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/products/:id', () => {
    it('deve retornar um produto específico', async () => {
      const response = await request(app).get('/api/products/1');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', 1);
      expect(response.body).toHaveProperty('name');
      expect(response.body).toHaveProperty('price');
    });

    it('deve tratar produto inexistente', async () => {
      const response = await request(app).get('/api/products/999');
      
      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/orders', () => {
    it('deve criar uma encomenda com sucesso', async () => {
      const response = await request(app)
        .post('/api/orders')
        .send({
          productId: 1,
          quantity: 2
        });
      
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('totalPrice');
      expect(response.body.status).toBe('pending');
    });

    it('deve impedir encomenda quando stock insuficiente', async () => {
      const response = await request(app)
        .post('/api/orders')
        .send({
          productId: 1,
          quantity: 1000
        });
      
      expect(response.status).toBe(400);
      expect(response.body.error).toMatch(/stock/i);
    });

    it('deve lidar com condição de corrida - encomendas concorrentes', async () => {
      // Obter stock inicial
      const productResponse = await request(app).get('/api/products/2');
      const initialStock = productResponse.body.stock;
      
      // Fazer 5 encomendas concorrentes de 10 itens cada
      const promises = Array(5).fill(null).map(() =>
        request(app)
          .post('/api/orders')
          .send({
            productId: 2,
            quantity: 10
          })
      );
      
      const responses = await Promise.all(promises);
      
      // Contar encomendas bem-sucedidas
      const successfulOrders = responses.filter(r => r.status === 201).length;
      
      // Obter stock final
      const finalProductResponse = await request(app).get('/api/products/2');
      const finalStock = finalProductResponse.body.stock;
      
      // O stock deve ser reduzido exatamente pelas encomendas bem-sucedidas * quantidade
      expect(finalStock).toBe(initialStock - (successfulOrders * 10));
      
      // Nem todas as encomendas devem ter sucesso se o stock for limitado
      if (initialStock < 50) {
        expect(successfulOrders).toBeLessThan(5);
      }
    });
  });

  describe('PATCH /api/products/:id/stock', () => {
    it('deve atualizar o stock do produto', async () => {
      const response = await request(app)
        .patch('/api/products/3/stock')
        .send({ stock: 100 });
      
      expect(response.status).toBe(200);
      expect(response.body.stock).toBe(100);
    });

    it('deve validar o valor do stock', async () => {
      const response = await request(app)
        .patch('/api/products/3/stock')
        .send({ stock: -10 });
      
      expect(response.status).toBe(400);
    });

    it('deve tratar produto inexistente', async () => {
      const response = await request(app)
        .patch('/api/products/999/stock')
        .send({ stock: 50 });
      
      expect(response.status).toBe(404);
    });

    it('deve aguardar corretamente operações assíncronas', async () => {
      const startTime = Date.now();
      
      await request(app)
        .patch('/api/products/1/stock')
        .send({ stock: 50 });
      
      const endTime = Date.now();
      
      // Deve demorar pelo menos 100ms devido ao simulateDbDelay
      expect(endTime - startTime).toBeGreaterThanOrEqual(100);
    });
  });

  describe('GET /api/orders/:id', () => {
    let orderId;

    beforeEach(async () => {
      const orderResponse = await request(app)
        .post('/api/orders')
        .send({
          productId: 1,
          quantity: 1
        });
      orderId = orderResponse.body.id;
    });

    it('deve retornar encomenda com detalhes do produto', async () => {
      const response = await request(app).get(`/api/orders/${orderId}`);
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id', orderId);
      expect(response.body).toHaveProperty('productName');
      expect(response.body).toHaveProperty('productPrice');
    });

    it('deve tratar encomenda inexistente', async () => {
      const response = await request(app).get('/api/orders/99999');
      
      expect(response.status).toBe(404);
    });

    it('não deve usar padrão de callback hell', async () => {
      // O teste deve completar em tempo razoável (não 150ms de callbacks aninhados)
      const startTime = Date.now();
      
      await request(app).get(`/api/orders/${orderId}`);
      
      const endTime = Date.now();
      
      // Deve usar async/await em vez de setTimeout aninhados
      expect(endTime - startTime).toBeLessThan(100);
    });
  });

  describe('DELETE /api/orders/:id', () => {
    let orderId;
    let initialStock;

    beforeEach(async () => {
      const productResponse = await request(app).get('/api/products/1');
      initialStock = productResponse.body.stock;

      const orderResponse = await request(app)
        .post('/api/orders')
        .send({
          productId: 1,
          quantity: 2
        });
      orderId = orderResponse.body.id;
    });

    it('deve cancelar encomenda e restaurar stock', async () => {
      const response = await request(app).delete(`/api/orders/${orderId}`);
      
      expect(response.status).toBe(200);
      
      // Verificar que o stock foi restaurado
      const productResponse = await request(app).get('/api/products/1');
      expect(productResponse.body.stock).toBe(initialStock);
    });

    it('deve tratar encomenda inexistente', async () => {
      const response = await request(app).delete('/api/orders/99999');
      
      expect(response.status).toBe(404);
    });

    it('deve aguardar corretamente todas as operações assíncronas', async () => {
      const startTime = Date.now();
      
      await request(app).delete(`/api/orders/${orderId}`);
      
      const endTime = Date.now();
      
      // Deve demorar pelo menos 200ms (2 chamadas simulateDbDelay)
      expect(endTime - startTime).toBeGreaterThanOrEqual(200);
    });
  });

  describe('POST /api/products/bulk-update', () => {
    it('deve atualizar múltiplos produtos', async () => {
      const response = await request(app)
        .post('/api/products/bulk-update')
        .send({
          updates: [
            { id: 1, price: 899 },
            { id: 2, stock: 100 }
          ]
        });
      
      expect(response.status).toBe(200);
      
      // Verificar que as atualizações foram aplicadas
      const product1 = await request(app).get('/api/products/1');
      const product2 = await request(app).get('/api/products/2');
      
      expect(product1.body.price).toBe(899);
      expect(product2.body.stock).toBe(100);
    });

    it('deve aguardar a conclusão de todas as promessas', async () => {
      const startTime = Date.now();
      
      await request(app)
        .post('/api/products/bulk-update')
        .send({
          updates: [
            { id: 1, price: 999 },
            { id: 2, price: 25 },
            { id: 3, price: 75 }
          ]
        });
      
      const endTime = Date.now();
      
      // Deve demorar pelo menos 100ms para todas as promessas
      expect(endTime - startTime).toBeGreaterThanOrEqual(100);
    });
  });
});
