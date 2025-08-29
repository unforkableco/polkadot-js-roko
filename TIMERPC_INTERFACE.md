# TimeRPC Service Interface Documentation

## Overview

TimeRPC is a temporal transaction service that wraps Substrate extrinsics with time-based metadata and submits them to a Substrate node. This document describes the complete HTTP API interface exposed by the TimeRPC service.

**Base URL**: `http://localhost:8080` (configurable via `PORT` environment variable)

## Authentication

Currently, TimeRPC operates without authentication (PoC mode). All endpoints are publicly accessible.

## Content Type

All requests and responses use `application/json` content type.

## Rate Limiting

- **Default**: 100 requests per minute per IP
- **Configurable**: via `RATE_LIMIT_PER_MINUTE` environment variable

---

## API Endpoints

### 1. Health Check

#### `GET /health`

Basic health check endpoint to verify service availability.

**Request:**
```http
GET /health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-08-01T16:30:00.000Z"
}
```

**Status Codes:**
- `200 OK`: Service is healthy

---

### 2. Temporal Transaction Submission

#### `POST /api/v1/temporal/submit`

Submit a Substrate extrinsic for temporal wrapping and blockchain submission.

**Request:**
```http
POST /api/v1/temporal/submit
Content-Type: application/json

{
  "transaction": "0x4502840012a4f1234567890abcdef...",
  "metadata": {
    "description": "Payment transaction",
    "source": "web-app"
  }
}
```

**Request Parameters:**
- `transaction` (string, required): Hex-encoded Substrate extrinsic starting with `0x`
- `metadata` (object, optional): User-defined metadata for the transaction

**Response (Success):**
```json
{
  "success": true,
  "transactionHash": "0xabcdef1234567890...",
  "temporalMetadata": {
    "timestamp": "1753367225091000000",
    "signature": "0x1234567890abcdef...",
    "keyId": 0,
    "proof": "0xfedcba0987654321..."
  }
}
```

**Response (Error):**
```json
{
  "success": false,
  "error": "SIGNATURE_FAILED",
  "message": "Failed to sign temporal message",
  "retryable": false,
  "timestamp": "2024-08-01T16:30:00.000Z"
}
```

**Status Codes:**
- `200 OK`: Transaction processed successfully
- `400 Bad Request`: Invalid transaction format or validation errors
- `500 Internal Server Error`: Non-retryable error (e.g., signature failure)
- `503 Service Unavailable`: Retryable error (e.g., node connection issue)

---

### 3. Service Status

#### `GET /api/v1/temporal/status`

Get comprehensive status information about the TimeRPC service.

**Request:**
```http
GET /api/v1/temporal/status
```

**Response:**
```json
{
  "status": "active",
  "activeKey": {
    "keyId": 0,
    "publicKey": "0x03fa99ea0fe05599064a4467942caf42ef9714ce7d7933ceea177a5de3a71a89b2",
    "validUntil": 1784903225088000000
  },
  "currentTimestamp": "1753367225091000000",
  "nodeConnection": {
    "connected": true,
    "activeKeysCount": 1
  },
  "chainspecEntry": {
    "keyId": 0,
    "publicKey": "0x03fa99ea0fe05599064a4467942caf42ef9714ce7d7933ceea177a5de3a71a89b2",
    "isActive": true,
    "validFrom": 1753367225088000000,
    "validUntil": 1784903225088000000,
    "description": "PoC TimeRPC Key"
  }
}
```

**Response Fields:**
- `status`: Service operational status ("active", "degraded", "error")
- `activeKey`: Information about the currently active TimeRPC signing key
- `currentTimestamp`: Current nanosecond timestamp
- `nodeConnection`: Substrate node connection status
- `chainspecEntry`: Ready-to-use chainspec configuration for the Substrate node

**Status Codes:**
- `200 OK`: Status retrieved successfully
- `500 Internal Server Error`: Failed to retrieve status

---

### 4. Transaction Validation

#### `POST /api/v1/temporal/validate`

Pre-validate a transaction without submitting it to the blockchain.

**Request:**
```http
POST /api/v1/temporal/validate
Content-Type: application/json

{
  "transaction": "0x4502840012a4f1234567890abcdef..."
}
```

**Request Parameters:**
- `transaction` (string, required): Hex-encoded Substrate extrinsic starting with `0x`

**Response (Valid):**
```json
{
  "valid": true,
  "decodedLength": 122,
  "estimatedTimestamp": "1753367225091000000"
}
```

**Response (Invalid):**
```json
{
  "valid": false,
  "error": "TRANSACTION_DECODE_ERROR",
  "message": "Invalid hex encoding",
  "timestamp": "2024-08-01T16:30:00.000Z"
}
```

**Status Codes:**
- `200 OK`: Validation completed (check `valid` field for result)
- `400 Bad Request`: Invalid request format
- `500 Internal Server Error`: Validation service error

---

### 5. Node Introspection

#### `GET /api/v1/temporal/introspection`

Get detailed information about the connected Substrate node and temporal pallet support.

**Request:**
```http
GET /api/v1/temporal/introspection
```

