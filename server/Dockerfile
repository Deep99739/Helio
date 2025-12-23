# Use Node.js 18 (Debian-based)
FROM node:18-bullseye

# Install System Dependencies for Language Servers
# - clangd (C++), default-jdk (Java), golang (Go), python3 (Python)
RUN apt-get update && apt-get install -y \
    clangd \
    default-jdk \
    golang \
    python3 \
    python3-pip \
    && rm -rf /var/lib/apt/lists/*

# Install Rust (via rustup, standard way)
RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
ENV PATH="/root/.cargo/bin:${PATH}"
# Install rust-analyzer
RUN rustup component add rust-analyzer

# Setup App Directory
WORKDIR /app

# Copy Package Files
COPY package*.json ./

# Install NPM Dependencies
RUN npm install

# Copy Source Code
COPY . .

# Expose Port
EXPOSE 5000

# Start Server
CMD ["npm", "start"]
