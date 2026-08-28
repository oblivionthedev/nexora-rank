# Nexora OAuth setup

Nexora uses Supabase Auth as the single OAuth broker. Discord uses Supabase's
built-in provider. Roblox uses a custom OpenID Connect provider so PKCE, token
exchange, ID-token validation, session cookies, and identity linking stay in
one audited auth system.

## Shared callback

Configure both provider applications with this server-side callback:

```text
https://oomtmrfmqnndmwjqdpsj.supabase.co/auth/v1/callback
```

This is the provider-to-Supabase callback. Application redirects such as
`http://localhost:3000/auth/callback` belong in Supabase Auth's redirect allow
list, not in the Discord or Roblox developer portals.

## Discord

1. In the Discord Developer Portal, open the Nexora application.
2. Add the shared callback above as an OAuth2 redirect.
3. In Supabase Auth Providers, enable Discord and save its client ID and secret.
4. Request only the identity scopes the product needs. Basic sign-in uses
   `identify` and `email`.

Discord is currently enabled in the hosted Nexora Supabase project.

## Roblox

1. In Roblox Creator Dashboard, create an OAuth 2.0 application. The owner must
   be ID verified and the application may require Roblox review before public
   use.
2. Add the shared callback above.
3. Enable the `openid` and `profile` scopes.
4. In Supabase Auth Providers, create a custom provider with:
   - Type: OpenID Connect
   - Identifier: `custom:roblox`
   - Issuer: `https://apis.roblox.com/oauth/`
   - Scopes: `openid profile`
   - Email optional: enabled
   - PKCE: enabled
5. Store the Roblox client ID and secret only in the Supabase provider
   configuration. They do not belong in this repository or a public browser
   environment variable.

Roblox's discovery document is:
`https://apis.roblox.com/oauth/.well-known/openid-configuration`.

## Application redirects

In Supabase Authentication URL Configuration, allow:

- `http://localhost:3000/auth/callback`
- The production origin followed by `/auth/callback`

Enable manual identity linking so a signed-in user can connect both Discord and
Roblox to the same Nexora account.

After every successful callback, Nexora calls `sync_auth_identities()`. The
database reads verified rows from `auth.identities` and writes a safe profile
projection to `public.account_links`; provider access and refresh tokens are
never copied into public tables.

