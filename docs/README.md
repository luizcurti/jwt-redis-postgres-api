# Diagrams

Mermaid source lives in [`mmd/`](mmd/); rendered SVGs live in [`img/`](img/). Regenerate after editing a `.mmd` file:

```bash
npx @mermaid-js/mermaid-cli -i docs/mmd/<name>.mmd -o docs/img/<name>.svg -b transparent
```

| Diagram | Description |
|---|---|
| [`architecture.mmd`](mmd/architecture.mmd) / [`.svg`](img/architecture.svg) | Component diagram: client → Express router → controllers → services → repositories → PostgreSQL/Redis |
| [`er-diagram.mmd`](mmd/er-diagram.mmd) / [`.svg`](img/er-diagram.svg) | `users` table schema |
| [`sequence-create-user.mmd`](mmd/sequence-create-user.mmd) / [`.svg`](img/sequence-create-user.svg) | `POST /users` — happy path, missing fields (400), duplicate username (409) |
| [`sequence-login.mmd`](mmd/sequence-login.mmd) / [`.svg`](img/sequence-login.svg) | `POST /login` — happy path, missing fields (400), invalid credentials (401) |
| [`sequence-get-profile.mmd`](mmd/sequence-get-profile.mmd) / [`.svg`](img/sequence-get-profile.svg) | `GET /users/profile/:id` — happy path, missing/invalid token (401), wrong owner (403), not cached (404) |

These are also embedded in the main [README](../README.md).