**Response:**
```json
{
  "success": true,
  "nodeInfo": {
    "chain": "testnet",
    "version": "1.0.0",
    "name": "roko-testnet-runtime"
  },
  "temporalSupport": {
    "supported": true,
    "palletAvailable": true,
    "rpcAvailable": true,
    "keyValid": true,
    "readinessScore": 100,
    "issues": []
  },
  "temporalPallet": {
    "isAvailable": true,
    "palletName": "temporalTransactions",
    "methods": ["submitTransaction", "validateTransaction"],
    "storage": ["timeRpcKeys", "temporalWatermark"],
    "events": ["TransactionSubmitted", "WatermarkUpdated"],
    "errors": ["InvalidSignature", "KeyNotFound"]
  },
  "temporalRpcMethods": [
    "temporal_submitTransaction",
    "temporal_validateTransaction",
    "temporal_getActiveKeys",
    "temporal_getWatermarkInfo"
  ],
  "recommendations": [
    "All temporal systems are functional",
    "TimeRPC key is properly registered and active"
  ],
  "timestamp": "2024-08-01T16:30:00.000Z"
}
```

**Status Codes:**
- `200 OK`: Introspection completed successfully
- `500 Internal Server Error`: Failed to introspect node

---

## Error Handling

### Error Categories

TimeRPC categorizes errors into specific types for better client handling:

| Error Code | Description | Retryable | HTTP Status |
|------------|-------------|-----------|-------------|
| `TRANSACTION_DECODE_ERROR` | Invalid transaction format | No | 400 |
| `SIGNATURE_FAILED` | TimeRPC signature generation failed | No | 500 |
| `NODE_CONNECTION_ERROR` | Cannot connect to Substrate node | Yes | 503 |
| `RPC_ERROR` | Substrate RPC call failed | Yes | 503 |
| `TEMPORAL_PROOF_ERROR` | Temporal proof generation failed | No | 500 |
| `VALIDATION_ERROR` | Transaction validation failed | No | 400 |
| `KEY_NOT_FOUND` | TimeRPC key not available | No | 500 |
| `TIMESTAMP_ERROR` | Timestamp generation failed | No | 500 |
| `RATE_LIMIT_EXCEEDED` | Too many requests | Yes | 429 |
| `SERVICE_UNAVAILABLE` | Service temporarily unavailable | Yes | 503 |

### Error Response Format

All error responses follow this structure:

```json
{
  "success": false,
  "error": "ERROR_CODE",
  "message": "Human-readable error message",
  "retryable": true,
  "context": {
    "additionalInfo": "value"
  },
  "timestamp": "2024-08-01T16:30:00.000Z"
}
```

### Retry Logic

For retryable errors (`retryable: true`), clients should implement exponential backoff:

- Initial delay: 1 second
- Maximum delay: 30 seconds
- Maximum retries: 3
- Backoff multiplier: 2

---

## Request/Response Examples

### Complete Transaction Submission Flow

```bash
# 1. Check service health
curl -X GET http://localhost:8080/health

# 2. Get service status and active key info
curl -X GET http://localhost:8080/api/v1/temporal/status

# 3. Validate transaction (optional)
curl -X POST http://localhost:8080/api/v1/temporal/validate \
  -H "Content-Type: application/json" \
  -d '{
    "transaction": "0xe10184798d4ba9baf0064ec19eb4f0a1a45785ae9d6dfc..."
  }'

# 4. Submit transaction for temporal processing
curl -X POST http://localhost:8080/api/v1/temporal/submit \
  -H "Content-Type: application/json" \
  -d '{
    "transaction": "0xe10184798d4ba9baf0064ec19eb4f0a1a45785ae9d6dfc...",
    "metadata": {
      "description": "ROKO transfer",
      "amount": "5000000000000000000"
    }
  }'

# 5. Check node introspection (diagnostic)
curl -X GET http://localhost:8080/api/v1/temporal/introspection
```

---

## Configuration

TimeRPC behavior can be configured via environment variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 8080 | HTTP server port |
| `RATE_LIMIT_PER_MINUTE` | 100 | Requests per minute per IP |
| `REQUEST_TIMEOUT` | 30000 | Request timeout in milliseconds |
| `MAX_TRANSACTION_SIZE` | 1024 | Maximum transaction size in bytes |
| `LOG_LEVEL` | info | Logging level (error, warn, info, debug) |

---

## Security Considerations

- **No Authentication**: Currently operates in PoC mode without authentication
- **Rate Limiting**: Protects against basic DoS attacks
- **Input Validation**: Validates transaction format and size
- **CORS**: Configurable cross-origin resource sharing
- **Helmet**: Security headers enabled by default

---

## Performance

- **Typical Response Time**: 50-200ms for transaction submission
- **Throughput**: ~500 transactions per minute (limited by Substrate node)
- **Memory Usage**: ~50MB base + 1MB per 1000 active transactions
- **Concurrent Connections**: Supports 1000+ concurrent connections

---

## Monitoring

TimeRPC provides detailed logging for all operations:

- **Request/Response Logging**: All API calls with timing
- **Temporal Processing Steps**: Detailed step-by-step processing logs
- **Error Tracking**: Comprehensive error logging with context
- **Node Communication**: Substrate RPC call logging
- **Performance Metrics**: Response times and throughput metrics 