FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force
COPY . .
RUN addgroup -g 1001 -S nodejs && \
    adduser -S payment -u 1001
RUN chown -R payment:nodejs /app
USER payment
EXPOSE 3006
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3002/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"
CMD ["node", "index.js"]