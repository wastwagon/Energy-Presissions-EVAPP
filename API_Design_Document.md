# REST API Design Document
## EV Charging Billing Software

---

## API OVERVIEW

**Base URL**: `https://api.yourevcharging.com/v1`  
**Authentication**: Bearer Token (JWT)  
**Content-Type**: `application/json`  
**API Version**: v1

---

## AUTHENTICATION

### Login
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "refresh_token_here",
    "user": {
      "id": 1,
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe"
    }
  }
}
```

### Register
```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890"
}
```

### Refresh Token
```http
POST /api/v1/auth/refresh
Content-Type: application/json

{
  "refreshToken": "refresh_token_here"
}
```

---

## USERS

### Get Current User
```http
GET /api/v1/users/me
Authorization: Bearer {token}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "phone": "+1234567890",
    "balance": 50.00,
    "currency": "USD",
    "accountType": "Customer",
    "status": "Active",
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

### Update User Profile
```http
PUT /api/v1/users/me
Authorization: Bearer {token}
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890"
}
```

### Get User Transactions
```http
GET /api/v1/users/me/transactions
Authorization: Bearer {token}
Query Parameters:
  - page: 1
  - limit: 20
  - status: Active|Completed|Cancelled
  - startDate: 2024-01-01
  - endDate: 2024-12-31
```

**Response**:
```json
{
  "success": true,
  "data": {
    "transactions": [
      {
        "id": 789,
        "chargePointId": "CP001",
        "connectorId": 1,
        "startTime": "2024-01-15T10:30:00Z",
        "stopTime": "2024-01-15T11:45:00Z",
        "totalEnergyKwh": 12.655,
        "durationMinutes": 75,
        "totalCost": 2.53,
        "currency": "USD",
        "status": "Completed"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 45,
      "totalPages": 3
    }
  }
}
```

---

## ID TAGS (Authorization Tokens)

### Get User's IdTags
```http
GET /api/v1/users/me/idtags
Authorization: Bearer {token}
```

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "idTag": "RFID123456789",
      "status": "Active",
      "expiryDate": "2024-12-31T23:59:59Z",
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### Issue New IdTag
```http
POST /api/v1/users/me/idtags
Authorization: Bearer {token}
Content-Type: application/json

{
  "idTag": "RFID987654321",
  "expiryDate": "2024-12-31T23:59:59Z"
}
```

### Deactivate IdTag
```http
DELETE /api/v1/users/me/idtags/{idTag}
Authorization: Bearer {token}
```

---

## STATIONS (Charge Points)

### Get All Stations
```http
GET /api/v1/stations
Authorization: Bearer {token}
Query Parameters:
  - status: Available|Charging|Offline|Faulted
  - location: lat,lng,radius (for nearby stations)
```

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "chargePointId": "CP001",
      "vendor": "VendorName",
      "model": "ModelXYZ",
      "status": "Available",
      "location": {
        "latitude": 40.7128,
        "longitude": -74.0060,
        "address": "123 Main St, City, State"
      },
      "connectors": [
        {
          "connectorId": 1,
          "type": "Type2",
          "powerRatingKw": 22.0,
          "status": "Available"
        },
        {
          "connectorId": 2,
          "type": "CCS",
          "powerRatingKw": 50.0,
          "status": "Charging"
        }
      ],
      "lastHeartbeat": "2024-01-15T10:35:00Z"
    }
  ]
}
```

### Get Station Details
```http
GET /api/v1/stations/{chargePointId}
Authorization: Bearer {token}
```

### Get Station Status
```http
GET /api/v1/stations/{chargePointId}/status
Authorization: Bearer {token}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "chargePointId": "CP001",
    "status": "Available",
    "connectors": [
      {
        "connectorId": 1,
        "status": "Available",
        "currentTransaction": null
      },
      {
        "connectorId": 2,
        "status": "Charging",
        "currentTransaction": {
          "transactionId": 789,
          "startTime": "2024-01-15T10:30:00Z",
          "currentEnergyKwh": 8.5,
          "currentCost": 1.28
        }
      }
    ]
  }
}
```

---

## TRANSACTIONS

### Get All Transactions (Admin)
```http
GET /api/v1/transactions
Authorization: Bearer {token}
Query Parameters:
  - page: 1
  - limit: 20
  - status: Active|Completed|Cancelled
  - chargePointId: CP001
  - userId: 1
  - startDate: 2024-01-01
  - endDate: 2024-12-31
