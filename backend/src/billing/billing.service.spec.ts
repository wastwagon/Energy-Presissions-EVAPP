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
});
