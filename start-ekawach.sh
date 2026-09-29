#!/usr/bin/env bash
echo "========================================================"
echo "  E-KAVACH Local Server & Domain Launcher (ekawach.co.in)"
echo "========================================================"
echo ""
echo "1. Starting E-KAVACH server on port 3000..."
npm run dev &
SERVER_PID=$!

sleep 4

echo "2. Starting Cloudflare Tunnel for ekawach.co.in..."
cloudflared tunnel run ekawach-local &
TUNNEL_PID=$!

echo ""
echo "========================================================"
echo "  E-KAVACH is now active!"
echo "  - Local Access:  http://localhost:3000"
echo "  - Live Domain:   https://ekawach.co.in"
echo "========================================================"
echo "Press Ctrl+C to stop both the server and tunnel."

trap "kill $SERVER_PID $TUNNEL_PID 2>/dev/null" EXIT
wait
