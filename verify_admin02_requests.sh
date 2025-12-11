#!/bin/bash
BASE_URL="http://localhost:5000/api"
EMAIL="admin02@gmail.com"
PASSWORD="Admin12345@"

echo "Logging in as Admin02..."
LOGIN_RESP=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$EMAIL\", \"password\": \"$PASSWORD\"}")

TOKEN=$(echo $LOGIN_RESP | python3 -c "import sys, json; print(json.load(sys.stdin).get('token'))")
ID=$(echo $LOGIN_RESP | python3 -c "import sys, json; print(json.load(sys.stdin).get('user', {}).get('id'))")

echo "Logged in. ID: $ID"

echo "Fetching Pending Requests..."
RESP=$(curl -s -X GET "$BASE_URL/users/requests" \
  -H "Authorization: Bearer $TOKEN")

echo "Response:"
echo $RESP
