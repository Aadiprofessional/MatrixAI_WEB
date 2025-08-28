#!/bin/bash

# Airwallex Demo Sandbox API credentials
CLIENT_ID="HlF-odCfT-OIf1s3nLgV8A"
API_KEY="8e7c2b82271d5d9715b9ed2fbd70cec8e2e41b11171a1fca45690df0074299aebd4a07e79e7b3f2c399ba579d5d20ae1"

echo "Step 1: Getting Access Token..."
RESPONSE=$(curl -s -X POST https://api-demo.airwallex.com/api/v1/authentication/login \
  -H "Content-Type: application/json" \
  -H "x-client-id: $CLIENT_ID" \
  -H "x-api-key: $API_KEY")

echo "Authentication Response:"
echo $RESPONSE
echo ""

# Extract token from response
TOKEN=$(echo $RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "Failed to get access token"
  exit 1
fi

echo "Access Token: $TOKEN"
echo ""

echo "Step 2: Testing with provided Merchant ID..."
MERCHANT_ID="acct_HwrURCbbMKaJeRrTyp5Wqw"
echo "Using Merchant ID: $MERCHANT_ID"
echo ""

echo "Step 3: Testing Payment Intent Creation..."
PAYMENT_INTENT_RESPONSE=$(curl -s -X POST https://api-demo.airwallex.com/api/v1/pa/payment_intents/create \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "request_id": "test_'$(date +%s)'_'$(openssl rand -hex 4)'",
    "amount": 50,
    "currency": "HKD",
    "merchant_order_id": "TEST_ORDER_'$(date +%s)'",
    "return_url": "https://example.com/return"
  }')

echo "Payment Intent Response:"
echo $PAYMENT_INTENT_RESPONSE
echo ""

# Check if payment intent was created successfully
INTENT_ID=$(echo $PAYMENT_INTENT_RESPONSE | grep -o '"id":"[^"]*' | cut -d'"' -f4)

if [ -z "$INTENT_ID" ]; then
  echo "Failed to create payment intent"
else
  echo "Payment Intent created successfully with ID: $INTENT_ID"
fi