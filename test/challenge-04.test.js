const request = require('supertest');
const app = require('../challenge/security-challenge-04');

describe('Desafio 04: Segurança e Problemas de CORS', () => {
  describe('Configuração CORS', () => {
    it('não deve permitir todas as origens com credenciais', async () => {
      const response = await request(app)
        .get('/api/articles')
        .set('Origin', 'http://evil-site.com');
      
      // Não deve permitir credenciais com origem wildcard
      const corsHeader = response.headers['access-control-allow-origin'];
      const credsHeader = response.headers['access-control-allow-credentials'];
      
      if (corsHeader === '*') {
        expect(credsHeader).toBeUndefined();
      }
    });

    it('deve permitir apenas origens específicas', async () => {
      const response = await request(app)
        .get('/api/articles')
        .set('Origin', 'http://evil-site.com');
      
      const corsHeader = response.headers['access-control-allow-origin'];
      
      // Não deve ser '*' e deve validar origem
      expect(corsHeader).not.toBe('*');
    });
  });

  describe('Cabeçalhos de Segurança', () => {
    it('deve incluir cabeçalhos de segurança', async () => {
      const response = await request(app).get('/api/articles');
      
      expect(response.headers).toHaveProperty('x-content-type-options', 'nosniff');
      expect(response.headers).toHaveProperty('x-frame-options');
      expect(response.headers).toHaveProperty('x-xss-protection');
    });

    it('deve definir Content-Security-Policy', async () => {
      const response = await request(app).get('/api/articles');
      
      expect(response.headers).toHaveProperty('content-security-policy');
    });
  });

  describe('Coerção de Tipo de Parâmetros de Query', () => {
    it('deve tratar o parâmetro published corretamente', async () => {
      // String 'false' deve ser tratada como boolean false
      const response = await request(app)
        .get('/api/articles')
        .query({ published: 'false' });
      
      expect(response.status).toBe(200);
      response.body.data.forEach(article => {
        expect(article.published).toBe(false);
      });
    });

    it('deve tratar minViews como número', async () => {
      const response = await request(app)
        .get('/api/articles')
        .query({ minViews: '100' });
      
      expect(response.status).toBe(200);
      response.body.data.forEach(article => {
        expect(article.views).toBeGreaterThanOrEqual(100);
      });
    });

    it('deve tratar paginação corretamente', async () => {
      const response = await request(app)
        .get('/api/articles')
        .query({ page: '2', limit: '2' });
      
      expect(response.status).toBe(200);
      expect(response.body.page).toBe(2);
      expect(response.body.limit).toBe(2);
      expect(response.body.data.length).toBeLessThanOrEqual(2);
    });
  });

  describe('Prevenção de Injeção SQL', () => {
    it('não deve executar código arbitrário no parâmetro sort', async () => {
      // Tentar injetar código malicioso
      const response = await request(app)
        .get('/api/articles')
        .query({ sort: 'views; process.exit()' });
      
      expect([200, 400]).toContain(response.status);
    });

    it('deve validar o campo de ordenação', async () => {
      const response = await request(app)
        .get('/api/articles')
        .query({ sort: 'invalidField' });
      
      expect([200, 400]).toContain(response.status);
    });

    it('deve ordenar de forma segura por campos válidos', async () => {
      const response = await request(app)
        .get('/api/articles')
        .query({ sort: 'views' });
      
      expect(response.status).toBe(200);
      
      // Verificar se ordenado corretamente
      for (let i = 1; i < response.body.data.length; i++) {
        expect(response.body.data[i].views).toBeGreaterThanOrEqual(
          response.body.data[i - 1].views
        );
      }
    });
  });

  describe('Prevenção de XSS', () => {
    it('deve higienizar query de pesquisa na resposta', async () => {
      const maliciousQuery = '<script>alert("xss")</script>';
      
      const response = await request(app)
        .get('/api/search')
        .query({ q: maliciousQuery });
      
      expect(response.status).toBe(200);
      // Não deve incluir tags script cruas
      expect(response.body.message).not.toContain('<script>');
    });

    it('deve higienizar HTML no conteúdo do artigo', async () => {
      const response = await request(app)
        .post('/api/articles')
        .send({
          title: 'Test',
          content: '<script>alert("xss")</script>',
          author: 'Hacker'
        });
      
      expect(response.status).toBe(201);
      // Conteúdo deve ser higienizado
      expect(response.body.content).not.toContain('<script>');
    });
  });

  describe('Prevenção de IDOR', () => {
    it('não deve expor artigos não publicados sem autorização', async () => {
      const response = await request(app).get('/api/articles/3');
      
      if (response.status === 200) {
        // Se o artigo for retornado, deve estar publicado ou o utilizador deve estar autorizado
        expect(response.body.published).toBe(true);
      } else {
        expect([403, 404]).toContain(response.status);
      }
    });

    it('deve usar igualdade estrita para comparação de ID', async () => {
      // Tentar com ID não numérico
      const response = await request(app).get('/api/articles/1abc');
      
      expect(response.status).toBe(404);
    });
  });

  describe('Prevenção de Atribuição em Massa', () => {
    it('não deve permitir atualização de campos sensíveis', async () => {
      const response = await request(app)
        .patch('/api/articles/1')
        .send({
          title: 'Updated Title',
          views: 999999, // Não deve ser atualizável
          id: 999 // Não deve ser atualizável
        });
      
      expect(response.status).toBe(200);
      expect(response.body.id).toBe(1); // ID não deve mudar
      expect(response.body.views).not.toBe(999999); // Views não devem mudar
    });

    it('deve permitir apenas campos na lista branca', async () => {
      const response = await request(app)
        .patch('/api/articles/1')
        .send({
          title: 'Safe Update',
          content: 'Safe content'
        });
      
      expect(response.status).toBe(200);
      expect(response.body.title).toBe('Safe Update');
    });
  });

  describe('Divulgação de Informação', () => {
    it('não deve expor stack traces em erros', async () => {
      // Forçar um erro
      const response = await request(app).get('/api/articles/999/comments');
      
      if (response.status === 500) {
        expect(response.body).not.toHaveProperty('stack');
      }
    });

    it('deve usar mensagens de erro genéricas', async () => {
      const response = await request(app).get('/api/articles/999/comments');
      
      if (response.status >= 400) {
        // Não deve expor detalhes internos
        expect(response.body.error).not.toContain('database');
        expect(response.body.error).not.toContain('SQL');
      }
    });
  });

  describe('Prevenção de Travessia de Caminho', () => {
    it('deve prevenir travessia de diretório', async () => {
      const response = await request(app)
        .get('/api/files/..%2F..%2F..%2Fetc%2Fpasswd');
      
      expect([400, 403, 404]).toContain(response.status);
    });

    it('deve validar nome de ficheiro', async () => {
      const response = await request(app)
        .get('/api/files/../../secret.txt');
      
      expect([400, 403, 404]).toContain(response.status);
    });

    it('deve permitir apenas nomes de ficheiro seguros', async () => {
      const response = await request(app)
        .get('/api/files/document.pdf');
      
      expect(response.status).toBe(200);
    });
  });

  describe('Prevenção de Redirecionamento Aberto', () => {
    it('não deve redirecionar para sites externos', async () => {
      const response = await request(app)
        .get('/api/redirect')
        .query({ url: 'http://evil-site.com' });
      
      expect([400, 403]).toContain(response.status);
    });

    it('deve validar URLs de redirecionamento', async () => {
      const response = await request(app)
        .get('/api/redirect')
        .query({ url: 'javascript:alert("xss")' });
      
      expect([400, 403]).toContain(response.status);
    });
  });

  describe('Segurança de Cookies', () => {
    it('deve definir flag httpOnly em cookies', async () => {
      const response = await request(app)
        .post('/api/login')
        .send({ username: 'test', password: 'test' });
      
      expect(response.status).toBe(200);
      
      const setCookie = response.headers['set-cookie'];
      if (setCookie) {
        expect(setCookie[0]).toContain('HttpOnly');
      }
    });

    it('deve definir flag secure em cookies', async () => {
      const response = await request(app)
        .post('/api/login')
        .send({ username: 'test', password: 'test' });
      
      const setCookie = response.headers['set-cookie'];
      if (setCookie) {
        expect(setCookie[0]).toContain('Secure');
      }
    });

    it('deve definir flag sameSite', async () => {
      const response = await request(app)
        .post('/api/login')
        .send({ username: 'test', password: 'test' });
      
      const setCookie = response.headers['set-cookie'];
      if (setCookie) {
        expect(setCookie[0]).toMatch(/SameSite=(Strict|Lax)/);
      }
    });
  });

  describe('Validação de Entrada', () => {
    it('deve validar comprimento do conteúdo', async () => {
      const longContent = 'a'.repeat(100000);
      
      const response = await request(app)
        .post('/api/articles')
        .send({
          title: 'Test',
          content: longContent,
          author: 'Test'
        });
      
      expect([400, 413]).toContain(response.status);
    });

    it('deve validar campos obrigatórios', async () => {
      const response = await request(app)
        .post('/api/articles')
        .send({
          title: 'Test'
        });
      
      expect(response.status).toBe(400);
    });
  });
});
