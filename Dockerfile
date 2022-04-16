FROM denoland/deno:alpine-1.20.6 as builder

ADD ./src /src

RUN cd /src && deno bundle start.ts -- /tgbot.js

FROM denoland/deno:alpine-1.20.6

RUN mkdir /alertmanager-tg && chown deno:deno /alertmanager-tg

USER deno

COPY --from=builder /tgbot.js /tgbot.js

CMD ["run", "--allow-net", "--allow-env", "--allow-read", "--allow-write", "/tgbot.js"]
