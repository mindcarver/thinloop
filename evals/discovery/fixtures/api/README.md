# Recordbox API

Recordbox is a single-user JSON API.

- `GET /v1/records` defaults to 20 records and caps `limit` at 100.
- Responses use `{ "items": [], "nextCursor": null }`.
- Accounts currently have free quota only.
- The service has no payment provider or deletion workflow.
