FROM node:24-bookworm-slim AS builder

ENV NODE_ENV=production \
    PORT=3000

WORKDIR /usr/src/app

RUN npm install -g pnpm@10.12.1

COPY package.json pnpm-lock.yaml* ./

RUN if [ -f pnpm-lock.yaml ]; then pnpm install --frozen-lockfile --prod; \
    else pnpm install --prod; fi

COPY . .

FROM gcr.io/distroless/nodejs24-debian12:nonroot

WORKDIR /app

COPY --from=builder /usr/src/app/node_modules ./node_modules

COPY --from=builder /usr/src/app/package.json ./
COPY --from=builder /usr/src/app/index.js ./
COPY --from=builder /usr/src/app/views ./views

EXPOSE 3000

CMD ["index.js"]