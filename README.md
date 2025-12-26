# Freedome Payments Backend (Pi Testnet/Platform)

Minimal backend required by Pi payment flow:
- Approve: `POST /payments/{payment_id}/approve`
- Complete: `POST /payments/{payment_id}/complete`

Uses Platform API base: `https://api.minepi.com/v2` and header:
`Authorization: Key <PI_SERVER_API_KEY>`

## Env
- `PI_SERVER_API_KEY` (required) — keep secret, NEVER in frontend
- `PI_API_BASE` (default `https://api.minepi.com/v2`)
- `CORS_ORIGIN` (default `*` for testnet)
- Optional (nice-to-have):
  - `RELAY_INGEST_URL` (e.g. https://your-relay/v1/ingest)
  - `RELAY_INGEST_TOKEN` (x-ingest-token)

## Run local (Docker)
```bash
export PI_SERVER_API_KEY="..."
docker compose up --build
```

Health: `GET /healthz`

## API
### POST /api/pi/approve
Body:
```json
{ "paymentId": "..." }
```

### POST /api/pi/complete
Body:
```json
{ "paymentId": "...", "txid": "..." }
```

### POST /api/pi/verify-me  (optional)
Body:
```json
{ "accessToken": "..." }
```
Calls `GET /me` with Bearer token.
