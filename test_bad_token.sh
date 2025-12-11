#!/bin/bash
BASE_URL="http://localhost:5000/api"

echo "Sending request with BAD token..."
curl -v -X PUT "$BASE_URL/users/profile" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer BAD_TOKEN_VALUE" \
  -d '{"bio": "Should Fail"}'
