import * as jwt from 'jsonwebtoken';
import { WebSocketGateway } from './websocket.gateway';

describe('WebSocketGateway', () => {
  const configService = {
    get: jest.fn((key: string) => (key === 'JWT_SECRET' ? 'test-jwt-secret' : undefined)),
  } as any;

  const buildSocket = (token?: string) =>
    ({
      id: 'sock-1',
      handshake: { auth: token ? { token: `Bearer ${token}` } : {}, headers: {}, query: {} },
      data: {},
      join: jest.fn(),
      emit: jest.fn(),
      disconnect: jest.fn(),
    }) as any;

  it('disconnects unauthenticated websocket clients', () => {
    const gateway = new WebSocketGateway(configService);
    const socket = buildSocket();

    gateway.handleConnection(socket);

    expect(socket.disconnect).toHaveBeenCalledWith(true);
    expect(socket.join).not.toHaveBeenCalled();
  });

  it('joins user, vendor, and role rooms for authenticated clients', () => {
    const gateway = new WebSocketGateway(configService);
    const token = jwt.sign(
      { sub: 42, email: 'admin@example.com', accountType: 'Admin', vendorId: 7 },
      'test-jwt-secret',
    );
    const socket = buildSocket(token);

    gateway.handleConnection(socket);

    expect(socket.disconnect).not.toHaveBeenCalled();
    expect(socket.join).toHaveBeenCalledWith('authenticated');
    expect(socket.join).toHaveBeenCalledWith('user:42');
    expect(socket.join).toHaveBeenCalledWith('vendor:7');
    expect(socket.join).toHaveBeenCalledWith('role:Admin');
  });

  it('routes wallet updates only to the target user room', () => {
    const gateway = new WebSocketGateway(configService);
    const emit = jest.fn();
    const to = jest.fn(() => ({ emit }));
    gateway.server = { to } as any;

    gateway.broadcastWalletBalanceUpdate({
      userId: 99,
      balance: 12.5,
      currency: 'GHS',
    });

    expect(to).toHaveBeenCalledWith('user:99');
    expect(emit).toHaveBeenCalledWith(
      'walletBalanceUpdate',
      expect.objectContaining({
        type: 'walletBalanceUpdate',
        data: expect.objectContaining({ userId: 99 }),
      }),
    );
  });
});
