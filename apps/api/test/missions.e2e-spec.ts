import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { MissionsController } from '../src/missions.controller.js';
import { MissionsService } from '../src/missions.service.js';

describe('mission HTTP API', () => {
  let app: INestApplication;
  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [MissionsController],
      providers: [MissionsService],
    }).compile();
    app = module.createNestApplication();
    await app.init();
  });
  afterEach(async () => {
    await app.close();
  });

  it('creates, restores and changes an authoritative session', async () => {
    const created = await request(app.getHttpServer())
      .post('/api/sessions')
      .send({ difficulty: 'cadet' })
      .expect(201);
    const { id, revision } = created.body as { id: string; revision: number };
    const changed = await request(app.getHttpServer())
      .post(`/api/sessions/${id}/commands`)
      .send({ revision, command: { type: 'action', actionId: 'research' } })
      .expect(201);
    expect(changed.body.science).toBe(18);
    expect(changed.body.resources.energy).toBe(78);
    const restored = await request(app.getHttpServer())
      .get(`/api/sessions/${id}`)
      .expect(200);
    expect(restored.body.revision).toBe(1);
    expect(restored.body.science).toBe(18);
  });
  it('rejects stale revisions without spending twice', async () => {
    const { body } = await request(app.getHttpServer())
      .post('/api/sessions')
      .send({ difficulty: 'cadet' });
    const command = {
      revision: 0,
      command: { type: 'action', actionId: 'research' },
    };
    await request(app.getHttpServer())
      .post(`/api/sessions/${body.id}/commands`)
      .send(command)
      .expect(201);
    await request(app.getHttpServer())
      .post(`/api/sessions/${body.id}/commands`)
      .send(command)
      .expect(409);
    const result = await request(app.getHttpServer()).get(
      `/api/sessions/${body.id}`,
    );
    expect(result.body.actionsRemaining).toBe(1);
  });
  it('validates inputs and rejects client-supplied state', async () => {
    await request(app.getHttpServer())
      .post('/api/sessions')
      .send({ difficulty: 'invalid' })
      .expect(400);
    await request(app.getHttpServer())
      .post('/api/sessions')
      .send({ difficulty: 'cadet', science: 999 })
      .expect(400);
    await request(app.getHttpServer())
      .post('/api/sessions/unknown/commands')
      .send({ revision: 0, command: { type: 'action', actionId: 'cheat' } })
      .expect(400);
    await request(app.getHttpServer()).get('/api/sessions/unknown').expect(404);
  });
  it('exposes configuration and prevents commands during events', async () => {
    const config = await request(app.getHttpServer())
      .get('/api/config')
      .expect(200);
    expect(config.body.duration).toBe(7);
    const { body } = await request(app.getHttpServer())
      .post('/api/sessions')
      .send({ difficulty: 'cadet' });
    await request(app.getHttpServer())
      .post(`/api/sessions/${body.id}/commands`)
      .send({ revision: 0, command: { type: 'advance' } })
      .expect(201);
    await request(app.getHttpServer())
      .post(`/api/sessions/${body.id}/commands`)
      .send({ revision: 1, command: { type: 'advance' } })
      .expect(400);
  });
});
