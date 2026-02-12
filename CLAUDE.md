# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What is this project?

Twin is a Discord bot that acts as an AI "digital twin" — it learns from a user's Discord messages and documents, then responds mimicking their tone, vocabulary, and knowledge. Uses pgvector for semantic search and Vercel AI SDK for multi-model LLM support (Anthropic Claude / Google Gemini).

## Commands

```bash
bun run dev                              # Watch mode
bun start                                # Run bot
bun run db:generate                      # Generate migration after schema changes
bun run db:migrate                       # Apply migrations programmatically
bun run db:push                          # Push schema directly (dev shortcut)
bun run db:studio                        # Drizzle Studio UI
bun run ingest:discord <channelId>       # Scrape user messages from a channel
bun run ingest:docs <directory>          # Ingest .md/.txt documents
bun run typecheck                        # Type check (bunx tsc --noEmit)
docker compose up -d                     # Start PostgreSQL + pgvector
```

## Architecture

### Layer rules

- **`src/libs/`** — Wrappers around npm packages. **Only files inside `libs/` may import from npm packages** (except `zod` in `env.ts` and `node:*` built-ins). Everything else imports from `@/libs/*`.
- **`src/shared/`** — Base abstractions (`BaseRepository<T>`, `BaseIngestionService`) reused across the app.
- **`src/knowledge/`** — Domain layer: vector search, prompt building, text chunking.
- **`src/bot/`** — Discord bot client and message handlers.
- **`src/ingestion/`** — CLI scripts extending `BaseIngestionService` with async generator `extract()` methods.

### Data flow

1. **Ingestion** — Discord messages or documents are chunked → batch-embedded (OpenAI text-embedding-3-small, 1536d) → stored in PostgreSQL with pgvector.
2. **Query** — User message triggers bot → query embedded → cosine similarity search against knowledge_base → top 20 results retrieved.
3. **Response** — System prompt built from search results (style examples + knowledge) → LLM streams response → debounced edits to Discord message.

### Key patterns

- Each `libs/` subdirectory has a barrel `index.ts` — add new exports there.
- `BaseIngestionService.run()` handles the batch embed→insert pipeline. Subclasses only implement `async *extract(): AsyncGenerator<IngestionItem[]>`.
- `BaseRepository<TTable>` provides typed `insertMany()`. `KnowledgeRepository` extends it with `search()`.
- New database tables go in `src/libs/drizzle/schemas/` as separate files, re-exported through the barrel.
- `drizzle.config.ts` points `schema` at `./src/libs/drizzle/schemas` and `out` at `./src/libs/drizzle/migrations`.
- Streaming responses use `createStreamEditor()` which debounces Discord message edits at 1500ms and splits overflow into follow-up messages.

### Path alias

`@/*` maps to `src/*` (configured in `tsconfig.json`). Always use `@/` imports for cross-directory references.

## Environment

Runtime is **Bun** (not Node). Database requires **PostgreSQL with pgvector extension** — the `docker-compose.yml` uses `pgvector/pgvector:pg17`. Copy `.env.example` to `.env` and fill in credentials. `LLM_PROVIDER` selects between `anthropic` (Claude Sonnet 4) and `google` (Gemini 2.0 Flash).
