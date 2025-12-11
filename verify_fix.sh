#!/bin/bash

# Configuration
BASE_URL="http://localhost:5000/api"
EMAIL="admin01@gmail.com"
PASSWORD="Admin12345@"

echo "---------------------------------------------------"
echo "Starting Verification Script"
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
echo "Login successful. Token acquired."

# 2. Update Profile
echo "Updating Profile..."
UPDATE_RESP=$(curl -s -X PUT "$BASE_URL/users/profile" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"bio": "Verified by API Script", "socialHandles": {"github": "https://github.com/api-verified"}}')

BIO=$(echo $UPDATE_RESP | python3 -c "import sys, json; print(json.load(sys.stdin).get('bio'))")
HANDLE=$(echo $UPDATE_RESP | python3 -c "import sys, json; print(json.load(sys.stdin).get('socialHandles', {}).get('github'))")

if [ "$BIO" == "Verified by API Script" ] && [ "$HANDLE" == "https://github.com/api-verified" ]; then
  echo "✅ Profile Update Successful"
else
  echo "❌ Profile Update Failed. Response: $UPDATE_RESP"
  exit 1
fi

# 3. Friend Request Test
# Register a temp user to send request to
RANDOM_SFX=$(date +%s)
TEMP_USER="tempuser_$RANDOM_SFX"
TEMP_EMAIL="temp_$RANDOM_SFX@test.com"
echo "Registering temp user: $TEMP_USER"

REG_RESP=$(curl -s -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"username\": \"$TEMP_USER\", \"email\": \"$TEMP_EMAIL\", \"password\": \"password123\"}")

# Assuming registration doesn't return ID directly, we need to login as new user or search for it.
# Let's search for it.
echo "Searching for temp user..."
SEARCH_RESP=$(curl -s -X GET "$BASE_URL/users/search?query=$TEMP_USER")
TEMP_ID=$(echo $SEARCH_RESP | python3 -c "import sys, json; print(json.load(sys.stdin)[0].get('_id'))")

if [ -z "$TEMP_ID" ] || [ "$TEMP_ID" == "None" ]; then
  echo "Could not find temp user. Registration might have failed or search is broken. Resp: $SEARCH_RESP"
else
  echo "Found temp user ID: $TEMP_ID"
  echo "Sending Friend Request..."
  REQ_RESP=$(curl -s -X POST "$BASE_URL/users/request/$TEMP_ID" \
    -H "Authorization: Bearer $TOKEN")
  
  MSG=$(echo $REQ_RESP | python3 -c "import sys, json; print(json.load(sys.stdin).get('message'))")
  
  if [ "$MSG" == "Friend request sent" ]; then
    echo "✅ Friend Request Successful"
  else
    echo "❌ Friend Request Failed. Response: $REQ_RESP"
  fi
fi

echo "---------------------------------------------------"
echo "Verification Complete"
echo "---------------------------------------------------"
