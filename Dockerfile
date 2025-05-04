FROM ubuntu:noble AS apt-downloader
RUN cd /tmp && \
    apt-get update && apt-get download \
        libacl1 \
        libc6 \
        libselinux1 \
        libgcc-s1 \
        gcc-14-base \
        libpcre2-8-0 \
        tar && \
    mkdir /dpkg && \
    for deb in *.deb; do dpkg --extract $deb /dpkg || exit 10; done

FROM denoland/deno:alpine-2.3.1 AS builder
WORKDIR /app

COPY . .
RUN deno cache src/main.ts

FROM denoland/deno:distroless-2.3.1
WORKDIR /app

COPY --from=apt-downloader /dpkg /
COPY --from=builder /app .

ENTRYPOINT ["deno", "run", "--allow-all", "/app/src/main.ts"]
