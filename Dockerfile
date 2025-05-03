FROM denoland/deno:alpine-2.3.1 AS builder
WORKDIR /app

COPY . .
RUN deno cache src/main.ts

FROM denoland/deno:distroless-2.3.1
WORKDIR /app

COPY --from=builder /app .
ENTRYPOINT ["deno", "run", "src/main.ts"]
