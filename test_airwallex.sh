#!/bin/bash

# Airwallex Production API credentials
CLIENT_ID="rpff3oW8TF2uAE1Ut6HdmA"
API_KEY="a0bff58559a5240791b61449ad22047dba8ef18bfd1c17ba69a8303477e3032c56a587117860a4f3bfb66d5f348202b0"

echo "Step 1: Getting Access Token..."
RESPONSE=$(curl -s -X POST https://api.airwallex.com/api/v1/authentication/login \
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
PAYMENT_INTENT_RESPONSE=$(curl -s -X POST https://api.airwallex.com/api/v1/pa/payment_intents/create \
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