FROM node:18-alpine AS builder

WORKDIR /app
COPY package.json ./
RUN npm install --only=production --legacy-peer-deps

FROM node:18-alpine AS production

RUN addgroup -g 1001 -S nodejs && \
    adduser  -S nodeuser -u 1001

WORKDIR /app

COPY --from=builder --chown=nodeuser:nodejs /app/node_modules ./node_modules
COPY --chown=nodeuser:nodejs src/ ./src/
COPY --chown=nodeuser:nodejs package.json ./

USER nodeuser

EXPOSE 4000

# Use node instead of wget — always available in node image
HEALTHCHECK --interval=15s --timeout=5s --start-period=30s --retries=3 \
  CMD node -e \
    "const h=require('http');h.get('http://localhost:4000/health/live',r=>{process.exit(r.statusCode===200?0:1)}).on('error',()=>process.exit(1))"

CMD ["node", "src/index.js"]
