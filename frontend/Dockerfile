# ══════════════════════════════════════════════════════════════
# Stage 1: Build React App
# ══════════════════════════════════════════════════════════════
FROM node:20-alpine AS builder
WORKDIR /app

# Accept REACT_APP_API_URL at build time so the static bundle
# can embed the correct backend URL for Render deployments.
ARG REACT_APP_API_URL
ENV REACT_APP_API_URL=$REACT_APP_API_URL

COPY package.json ./

# BUG-1 FIX: The package-lock.json in this repo is a stub (missing resolution tree).
# Until a full lockfile is committed (run `npm install` locally and commit the
# ~3000-line result), we use `npm install` here which is slower but reliable.
# To switch to the faster `npm ci`, commit the full lockfile and change this line to:
#   RUN npm ci --silent --legacy-peer-deps
RUN npm install --silent --legacy-peer-deps

COPY public ./public
COPY src ./src
RUN npm run build

# ══════════════════════════════════════════════════════════════
# Stage 2: Serve via Nginx
# ══════════════════════════════════════════════════════════════
FROM nginx:alpine
COPY --from=builder /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s \
  CMD wget -qO- http://localhost/index.html || exit 1
CMD ["nginx", "-g", "daemon off;"]