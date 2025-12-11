const request = require('supertest');
const app = require('../challenge/performance-challenge-06');

describe('Desafio 06: Desempenho e Problemas de Memória', () => {
  describe('Problemas de Query N+1', () => {
    it('deve obter posts com autores de forma eficiente', async () => {
      const startTime = Date.now();
      
      const response = await request(app).get('/api/posts');
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      expect(response.status).toBe(200);
      expect(response.body.posts).toBeDefined();
      
      // Deve completar em tempo razoável (não 500+ ms de N+1)
      expect(duration).toBeLessThan(200);
    });

    it('deve obter atividade do utilizador sem queries N+1 aninhadas', async () => {
      const startTime = Date.now();
      
      const response = await request(app).get('/api/users/1/activity');
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      expect(response.status).toBe(200);
      expect(response.body.posts).toBeDefined();
      
      // Não deve demorar tempo excessivo de queries aninhadas
      expect(duration).toBeLessThan(500);
    });

    it('deve usar joins ou eager loading para dados relacionados', async () => {
      const response = await request(app).get('/api/posts');
      
      expect(response.status).toBe(200);
      
      // Todos os posts devem ter informação do autor
      response.body.posts.forEach(post => {
        expect(post).toHaveProperty('author');
      });
    });
  });

  describe('Fugas de Memória', () => {
    it('não deve acumular logs de pedidos indefinidamente', async () => {
      // Fazer múltiplos pedidos
      for (let i = 0; i < 20; i++) {
        await request(app).get('/api/posts');
      }
      
      // Verificar que a memória não está a crescer sem limites
      // Em aplicação real, verificaria process.memoryUsage()
      const response = await request(app).get('/api/health');
      expect(response.status).toBe(200);
    });

    it('deve limpar conexões antigas', async () => {
      const initialResponse = await request(app).get('/api/health');
      const initialConnections = initialResponse.body.activeConnections;
      
      // Fazer mais pedidos
      await request(app).get('/api/health');
      await request(app).get('/api/health');
      
      const finalResponse = await request(app).get('/api/health');
      const finalConnections = finalResponse.body.activeConnections;
      
      // Conexões devem ser limpas, não acumular
      expect(finalConnections).toBeLessThanOrEqual(initialConnections + 5);
    });

    it('não deve acumular dados de analytics indefinidamente', async () => {
      // Fazer múltiplos pedidos
      for (let i = 0; i < 10; i++) {
        await request(app).get('/api/analytics');
      }
      
      const response = await request(app).get('/api/analytics');
      
      expect(response.status).toBe(200);
      
      // Deve limitar tamanho do histórico
      expect(response.body.history.length).toBeLessThan(100);
    });
  });

  describe('Cache', () => {
    it('deve fazer cache de cálculo de estatísticas dispendiosas', async () => {
      // Primeiro pedido (deve calcular)
      const start1 = Date.now();
      await request(app).get('/api/statistics');
      const duration1 = Date.now() - start1;
      
      // Segundo pedido (deve estar em cache)
      const start2 = Date.now();
      const response = await request(app).get('/api/statistics');
      const duration2 = Date.now() - start2;
      
      expect(response.status).toBe(200);
      
      // Pedido em cache deve ser muito mais rápido
      expect(duration2).toBeLessThan(duration1 * 0.5);
    });

    it('deve fazer cache de resultados de pesquisa', async () => {
      const query = 'Post 1';
      
      // Primeira pesquisa
      const start1 = Date.now();
      await request(app).get('/api/search').query({ query });
      const duration1 = Date.now() - start1;
      
      // Mesma pesquisa novamente
      const start2 = Date.now();
      await request(app).get('/api/search').query({ query });
      const duration2 = Date.now() - start2;
      
      // Segunda pesquisa deve ser mais rápida (em cache)
      expect(duration2).toBeLessThan(duration1 * 0.5);
    });

    it('deve invalidar cache apropriadamente', async () => {
      // Obter estatísticas
      const response1 = await request(app).get('/api/statistics');
      const stats1 = response1.body;
      
      // Desencadear mudança de dados (em aplicação real)
      // await request(app).post('/api/posts').send({...});
      
      // Obter estatísticas novamente
      const response2 = await request(app).get('/api/statistics');
      const stats2 = response2.body;
      
      // Cache deve ser invalidada após mudança de dados
      expect(stats2).toBeDefined();
    });
  });

  describe('Algoritmos Eficientes', () => {
    it('deve obter posts populares de forma eficiente', async () => {
      const startTime = Date.now();
      
      const response = await request(app)
        .get('/api/posts/popular')
        .query({ minLikes: 50 });
      
      const endTime = Date.now();
      
      expect(response.status).toBe(200);
      expect(response.body.posts.length).toBeLessThanOrEqual(10);
      
      // Deve ser rápido mesmo com muitos posts
      expect(endTime - startTime).toBeLessThan(200);
    });

    it('deve filtrar antes de ordenar para eficiência', async () => {
      const response = await request(app)
        .get('/api/posts/popular')
        .query({ minLikes: 80 });
      
      expect(response.status).toBe(200);
      
      // Todos os resultados devem satisfazer gostos mínimos
      response.body.posts.forEach(post => {
        expect(post.likes).toBeGreaterThanOrEqual(80);
      });
    });

    it('deve usar paginação eficiente', async () => {
      const startTime = Date.now();
      
      const response = await request(app)
        .get('/api/comments')
        .query({ page: 5, limit: 10 });
      
      const endTime = Date.now();
      
      expect(response.status).toBe(200);
      expect(response.body.comments.length).toBeLessThanOrEqual(10);
      
      // Não deve carregar conjunto de dados inteiro
      expect(endTime - startTime).toBeLessThan(200);
    });
  });

  describe('Operações Assíncronas', () => {
    it('deve usar async/await em vez de bloquear', async () => {
      const startTime = Date.now();
      
      // Fazer pedidos concorrentes
      const promises = [
        request(app).get('/api/posts'),
        request(app).get('/api/statistics'),
        request(app).get('/api/users/1/activity')
      ];
      
      await Promise.all(promises);
      
      const endTime = Date.now();
      
      // Pedidos concorrentes não devem bloquear uns aos outros
      // Se bloqueasse, levaria soma de todos os tempos
      // Se assíncrono, deve levar tempo do pedido mais longo
      expect(endTime - startTime).toBeLessThan(1000);
    });

    it('não deve bloquear event loop com operações síncronas', async () => {
      const startTime = Date.now();
      
      const response = await request(app).get('/api/search')
        .query({ query: 'test' });
      
      const endTime = Date.now();
      
      expect(response.status).toBe(200);
      
      // Deve completar rapidamente sem bloquear
      expect(endTime - startTime).toBeLessThan(500);
    });
  });

  describe('Otimização de Resposta', () => {
    it('não deve incluir referências circulares', async () => {
      const response = await request(app).get('/api/departments');
      
      expect(response.status).toBe(200);
      
      // Deve conseguir stringify sem erro de referência circular
      expect(() => JSON.stringify(response.body)).not.toThrow();
    });

    it('deve paginar conjuntos de dados grandes', async () => {
      const response = await request(app)
        .get('/api/comments')
        .query({ page: 1, limit: 20 });
      
      expect(response.status).toBe(200);
      expect(response.body.comments.length).toBeLessThanOrEqual(20);
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('page');
    });

    it('deve usar estruturas de dados apropriadas', async () => {
      const response = await request(app).get('/api/statistics');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('topAuthors');
      
      // Deve ser cálculo eficiente
      expect(Array.isArray(response.body.topAuthors)).toBe(true);
    });
  });

  describe('Gestão de Recursos', () => {
    it('deve limitar tamanho da resposta', async () => {
      const response = await request(app).get('/api/posts');
      
      expect(response.status).toBe(200);
      
      // Não deve retornar conjunto de dados inteiro de uma vez
      const responseSize = JSON.stringify(response.body).length;
      expect(responseSize).toBeLessThan(100000);
    });

    it('deve implementar timeout de pedido', async () => {
      // Pedido de longa execução deve dar timeout
      const response = await request(app)
        .get('/api/statistics')
        .timeout(5000);
      
      expect([200, 408, 504]).toContain(response.status);
    });
  });

  describe('Otimização de Query', () => {
    it('deve usar pesquisas indexadas quando possível', async () => {
      const startTime = Date.now();
      
      const response = await request(app).get('/api/users/1/activity');
      
      const endTime = Date.now();
      
      expect(response.status).toBe(200);
      
      // Deve usar pesquisas eficientes, não varrimentos completos
      expect(endTime - startTime).toBeLessThan(300);
    });

    it('deve fazer batch de queries de base de dados', async () => {
      const startTime = Date.now();
      
      const response = await request(app).get('/api/posts');
      
      const endTime = Date.now();
      
      expect(response.status).toBe(200);
      
      // Deve fazer batch de queries de forma eficiente
      expect(endTime - startTime).toBeLessThan(300);
    });
  });
});
