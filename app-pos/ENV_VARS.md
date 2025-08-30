# Environment Variables

Create a `.env.local` file in `app-pos/` with the following variables:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXTAUTH_SECRET=your_random_long_secret
```

Notes:
- The service role key must be kept server-side only. Never expose it to the client.
- Ensure the `users` table has columns: `id (uuid)`, `username (text unique)`, `password_hash (text)`, `role (text: 'Owner' | 'admin' | 'staff')`.

