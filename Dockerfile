FROM denoland/deno:alpine-2.3.1 AS builder
WORKDIR /github/workspace

COPY . .
RUN deno cache src/main.ts

FROM denoland/deno:distroless-2.3.1
WORKDIR /github/workspace

COPY --from=builder /github/workspace .
ENTRYPOINT ["deno", "run", "src/main.ts"]
