FROM node:20-alpine

WORKDIR /app

# Install dependencies (separate from source for layer caching)
COPY package*.json ./
RUN npm install

# Prisma generate needs the schema
COPY prisma/schema.prisma ./prisma/
RUN npx prisma generate

# Build the app
COPY tsconfig.json ./
COPY src/ ./src/
RUN npm run build

# Start
EXPOSE 3000
CMD ["node", "dist/index.js"]
