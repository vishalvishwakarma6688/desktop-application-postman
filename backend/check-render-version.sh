#!/bin/bash

echo "🔍 Checking Render Deployment Status..."
echo ""

# Check if the Render API is returning the new port configuration
RENDER_URL="https://desktop-application-postman.onrender.com"

echo "Testing Render endpoint: $RENDER_URL"
echo ""

# Make a request and check response time
echo "1. Testing server response..."
curl -o /dev/null -s -w "Response time: %{time_total}s\nHTTP Status: %{http_code}\n" $RENDER_URL/api/health 2>/dev/null || echo "Health endpoint not available"

echo ""
echo "2. To verify the email configuration is updated on Render:"
echo "   - Go to: https://dashboard.render.com/"
echo "   - Click on your service"
echo "   - Check the logs for:"
echo "     PORT: 587 (STARTTLS)  <-- Should be 587, NOT 465"
echo "     IPv6: Disabled         <-- Should see this"
echo ""
echo "3. If you still see port 465 in logs:"
echo "   - Click 'Manual Deploy' → 'Clear build cache & deploy'"
echo ""
