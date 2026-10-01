# ponytail: full node_modules in the image; switch to output: "standalone" if image size matters
FROM node:22-alpine
# Prisma's engine needs OpenSSL, which alpine doesn't ship
RUN apk add --no-cache openssl
WORKDIR /app
# schema first: npm ci's postinstall runs prisma generate
COPY package*.json ./
COPY prisma ./prisma
RUN npm ci
COPY . .
RUN npm run build
EXPOSE 3000
# DATABASE_URL and SESSION_SECRET come from `docker run -e`, never baked into the image
CMD ["npm", "start"]
