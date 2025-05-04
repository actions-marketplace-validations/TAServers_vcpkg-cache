FROM denoland/deno:alpine-2.3.1 AS builder
WORKDIR /app

COPY . .
RUN deno cache src/main.ts

FROM denoland/deno:alpine-2.3.1
WORKDIR /app

RUN --mount=type=cache,target=/var/cache/apk apk add tar

COPY --from=builder /app .
COPY restore.sh /
COPY save.sh /

ENTRYPOINT ["/restore.sh"]
