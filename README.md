This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

Give it your best.

## Getting Started

This app supports two AI backends:

- Local Ollama (default)
- OpenAI (optional, when you provide an API key)

When using Ollama, voice input and output use the browser's built-in Web Speech
APIs, because Ollama itself is a text-generation server and does not provide
speech-to-text or text-to-speech. Use Google Chrome or Safari for the best
browser speech support.

Create a local environment file from the example and adjust it to your setup:

```bash
cp .env.example .env.local
```

Example values:

```env
AI_PROVIDER=ollama
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=phi3:latest
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o-mini
```

If you want to use OpenAI instead, set `AI_PROVIDER=openai` and add your API key to `OPENAI_API_KEY`.

Then run the development server:

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

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
# Voice-Agent-bot
