#!/bin/bash
BASE_URL="http://localhost:5000/api"
EMAIL="admin01@gmail.com"
PASSWORD="Admin12345@"
ROOM_ID="room-history-test-$(date +%s)"

echo "1. Logging in..."
LOGIN_RESP=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$EMAIL\", \"password\": \"$PASSWORD\"}")

TOKEN=$(echo $LOGIN_RESP | python3 -c "import sys, json; print(json.load(sys.stdin).get('token'))")
USER_ID=$(echo $LOGIN_RESP | python3 -c "import sys, json; print(json.load(sys.stdin).get('user', {}).get('id'))")

if [ -z "$TOKEN" ] || [ "$TOKEN" == "None" ]; then
    echo "Login failed. Response: $LOGIN_RESP"
    exit 1
fi
echo "Logged in. User ID: $USER_ID"

echo "2. Joining Room ($ROOM_ID)..."
JOIN_RESP=$(curl -s -X POST "$BASE_URL/rooms/join" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"roomId\": \"$ROOM_ID\", \"name\": \"History Test Room\"}")
echo "Join Response: $JOIN_RESP"

echo "3. Fetching Recent Rooms..."
RECENT_RESP=$(curl -s -X GET "$BASE_URL/rooms/recent" \
  -H "Authorization: Bearer $TOKEN")

echo "Recent Rooms Response:"
echo $RECENT_RESP | python3 -m json.tool

# Check if ROOM_ID is in the response
if [[ "$RECENT_RESP" == *"$ROOM_ID"* ]]; then
    echo "SUCCESS: Room $ROOM_ID found in history!"
else
    echo "FAILURE: Room $ROOM_ID NOT found in history."
    exit 1
fi
