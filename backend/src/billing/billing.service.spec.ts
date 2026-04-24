import { BillingService } from './billing.service';

describe('BillingService', () => {
  const transactionRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
    findAndCount: jest.fn(),
  } as any;
  const tariffRepository = {
    find: jest.fn(),
  } as any;
  const invoiceRepository = {
    findOne: jest.fn(),
    create: jest.fn((payload) => payload),
    save: jest.fn((payload) => payload),
    findAndCount: jest.fn(),
  } as any;
  const paymentRepository = {} as any;
  const vendorRepository = {
    findOne: jest.fn(),
  } as any;
  const systemSettingRepository = {
    findOne: jest.fn(),
  } as any;

  const service = new BillingService(
    transactionRepository,
    tariffRepository,
    invoiceRepository,
    paymentRepository,
    vendorRepository,
    systemSettingRepository,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('applies vendor metadata tax rate when generating invoice', async () => {
    transactionRepository.findOne.mockResolvedValueOnce({
      transactionId: 101,
      userId: 5,
      totalCost: 100,
      currency: 'GHS',
      status: 'Completed',
      chargePoint: { vendorId: 7 },
      user: {},
    });
    invoiceRepository.findOne.mockResolvedValueOnce(null);
    vendorRepository.findOne.mockResolvedValueOnce({
      id: 7,
      metadata: { taxRatePercent: 15 },
    });

    const invoice = await service.generateInvoice(101);

    expect(invoice.subtotal).toBe(100);
    expect(invoice.tax).toBe(15);
    expect(invoice.total).toBe(115);
    expect(systemSettingRepository.findOne).not.toHaveBeenCalled();
  });

  it('falls back to system billing tax rate when vendor tax is missing', async () => {
    transactionRepository.findOne.mockResolvedValueOnce({
      transactionId: 202,
      userId: 9,
      totalCost: 80,
      currency: 'GHS',
      status: 'Completed',
      chargePoint: { vendorId: 11 },
      user: {},
    });
    invoiceRepository.findOne.mockResolvedValueOnce(null);
    vendorRepository.findOne.mockResolvedValueOnce({
      id: 11,
      metadata: {},
    });
    systemSettingRepository.findOne
      .mockResolvedValueOnce({ key: 'billing.taxRatePercent', value: '12.5' })
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null);

    const invoice = await service.generateInvoice(202);

    expect(invoice.subtotal).toBe(80);
    expect(invoice.tax).toBe(10);
    expect(invoice.total).toBe(90);
  });

  it('ignores invalid vendor tax and falls back to system value', async () => {
    transactionRepository.findOne.mockResolvedValueOnce({
      transactionId: 303,
      userId: 12,
      totalCost: 200,
      currency: 'GHS',
      status: 'Completed',
      chargePoint: { vendorId: 44 },
      user: {},
    });
    invoiceRepository.findOne.mockResolvedValueOnce(null);
    vendorRepository.findOne.mockResolvedValueOnce({
      id: 44,
      metadata: { taxRatePercent: 'not-a-number' },
    });
    systemSettingRepository.findOne
      .mockResolvedValueOnce({ key: 'billing.taxRatePercent', value: '5' })
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null);

    const invoice = await service.generateInvoice(303);

    expect(invoice.tax).toBe(10);
    expect(invoice.total).toBe(210);
  });

  it('defaults to zero tax when vendor and settings are missing', async () => {
    transactionRepository.findOne.mockResolvedValueOnce({
      transactionId: 404,
      userId: 17,
      totalCost: 49.99,
      currency: 'GHS',
      status: 'Completed',
      chargePoint: {},
      user: {},
    });
    invoiceRepository.findOne.mockResolvedValueOnce(null);
    systemSettingRepository.findOne.mockResolvedValue(null);

    const invoice = await service.generateInvoice(404);

    expect(invoice.subtotal).toBe(49.99);
    expect(invoice.tax).toBe(0);
    expect(invoice.total).toBe(49.99);
  });

  it('rounds tax and total to two decimals consistently', async () => {
    transactionRepository.findOne.mockResolvedValueOnce({
      transactionId: 505,
      userId: 33,
      totalCost: 123.45,
      currency: 'GHS',
      status: 'Completed',
      chargePoint: { vendorId: 88 },
      user: {},
    });
    invoiceRepository.findOne.mockResolvedValueOnce(null);
    vendorRepository.findOne.mockResolvedValueOnce({
      id: 88,
      metadata: { taxRatePercent: 12.5 },
    });

    const invoice = await service.generateInvoice(505);

    expect(invoice.tax).toBe(15.43);
    expect(invoice.total).toBe(138.88);
  });
});
