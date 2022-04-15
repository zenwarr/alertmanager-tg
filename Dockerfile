FROM denoland/deno:alpine-1.20.6

USER deno

ADD ./src /src

RUN cd /src && deno bundle start.ts -- /tgbot.js

CMD ["run", "--allow-net", "--allow-env", "/tgbot.js"]
