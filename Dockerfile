# syntax=docker/dockerfile:1

# ---- deps: install exact locked dependencies ----
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci

# ---- builder: generate Prisma client, build Next.js ----
FROM node:20-alpine AS builder
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Skip Sentry source-map upload during the container build — SENTRY_AUTH_TOKEN
# is a deploy-time secret, not a build-arg we want baked into this stage.
ENV CI=true

RUN npx prisma generate
RUN npm run build

# ---- runner: minimal production image ----
FROM node:20-alpine AS runner
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001

COPY --from=builder /app/public ./public

# Next.js standalone output: a self-contained server.js plus only the
# node_modules it actually traced as used. This is what keeps the image
# ~200MB smaller than a full node_modules copy would be.
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# The standalone trace does not reliably pick up Prisma's generated client,
# its query engine binaries, or the `prisma` CLI itself. Without these,
# migrate/runtime calls fail with "@prisma/client did not initialize yet"
# or a missing engine binary.
#
# The `prisma` CLI (a devDependency) is needed here so `npm run db:deploy`
# can run as a discrete pipeline step against this same image, per the
# deployment plan. The CLI transitively needs @prisma/engines,
# @prisma/fetch-engine, @prisma/get-platform, @prisma/debug and
# @prisma/config — copying the whole @prisma/ scope rather than
# cherry-picking individual packages is deliberate: cherry-picking broke
# on the first real build here with "Cannot find module '@prisma/engines'",
# and would keep breaking silently across future Prisma version bumps.
#
# NOTE: node_modules/.bin/prisma is a symlink (-> ../prisma/build/index.js)
# whose bundled loader resolves sibling asset paths (e.g. a .wasm file)
# relative to wherever it physically executes from. Docker's COPY does not
# reliably preserve that relationship, so the symlink resolves to the
# wrong directory at runtime and throws ENOENT for those sibling assets.
# db:deploy in package.json calls `node node_modules/prisma/build/index.js`
# directly instead of relying on this symlink — verified working below.
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder /app/prisma ./prisma

# package.json so `npm run db:deploy` can resolve its script definition
COPY --from=builder /app/package.json ./package.json

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

CMD ["node", "server.js"]
