# Paystack Mobile Money Integration for Ghana

## Overview
Paystack already supports mobile money payments in Ghana through their unified payment gateway. No additional mobile money API integration is needed - Paystack handles MTN Mobile Money, Vodafone Cash, and AirtelTigo Money automatically.

## How It Works

### Payment Channels Supported
Paystack supports the following payment channels in Ghana:
- **Card** - Visa, Mastercard, Verve
- **Mobile Money** - MTN, Vodafone, AirtelTigo (automatically detected)
- **Bank Transfer** - Direct bank transfers
- **USSD** - For feature phones
- **QR Code** - Scan to pay

### Implementation

#### Backend (Already Implemented)
The payment service now supports channel selection:

```typescript
// Initialize payment with mobile money
await paymentsService.initializePayment(
  invoiceId,
  email,
  metadata,
  'mobile_money', // Channel
  '+233XXXXXXXXX' // Phone number (optional but recommended)
);
```

#### Frontend Usage
```typescript
// Initialize payment with mobile money channel
const response = await paymentsApi.initialize({
  invoiceId: 123,
  email: 'user@example.com',
  channel: 'mobile_money',
  phone: '+233XXXXXXXXX', // User's mobile money number
});
```

### Payment Flow

1. **User initiates payment** → Frontend calls `/api/payments/initialize`
2. **Backend creates Paystack transaction** → With `channels: ['mobile_money']`
3. **Paystack redirects user** → To mobile money payment page
4. **User selects provider** → MTN, Vodafone, or AirtelTigo
5. **User enters phone number** → And completes payment
6. **Paystack processes payment** → Via mobile money network
7. **Webhook callback** → Paystack notifies backend of payment status
8. **Backend verifies payment** → Updates invoice and wallet

### Paystack Configuration

#### Environment Variables
```env
PAYSTACK_SECRET_KEY=sk_live_xxxxxxxxxxxxx  # Your Paystack secret key
PAYSTACK_PUBLIC_KEY=pk_live_xxxxxxxxxxxxx   # Your Paystack public key
PAYSTACK_CALLBACK_URL=https://yourdomain.com/api/payments/callback
```

#### Paystack Dashboard Setup
1. **Enable Mobile Money** in Paystack dashboard
2. **Configure webhook URL** for payment callbacks
3. **Set up Ghana-specific settings** (currency: GHS)
4. **Test with test keys** before going live

### Mobile Money Providers in Ghana

#### MTN Mobile Money
- Most popular in Ghana
- Phone number format: +233XXXXXXXXX
- Transaction fees: ~1-2% (handled by Paystack)

#### Vodafone Cash
- Second most popular
- Phone number format: +233XXXXXXXXX
- Transaction fees: ~1-2%

#### AirtelTigo Money
- Third provider
- Phone number format: +233XXXXXXXXX
- Transaction fees: ~1-2%

### Testing

#### Test Mode
Use Paystack test keys:
```env
PAYSTACK_SECRET_KEY=sk_test_xxxxxxxxxxxxx
PAYSTACK_PUBLIC_KEY=pk_test_xxxxxxxxxxxxx
```

#### Test Phone Numbers
Paystack provides test phone numbers for each provider:
- MTN: Use test numbers from Paystack dashboard
- Vodafone: Use test numbers from Paystack dashboard
- AirtelTigo: Use test numbers from Paystack dashboard

### Frontend Payment Component

Example payment button with mobile money option:

```tsx
const handlePayWithMobileMoney = async () => {
  const response = await paymentsApi.initialize({
    invoiceId: invoice.id,
    email: user.email,
    channel: 'mobile_money',
    phone: user.phone, // User's mobile money number
  });
  
  // Redirect to Paystack payment page
  window.location.href = response.authorizationUrl;
};
```

### Webhook Handling

Paystack will send webhooks to your callback URL. Ensure your backend handles:

```typescript
// POST /api/payments/callback
// Paystack sends payment status updates here
```

### Benefits of Using Paystack

1. **Unified API** - One integration for all payment methods
2. **Automatic Provider Detection** - Paystack handles provider selection
3. **Built-in Security** - PCI DSS compliant
4. **Real-time Notifications** - Webhook support
5. **Analytics Dashboard** - Payment analytics in Paystack dashboard
6. **Multi-currency Support** - GHS (Ghana Cedis) supported
7. **Mobile Money Included** - No separate integration needed

### Important Notes

1. **Phone Number Format**: Always use international format (+233XXXXXXXXX)
2. **Currency**: Ensure all transactions use GHS (Ghana Cedis)
3. **Webhook Security**: Verify webhook signatures from Paystack
4. **Error Handling**: Handle mobile money failures gracefully
5. **User Experience**: Show clear instructions for mobile money payments

### Next Steps

1. ✅ Backend already supports channel selection
2. ✅ Payment service updated to handle mobile money
3. ⏳ Add mobile money option to frontend payment UI
4. ⏳ Add phone number input for mobile money payments
5. ⏳ Test with Paystack test environment
6. ⏳ Configure production Paystack keys
7. ⏳ Set up webhook endpoint for payment callbacks

### Documentation
- [Paystack Mobile Money Docs](https://paystack.com/docs/payments/mobile-money)
- [Paystack Ghana Integration](https://paystack.com/docs/payments/accept-payments/ghana)

