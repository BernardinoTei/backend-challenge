const request = require('supertest');
const app = require('../challenge/rest-challenge-05');

describe('Desafio 05: Design de REST API e Métodos HTTP', () => {
  describe('Correção de Métodos HTTP', () => {
    it('deve usar GET para obter tarefas, não POST', async () => {
      // Implementação atual usa POST
      const postResponse = await request(app)
        .post('/api/getTasks')
        .send({ status: 'pending' });
      
      // Deve usar GET em vez disso
      const getResponse = await request(app)
        .get('/api/tasks')
        .query({ status: 'pending' });
      
      expect([200, 404]).toContain(getResponse.status);
    });

    it('deve usar POST/PATCH para completar tarefas, não GET', async () => {
      // Implementação atual usa GET (errado!)
      const response = await request(app)
        .get('/api/tasks/1/complete');
      
      // Não deve permitir modificação de estado via GET
      expect([405, 404]).toContain(response.status);
    });

    it('deve usar PUT para substituição completa, não POST', async () => {
      const response = await request(app)
        .put('/api/tasks/1')
        .send({
          title: 'New Title',
          status: 'pending',
          priority: 'high',
          assignee: 'Alice'
        });
      
      expect([200, 404]).toContain(response.status);
    });

    it('deve usar PATCH para atualizações parciais, não PUT', async () => {
      const response = await request(app)
        .patch('/api/tasks/1')
        .send({
          priority: 'urgent'
        });
      
      expect(response.status).toBe(200);
      
      // Deve atualizar apenas prioridade, não substituir objeto inteiro
      expect(response.body.task).toHaveProperty('title');
      expect(response.body.task).toHaveProperty('status');
    });
  });

  describe('Códigos de Estado', () => {
    it('deve retornar 201 para criação bem-sucedida', async () => {
      const response = await request(app)
        .post('/api/tasks')
        .send({
          title: 'New Task',
          priority: 'medium',
          assignee: 'Charlie'
        });
      
      expect(response.status).toBe(201);
    });

    it('deve retornar 404 para recurso inexistente', async () => {
      const response = await request(app)
        .get('/api/tasks/999');
      
      expect(response.status).toBe(404);
    });

    it('deve retornar 204 para eliminação bem-sucedida sem conteúdo', async () => {
      // Primeiro criar uma tarefa
      const createResponse = await request(app)
        .post('/api/tasks')
        .send({
          title: 'Task to delete',
          assignee: 'Test'
        });
      
      const taskId = createResponse.body.id;
      
      // Eliminá-la
      const deleteResponse = await request(app)
        .delete(`/api/tasks/${taskId}`);
      
      expect(deleteResponse.status).toBe(204);
      expect(deleteResponse.body).toEqual({});
    });

    it('deve retornar 200 para atualização bem-sucedida', async () => {
      const response = await request(app)
        .patch('/api/tasks/1')
        .send({
          status: 'in-progress'
        });
      
      expect(response.status).toBe(200);
    });
  });

  describe('Consistência de Formato de Resposta', () => {
    it('deve usar formato de resposta consistente para listas', async () => {
      const response1 = await request(app).get('/api/tasks');
      const response2 = await request(app)
        .get('/api/tasks')
        .query({ status: 'pending' });
      
      // Ambos devem ter a mesma estrutura
      expect(Array.isArray(response1.body) === Array.isArray(response2.body)).toBe(true);
    });

    it('deve encapsular recursos únicos de forma consistente', async () => {
      const response = await request(app).get('/api/tasks/1');
      
      expect(response.status).toBe(200);
      // Deve ter encapsulamento consistente
      expect(response.body).toHaveProperty('data');
    });

    it('deve usar formato de erro consistente', async () => {
      const response1 = await request(app).get('/api/tasks/999');
      const response2 = await request(app).delete('/api/tasks/999');
      
      // Ambos os erros devem ter a mesma estrutura
      expect(response1.body).toHaveProperty('error');
      expect(response2.body).toHaveProperty('error');
    });
  });

  describe('Idempotência', () => {
    it('deve tornar pedidos GET idempotentes', async () => {
      const response1 = await request(app).get('/api/tasks/1');
      const response2 = await request(app).get('/api/tasks/1');
      
      expect(response1.body).toEqual(response2.body);
    });

    it('deve tornar pedidos PUT idempotentes', async () => {
      const updateData = {
        title: 'Updated Task',
        status: 'completed',
        priority: 'high',
        assignee: 'Alice'
      };
      
      const response1 = await request(app)
        .put('/api/tasks/1')
        .send(updateData);
      
      const response2 = await request(app)
        .put('/api/tasks/1')
        .send(updateData);
      
      expect(response1.status).toBe(response2.status);
    });

    it('deve tornar pedidos DELETE idempotentes', async () => {
      // Primeiro criar uma tarefa
      const createResponse = await request(app)
        .post('/api/tasks')
        .send({
          title: 'Delete test',
          assignee: 'Test'
        });
      
      const taskId = createResponse.body.id;
      
      // Eliminar duas vezes
      const delete1 = await request(app).delete(`/api/tasks/${taskId}`);
      const delete2 = await request(app).delete(`/api/tasks/${taskId}`);
      
      // Ambos devem retornar o mesmo estado (404)
      expect(delete1.status).toBe(204);
      expect(delete2.status).toBe(404);
    });

    it('deve prevenir criação de tarefa duplicada', async () => {
      const taskData = {
        title: 'Unique Task',
        assignee: 'Test',
        priority: 'high'
      };
      
      const response1 = await request(app)
        .post('/api/tasks')
        .send(taskData);
      
      const response2 = await request(app)
        .post('/api/tasks')
        .send(taskData);
      
      // Deve detetar duplicado e retornar 409 ou usar chave de idempotência
      if (response2.status === 201) {
        expect(response1.body.id).toBe(response2.body.id);
      } else {
        expect(response2.status).toBe(409);
      }
    });
  });

  describe('Nomenclatura de Recursos', () => {
    it('deve usar nomenclatura plural consistente', async () => {
      // Todos os endpoints de tarefa devem usar /api/tasks (plural)
      const response = await request(app).get('/api/tasks/1');
      
      expect(response.status).toBe(200);
    });

    it('deve usar estrutura de recurso aninhado adequada', async () => {
      // Deve ser /api/tasks/1/assignments não /api/tasks/1/assign
      const response = await request(app)
        .patch('/api/tasks/1')
        .send({
          assignee: 'NewPerson'
        });
      
      expect(response.status).toBe(200);
    });
  });

  describe('Parâmetros de Query', () => {
    it('deve usar parâmetros de query para filtragem, não corpo do pedido', async () => {
      const response = await request(app)
        .get('/api/tasks')
        .query({ 
          status: 'pending',
          priority: 'high'
        });
      
      expect(response.status).toBe(200);
      
      if (Array.isArray(response.body.data || response.body)) {
        const tasks = response.body.data || response.body;
        tasks.forEach(task => {
          expect(task.status).toBe('pending');
          expect(task.priority).toBe('high');
        });
      }
    });
  });

  describe('Implementação Adequada de PATCH', () => {
    it('deve atualizar apenas campos especificados', async () => {
      // Obter tarefa original
      const original = await request(app).get('/api/tasks/1');
      const originalTask = original.body.data?.task || original.body;
      
      // Atualizar apenas prioridade
      const response = await request(app)
        .patch('/api/tasks/1')
        .send({
          priority: 'urgent'
        });
      
      expect(response.status).toBe(200);
      const updated = response.body.task;
      
      // Outros campos devem permanecer inalterados
      expect(updated.title).toBe(originalTask.title);
      expect(updated.status).toBe(originalTask.status);
      expect(updated.assignee).toBe(originalTask.assignee);
      expect(updated.priority).toBe('urgent');
    });

    it('não deve permitir modificação de ID', async () => {
      const response = await request(app)
        .patch('/api/tasks/1')
        .send({
          id: 999,
          title: 'Updated'
        });
      
      expect(response.status).toBe(200);
      expect(response.body.task.id).toBe(1);
    });
  });

  describe('Endpoints de Ação', () => {
    it('deve usar mudanças de estado em vez de endpoints de ação', async () => {
      // Em vez de /api/tasks/1/archive
      // Deve ser PATCH /api/tasks/1 com { status: 'archived' }
      const response = await request(app)
        .patch('/api/tasks/1')
        .send({
          status: 'archived'
        });
      
      expect(response.status).toBe(200);
      expect(response.body.task.status).toBe('archived');
    });
  });

  describe('Operações em Lote', () => {
    it('deve implementar eliminação em lote adequada', async () => {
      // Criar tarefas para eliminar
      const task1 = await request(app)
        .post('/api/tasks')
        .send({ title: 'Bulk 1', assignee: 'Test' });
      
      const task2 = await request(app)
        .post('/api/tasks')
        .send({ title: 'Bulk 2', assignee: 'Test' });
      
      const ids = [task1.body.id, task2.body.id];
      
      // Eliminação em lote deve usar endpoint adequado
      const response = await request(app)
        .delete('/api/tasks')
        .send({ ids });
      
      expect([200, 204]).toContain(response.status);
    });
  });

  describe('Validação', () => {
    it('deve validar campos obrigatórios', async () => {
      const response = await request(app)
        .post('/api/tasks')
        .send({
          priority: 'high'
        });
      
      expect(response.status).toBe(400);
    });

    it('deve validar valores de campo', async () => {
      const response = await request(app)
        .patch('/api/tasks/1')
        .send({
          priority: 'invalid-priority'
        });
      
      expect(response.status).toBe(400);
    });
  });
});
