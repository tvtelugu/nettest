# NetTest route-fixed package

This package fixes the route mismatch in the deployed NetTest project.

## Supported URL forms

- `/api?id=81288983&type=movie`
- `/api?id=1399&type=tv&season=1&episode=1`
- `/api/title/81288983`
- `/src/title/81288983`
- `/api/series/1399`

The Vercel routing rules translate the legacy path forms into the query-based
contract used by the current backend.

## Important

No third-party session cookies, user tokens, or authentication-bypass code are
included. Configure an authorized provider implementation in `api/provider.js`.

This package is intended as a routing/deployment repair, not as a mechanism for
accessing copyrighted streams without authorization.
