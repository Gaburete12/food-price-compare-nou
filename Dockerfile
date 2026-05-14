FROM mcr.microsoft.com/playwright:v1.50.0-jammy

# Setăm directorul de lucru
WORKDIR /app

# Instalăm pnpm (managerul tău de pachete)
RUN npm install -g pnpm

# Copiem fișierele de configurare și patch-urile
COPY package.json ./
COPY patches ./patches

# Instalăm dependențele
RUN pnpm install

# Copiem tot restul codului
COPY . .

# Construim aplicația pentru producție
RUN pnpm run build

# Portul pe care rulează serverul tău
EXPOSE 3000

# Comanda de start
CMD ["pnpm", "run", "start"]
