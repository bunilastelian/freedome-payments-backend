FROM node:20-alpine
WORKDIR /app
RUN apk add --no-cache tini
COPY package.json package-lock.json* ./
RUN npm install --omit=dev
COPY src ./src
ENV PORT=8788
ENV PI_API_BASE=https://api.minepi.com/v2
EXPOSE 8788
ENTRYPOINT ["/sbin/tini","--"]
CMD ["node","src/server.js"]
