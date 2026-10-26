This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

Browser API requests use `/api/v1` on the frontend domain. A Next.js external rewrite forwards these to Backend, preserving request methods, query strings, cookies and response `Set-Cookie`. This avoids Catalyst's cross-origin OPTIONS gateway issue and keeps session cookies first-party. JWT and CSRF validation still run in Backend; the Microservice token remains server-only.

Set `ORBIT_BACKEND_URL` in Vercel to `https://market-agency-backend-50046841977.development.catalystappsail.in/api/v1`, then rebuild and deploy the frontend. Existing `NEXT_PUBLIC_FASTIFY_API_URL` is accepted as a fallback proxy target. For local development set `ORBIT_BACKEND_URL=http://127.0.0.1:9000/api/v1`. The target must include `/api/v1`. This requires a running Next.js server (Vercel supports it); static exports do not support external rewrites.

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