```

### Get Transaction Details
```http
GET /api/v1/transactions/{transactionId}
Authorization: Bearer {token}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "transactionId": 789,
    "chargePointId": "CP001",
    "connectorId": 1,
    "idTag": "RFID123456789",
    "user": {
      "id": 1,
      "email": "user@example.com",
      "name": "John Doe"
    },
    "meterStart": 12345,
    "meterStop": 25000,
    "startTime": "2024-01-15T10:30:00Z",
    "stopTime": "2024-01-15T11:45:00Z",
    "totalEnergyKwh": 12.655,
    "durationMinutes": 75,
    "totalCost": 2.53,
    "currency": "USD",
    "status": "Completed",
    "reason": "EVDisconnected",
    "meterValues": [
      {
        "timestamp": "2024-01-15T10:35:00Z",
        "energyWh": 12500,
        "powerKw": 7.2,
        "voltageV": 230
      }
    ]
  }
}
```

### Get Active Transactions
```http
GET /api/v1/transactions/active
Authorization: Bearer {token}
```

### Remote Start Transaction
```http
POST /api/v1/transactions/remote-start
Authorization: Bearer {token}
Content-Type: application/json

{
  "chargePointId": "CP001",
  "connectorId": 1,
  "idTag": "RFID123456789"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "status": "Accepted",
    "message": "Charging started successfully"
  }
}
```

### Remote Stop Transaction
```http
POST /api/v1/transactions/{transactionId}/remote-stop
Authorization: Bearer {token}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "status": "Accepted",
    "message": "Charging stopped successfully"
  }
}
```

### Get Real-time Transaction Status
```http
GET /api/v1/transactions/{transactionId}/status
Authorization: Bearer {token}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "transactionId": 789,
    "status": "Charging",
    "currentEnergyKwh": 8.5,
    "currentCost": 1.28,
    "durationMinutes": 45,
    "powerKw": 7.2,
    "voltageV": 230,
    "estimatedTimeRemaining": 30
  }
}
```

---

## BILLING

### Get Transaction Cost
```http
GET /api/v1/billing/transactions/{transactionId}/cost
Authorization: Bearer {token}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "transactionId": 789,
    "energyKwh": 12.655,
    "durationMinutes": 75,
    "breakdown": {
      "energyCost": 1.90,
      "timeCost": 0.63,
      "baseFee": 0.00,
      "tax": 0.00,
      "total": 2.53
    },
    "currency": "USD",
    "tariff": {
      "name": "Standard Rate",
      "energyRate": 0.15,
      "timeRate": 0.50
    }
  }
}
```

### Get Invoices
```http
GET /api/v1/billing/invoices
Authorization: Bearer {token}
Query Parameters:
  - page: 1
  - limit: 20
  - startDate: 2024-01-01
  - endDate: 2024-12-31
