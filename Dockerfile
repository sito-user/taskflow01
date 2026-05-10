# Stage 1 — builder
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .

# Stage 2 — runtime
FROM node:20-alpine AS runtime
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/src ./src
COPY --from=builder /app/db ./db
COPY --from=builder /app/knexfile.js ./knexfile.js

USER node
EXPOSE 4000
HEALTHCHECK CMD wget --quiet --tries=1 --spider http://localhost:4000/healthz || exit 1
CMD ["node", "src/app.js"]
