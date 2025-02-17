# frontend/Dockerfile
FROM node:18

WORKDIR /app

# Install global Quasar CLI
RUN npm install -g @quasar/cli

COPY package*.json ./
# Disable postinstall scripts temporarily
RUN npm install --ignore-scripts

# Now copy the rest of the app
COPY . .

# Run Quasar prepare only after the project files are copied
RUN quasar prepare

EXPOSE 8080
CMD ["quasar", "dev"]