import {
  BadRequestException,
  ConflictException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';

// @nestjs/jwt ships ESM only, which Jest (CJS) cannot load; the service only needs the token.
jest.mock('@nestjs/jwt', () => ({ JwtService: class {} }));

const makePrisma = () => ({
  user: { findUnique: jest.fn(), create: jest.fn(), update: jest.fn() },
  passwordReset: { create: jest.fn(), findFirst: jest.fn(), deleteMany: jest.fn() },
});

describe('AuthService', () => {
  let prisma: ReturnType<typeof makePrisma>;
  let jwt: { sign: jest.Mock };
  let service: AuthService;

  beforeEach(() => {
    prisma = makePrisma();
    jwt = { sign: jest.fn().mockReturnValue('jwt-token') };
    service = new AuthService(prisma as any, jwt as any);
  });

  describe('register', () => {
    const dto = { email: 'A@Test.com', password: 'secret123', fullName: 'A' } as any;

    it('rejects an existing email', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'u1' });
      await expect(service.register(dto)).rejects.toThrow(ConflictException);
      expect(prisma.user.create).not.toHaveBeenCalled();
    });

    it('lowercases email, hashes password, creates default cash wallet', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue({ id: 'u1', email: 'a@test.com' });

      const res = await service.register(dto);

      const data = prisma.user.create.mock.calls[0][0].data;
      expect(data.email).toBe('a@test.com');
      expect(data.password).not.toBe('secret123');
      expect(await bcrypt.compare('secret123', data.password)).toBe(true);
      expect(data.baseCurrency).toBe('VND');
      expect(data.wallets.create).toMatchObject({ type: 'CASH', balance: 0 });
      expect(jwt.sign).toHaveBeenCalledWith({ sub: 'u1', email: 'a@test.com' });
      expect(res.accessToken).toBe('jwt-token');
    });

    it('uses the requested base currency', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue({ id: 'u1', email: 'a@test.com' });

      await service.register({ ...dto, baseCurrency: 'USD' });

      const data = prisma.user.create.mock.calls[0][0].data;
      expect(data.baseCurrency).toBe('USD');
      expect(data.wallets.create.currency).toBe('USD');
    });
  });

  describe('login', () => {
    it('rejects unknown email', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      await expect(service.login({ email: 'x@y.com', password: 'p' } as any)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('rejects wrong password', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'u1',
        email: 'x@y.com',
        password: await bcrypt.hash('right', 4),
      });
      await expect(service.login({ email: 'x@y.com', password: 'wrong' } as any)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('returns token and omits password', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'u1',
        email: 'x@y.com',
        password: await bcrypt.hash('right', 4),
      });
      const res = await service.login({ email: 'X@Y.com', password: 'right' } as any);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { email: 'x@y.com' } });
      expect(res.accessToken).toBe('jwt-token');
      expect(res.user).not.toHaveProperty('password');
    });
  });

  describe('forgotPassword', () => {
    it('does not leak whether the email exists', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      const res = await service.forgotPassword({ email: 'no@one.com' } as any);
      expect(res.resetToken).toBeNull();
      expect(prisma.passwordReset.create).not.toHaveBeenCalled();
    });

    it('stores a 6-digit token expiring in ~15 minutes', async () => {
      prisma.user.findUnique.mockResolvedValue({ email: 'a@b.com' });
      const before = Date.now();
      const res = await service.forgotPassword({ email: 'a@b.com' } as any);

      expect(res.resetToken).toMatch(/^\d{6}$/);
      const data = prisma.passwordReset.create.mock.calls[0][0].data;
      expect(data.token).toBe(res.resetToken);
      const ttl = data.expiresAt.getTime() - before;
      expect(ttl).toBeGreaterThan(14 * 60 * 1000);
      expect(ttl).toBeLessThanOrEqual(15 * 60 * 1000 + 1000);
    });
  });

  describe('resetPassword', () => {
    const dto = { token: '123456', newPassword: 'newpass123' } as any;

    it('rejects unknown token', async () => {
      prisma.passwordReset.findFirst.mockResolvedValue(null);
      await expect(service.resetPassword(dto)).rejects.toThrow(BadRequestException);
    });

    it('rejects expired token', async () => {
      prisma.passwordReset.findFirst.mockResolvedValue({
        email: 'a@b.com',
        expiresAt: new Date(Date.now() - 1000),
      });
      await expect(service.resetPassword(dto)).rejects.toThrow('hết hạn');
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it('updates password hash and clears reset tokens', async () => {
      prisma.passwordReset.findFirst.mockResolvedValue({
        email: 'a@b.com',
        expiresAt: new Date(Date.now() + 60_000),
      });

      await service.resetPassword(dto);

      const upd = prisma.user.update.mock.calls[0][0];
      expect(upd.where).toEqual({ email: 'a@b.com' });
      expect(await bcrypt.compare('newpass123', upd.data.password)).toBe(true);
      expect(prisma.passwordReset.deleteMany).toHaveBeenCalledWith({ where: { email: 'a@b.com' } });
    });
  });

  describe('getMe', () => {
    it('throws when user missing', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      await expect(service.getMe('u1')).rejects.toThrow(NotFoundException);
    });

    it('returns the user', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'u1' });
      await expect(service.getMe('u1')).resolves.toEqual({ id: 'u1' });
    });
  });
});
