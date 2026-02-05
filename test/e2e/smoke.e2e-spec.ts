import { Controller, Get, INestApplication, Module } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

@Controller('test')
class TestController {
  @Get('health')
  health() {
    return { status: 'ok' };
  }
}

@Module({
  controllers: [TestController],
})
class TestModule {}

describe('Smoke E2E', () => {
  let app: INestApplication;
  let testController: TestController;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [TestModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    testController = moduleFixture.get(TestController);
  });

  afterAll(async () => {
    await app.close();
  });

  it('bootstraps Nest application', () => {
    expect(app).toBeDefined();
  });

  it('resolves controller and returns health payload', () => {
    expect(testController.health()).toEqual({ status: 'ok' });
  });
});
