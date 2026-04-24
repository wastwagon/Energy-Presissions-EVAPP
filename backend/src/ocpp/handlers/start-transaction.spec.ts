import axios from 'axios';
import { StartTransactionHandler } from './start-transaction';

jest.mock('axios');

const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('StartTransactionHandler', () => {
  const sendMessage = jest.fn();
  const connectionManager = { sendMessage } as any;
  const handler = new StartTransactionHandler(connectionManager);

  const basePayload = {
    connectorId: 1,
    idTag: 'USER_1',
    meterStart: 1000,
    timestamp: '2026-01-01T00:00:00.000Z',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.CSMS_API_URL = 'http://example.local';
    process.env.SERVICE_TOKEN = 'svc-token';
  });

  it('rejects start transaction when id tag is blocked', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: { status: 'Blocked' } } as any);

    await handler.handle('CP001', 'msg-1', basePayload);

    expect(mockedAxios.post).not.toHaveBeenCalled();
    expect(sendMessage).toHaveBeenCalledTimes(1);
    expect(sendMessage).toHaveBeenCalledWith(
      'CP001',
      expect.arrayContaining([
        3,
        'msg-1',
        expect.objectContaining({
          transactionId: 0,
          idTagInfo: expect.objectContaining({ status: 'Blocked' }),
        }),
      ]),
    );
  });

  it('creates transaction when id tag is accepted', async () => {
    mockedAxios.get.mockResolvedValueOnce({ data: { status: 'Active' } } as any);
    mockedAxios.post.mockResolvedValueOnce({ data: { transactionId: 777 } } as any);

    await handler.handle('CP001', 'msg-2', basePayload);

    expect(mockedAxios.post).toHaveBeenCalledTimes(1);
    expect(sendMessage).toHaveBeenCalledWith(
      'CP001',
      expect.arrayContaining([
        3,
        'msg-2',
        expect.objectContaining({
          transactionId: 777,
          idTagInfo: expect.objectContaining({ status: 'Accepted' }),
        }),
      ]),
    );
  });
});
