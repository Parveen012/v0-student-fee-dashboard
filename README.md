# v0-student-fee-dashboard

This is a [Next.js](https://nextjs.org) project bootstrapped with [v0](https://v0.app).

## Built with v0

This repository is linked to a [v0](https://v0.app) project. You can continue developing by visiting the link below -- start new chats to make changes, and v0 will push commits directly to this repo. Every merge to `main` will automatically deploy.

[Continue working on v0 →](https://v0.app/chat/projects/prj_LLUcktadjEKtqkei7VD44uThW93s)

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## API Configuration

The dashboard reads and writes data through a Next.js API proxy that forwards to your backend.

1. Copy `.env.example` to `.env.local`.
2. Set `API_URL=https://localhost:7163/api` (the Swagger base URL).
3. If your backend uses a self-signed cert in dev, set `ALLOW_SELF_SIGNED_CERT=true`.
4. If your backend requires an API key, set `API_KEY` and (optionally) `API_KEY_HEADER`.
5. For write operations (create student/discount/payment), set `NEXT_PUBLIC_TENANT_ID` to your tenant ID.

If you want the browser to call the backend directly, set `NEXT_PUBLIC_API_URL` (and `NEXT_PUBLIC_API_KEY` if required). This bypasses the proxy and exposes the key to the client, so prefer the server proxy when possible.

## Learn More

To learn more, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.
- [v0 Documentation](https://v0.app/docs) - learn about v0 and how to use it.

<a href="https://v0.app/chat/api/kiro/clone/Parveen012/v0-student-fee-dashboard" alt="Open in Kiro"><img src="https://pdgvvgmkdvyeydso.public.blob.vercel-storage.com/open%20in%20kiro.svg?sanitize=true" /></a>
