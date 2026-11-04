# Plain `next start` rather than `output: 'standalone'`: it is what was verified
# locally, and standalone can build redirects from the wrong host behind a proxy.
FROM node:22-bookworm-slim

WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1

# Install ALL deps: the build needs devDependencies, and `next start` still needs
# typescript at runtime to read next.config.ts, so nothing is pruned afterwards.
COPY package*.json ./
RUN npm ci

COPY . .

# NEXT_PUBLIC_* come from the committed .env.production, so no build args needed.
RUN npm run build

ENV NODE_ENV=production
# Railway bills RAM per GB, so keep the heap bounded.
ENV NODE_OPTIONS=--max-old-space-size=512

# ISR and the image optimizer write under .next at runtime.
RUN chown -R node:node .next
USER node

EXPOSE 3000

# Reads PORT from the environment and binds 0.0.0.0 by default.
CMD ["node_modules/.bin/next", "start"]
