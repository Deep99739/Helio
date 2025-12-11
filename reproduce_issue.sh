#!/bin/bash

# Configuration
BASE_URL="http://localhost:5000/api"
EMAIL="admin01@gmail.com"
PASSWORD="Admin12345@"

echo "---------------------------------------------------"
echo "Reproduction Script"
echo "---------------------------------------------------"

# 1. Login
echo "Logging in..."
LOGIN_RESP=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$EMAIL\", \"password\": \"$PASSWORD\"}")

TOKEN=$(echo $LOGIN_RESP | python3 -c "import sys, json; print(json.load(sys.stdin).get('token'))")

if [ -z "$TOKEN" ] || [ "$TOKEN" == "None" ]; then
  echo "Login failed. Response: $LOGIN_RESP"
  exit 1
fi
echo "Token: ${TOKEN:0:10}..."

# 2. Update Bio Only (Should Work)
echo "Updating Bio Only..."
RESP1=$(curl -s -X PUT "$BASE_URL/users/profile" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"bio": "Bio Only Update"}')
echo "Response 1: $RESP1"

# 3. Update Social Handles (Suspected Failure)
echo "Updating Social Handles..."
RESP2=$(curl -s -X PUT "$BASE_URL/users/profile" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"bio": "Bio + Social", "socialHandles": {"github": "github.com"}}')
echo "Response 2: $RESP2"

# 4. Search and Friend Request
echo "Searching for admin02..."
SEARCH_RESP=$(curl -s -X GET "$BASE_URL/users/search?query=admin02")
ADMIN02_ID=$(echo $SEARCH_RESP | python3 -c "import sys, json; data=json.load(sys.stdin); print(data[0]['_id']) if len(data)>0 else ''")

if [ -n "$ADMIN02_ID" ]; then
    echo "Found admin02: $ADMIN02_ID"
    echo "Sending Request..."
    RESP3=$(curl -s -X POST "$BASE_URL/users/request/$ADMIN02_ID" \
      -H "Authorization: Bearer $TOKEN")
    echo "Response 3: $RESP3"
else
    echo "admin02 not found"
fi