```

**Response**:
```json
{
  "success": true,
  "data": {
    "invoices": [
      {
        "invoiceNumber": "INV-2024-001",
        "transactionId": 789,
        "subtotal": 2.53,
        "tax": 0.00,
        "total": 2.53,
        "currency": "USD",
        "status": "Paid",
        "createdAt": "2024-01-15T11:45:00Z",
        "pdfUrl": "https://api.yourevcharging.com/invoices/INV-2024-001.pdf"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 10,
      "totalPages": 1
    }
  }
}
```

### Get Invoice Details
```http
GET /api/v1/billing/invoices/{invoiceNumber}
Authorization: Bearer {token}
```

### Download Invoice PDF
```http
GET /api/v1/billing/invoices/{invoiceNumber}/pdf
Authorization: Bearer {token}
```

---

## PAYMENTS

### Get Payment Methods
```http
GET /api/v1/payments/methods
Authorization: Bearer {token}
```

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "pm_1234567890",
      "type": "card",
      "card": {
        "brand": "visa",
        "last4": "4242",
        "expMonth": 12,
        "expYear": 2025
      },
      "isDefault": true
    }
  ]
}
```

### Add Payment Method
```http
POST /api/v1/payments/methods
Authorization: Bearer {token}
Content-Type: application/json

{
  "type": "card",
  "token": "tok_visa"  // From payment gateway (e.g., Stripe)
}
```

### Set Default Payment Method
```http
PUT /api/v1/payments/methods/{methodId}/default
Authorization: Bearer {token}
```

### Top Up Wallet
```http
POST /api/v1/payments/topup
Authorization: Bearer {token}
Content-Type: application/json

{
  "amount": 50.00,
  "currency": "USD",
  "paymentMethodId": "pm_1234567890"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "paymentId": "pay_1234567890",
    "amount": 50.00,
    "currency": "USD",
    "status": "Succeeded",
    "newBalance": 50.00
  }
}
```

### Get Payment History
```http
GET /api/v1/payments
Authorization: Bearer {token}
Query Parameters:
  - page: 1
  - limit: 20
  - type: charge|refund|topup
```

### Process Refund
```http
POST /api/v1/payments/{paymentId}/refund
Authorization: Bearer {token}
Content-Type: application/json

{
  "amount": 2.53,  // Optional, full refund if omitted
  "reason": "Customer request"
}
```

---

## ADMIN ENDPOINTS

### Get All Users (Admin)
```http
GET /api/v1/admin/users
Authorization: Bearer {token}
Query Parameters:
  - page: 1
  - limit: 20
  - status: Active|Suspended|Inactive
  - search: email or name
```

### Get User Details (Admin)
```http
GET /api/v1/admin/users/{userId}
Authorization: Bearer {token}
```

### Update User (Admin)
```http
PUT /api/v1/admin/users/{userId}
Authorization: Bearer {token}
Content-Type: application/json

{
  "status": "Active",
  "balance": 100.00,
  "accountType": "Premium"
}
```

### Get System Statistics
```http
GET /api/v1/admin/statistics
Authorization: Bearer {token}
Query Parameters:
  - startDate: 2024-01-01
  - endDate: 2024-12-31
```

**Response**:
```json
{
  "success": true,
  "data": {
    "totalTransactions": 1250,
    "totalRevenue": 12500.50,
    "totalEnergyKwh": 50000.25,
    "activeUsers": 150,
    "activeStations": 10,
    "averageTransactionCost": 10.00,
    "averageEnergyPerTransaction": 40.00
  }
}
```

### Get Reports
```http
GET /api/v1/admin/reports/revenue
Authorization: Bearer {token}
Query Parameters:
  - startDate: 2024-01-01
  - endDate: 2024-12-31
  - groupBy: day|week|month
  - format: json|csv
```

---

## WEBSOCKET API (Real-time Updates)

### Connection
```
wss://api.yourevcharging.com/v1/ws?token={jwt_token}
```

### Subscribe to Transaction Updates
```json
{
  "action": "subscribe",
  "channel": "transaction",
  "transactionId": 789
}
```

### Subscribe to Station Updates
```json
{
  "action": "subscribe",
  "channel": "station",
  "chargePointId": "CP001"
}
```

### Real-time Messages

**Transaction Update**:
```json
{
  "type": "transaction.update",
  "data": {
    "transactionId": 789,
    "currentEnergyKwh": 8.5,
    "currentCost": 1.28,
    "powerKw": 7.2,
    "status": "Charging"
  }
}
```

**Station Status Update**:
```json
{
  "type": "station.status",
  "data": {
    "chargePointId": "CP001",
    "connectorId": 1,
    "status": "Charging",
    "currentTransaction": {
      "transactionId": 789,
      "currentEnergyKwh": 8.5
    }
  }
}
```

---

## ERROR RESPONSES

### Standard Error Format
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "details": {}  // Optional additional details
  }
}
```

### Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `UNAUTHORIZED` | 401 | Authentication required |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `VALIDATION_ERROR` | 400 | Invalid input data |
| `PAYMENT_FAILED` | 402 | Payment processing failed |
| `STATION_OFFLINE` | 503 | Charge point unavailable |
| `TRANSACTION_NOT_FOUND` | 404 | Transaction does not exist |
| `INSUFFICIENT_BALANCE` | 402 | User balance too low |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |

### Example Error Response
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": {
      "fields": {
        "email": "Invalid email format",
        "password": "Password must be at least 8 characters"
      }
    }
  }
}
```

---

## RATE LIMITING

- **Standard Users**: 100 requests per minute
- **Premium Users**: 500 requests per minute
- **Admin Users**: 1000 requests per minute

**Headers**:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

---

## PAGINATION

All list endpoints support pagination:

**Query Parameters**:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20, max: 100)

**Response Format**:
```json
{
  "success": true,
  "data": {
    "items": [...],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "totalPages": 5,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

---

## FILTERING & SORTING

### Filtering
```
GET /api/v1/transactions?status=Completed&chargePointId=CP001
```

### Sorting
```
GET /api/v1/transactions?sort=startTime&order=desc
```

### Date Ranges
```
GET /api/v1/transactions?startDate=2024-01-01&endDate=2024-12-31
```

---

## WEBHOOKS (Payment Gateway)

### Payment Webhook Endpoint
```
POST /api/v1/webhooks/payments
```

**Headers**:
```
X-Webhook-Signature: signature_from_gateway
```

**Payload** (Stripe example):
```json
{
  "type": "payment_intent.succeeded",
  "data": {
    "object": {
      "id": "pi_1234567890",
      "amount": 253,
      "currency": "usd",
      "metadata": {
        "transactionId": "789"
      }
    }
  }
}
```

---

**Last Updated**: 2024  
**API Version**: v1



