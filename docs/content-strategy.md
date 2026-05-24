# CitePilot content strategy

Editorial system for citepilot.com — distinct from the in-app **product** (citation tracking SaaS).

## Implemented in codebase

| Piece | Location |
|-------|----------|
| Pillars, audiences, banned phrases | `src/lib/content-strategy/` |
| Article brief builder | `POST /api/content/brief` |
| AI draft generation (needs OpenAI) | `POST /api/content/generate` |
| Public blog | `/blog`, sample post live |
| Weekly editorial template | Dashboard → Content |

## Intentionally bypassed (for now)

- Auto-syndication to Reddit → use **Discussions** (HN + Stack Overflow)
- AI detector API integrations (ZeroGPT, etc.)
- Automated GSC monthly reports
- Guest post / PR outreach bots
- Unreviewed auto-publish at 3–5 posts/week

## Generate an article (API)

```bash
curl -X POST http://localhost:3000/api/content/brief \
  -H "Content-Type: application/json" \
  -d '{
    "topic": "how to rank on ChatGPT",
    "audience": "saas",
    "contentType": "pillar",
    "angle": "prompt-level tracking"
  }'
```

With `OPENAI_API_KEY` set:

```bash
curl -X POST http://localhost:3000/api/content/generate \
  -H "Content-Type: application/json" \
  -d '{
    "topic": "how to rank on ChatGPT",
    "audience": "saas",
    "contentType": "tutorial"
  }'
```

## Voice & pillars

See `src/lib/content-strategy/constants.ts` and `prompt.ts` for the canonical rules used by the generator.
