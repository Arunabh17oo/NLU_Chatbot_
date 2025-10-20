# Docker Setup Guide for AI Chatbot Full Stack Application

This guide will help you set up and run the AI Chatbot application using Docker containers.

## 🚀 Quick Start

### Prerequisites

- Docker (version 20.10 or higher)
- Docker Compose (version 2.0 or higher)
- Git

### 1. Clone and Setup

```bash
# Clone the repository
git clone <your-repo-url>
cd NLU_Chatbot

# Copy environment configuration
cp env.example .env

# Edit the .env file with your actual values
nano .env
```

### 2. Configure Environment Variables

Edit the `.env` file with your actual values:

```env
# Database Configuration
MONGO_ROOT_USERNAME=admin
MONGO_ROOT_PASSWORD=your-secure-password-here
MONGO_DATABASE=mern_chatbot

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# HuggingFace AI Configuration
HUGGINGFACE_API_KEY=your-huggingface-api-key-here

# MongoDB Express Admin UI (Optional)
MONGO_EXPRESS_USERNAME=admin
MONGO_EXPRESS_PASSWORD=admin-password-here
```

### 3. Run the Application

#### Option A: Using the Setup Script (Recommended)

```bash
# Make the script executable (if not already done)
chmod +x docker-setup.sh

# Run the setup script
./docker-setup.sh
```

#### Option B: Manual Docker Compose

```bash
# Build and start all services
docker-compose up -d --build

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## 🏗️ Architecture

The application consists of the following services:

### Services

1. **Frontend** (React + Vite + Nginx)
   - Port: 3000
   - URL: http://localhost:3000
   - Multi-stage build with Nginx for production

2. **Backend** (Node.js + Express)
   - Port: 3001
   - URL: http://localhost:3001
   - API endpoints for chat, training, evaluation

3. **MongoDB** (Database)
   - Port: 27017
   - Persistent data storage
   - Health checks enabled

4. **MongoDB Express** (Database Admin UI) - Optional
   - Port: 8081
   - URL: http://localhost:8081
   - Access with admin credentials

### Network

All services communicate through a custom Docker network (`chatbot-network`).

## 🔧 Development Mode

For development with hot reloading:

```bash
# Run in development mode
./docker-dev.sh
```

This will:
- Start MongoDB in Docker
- Run backend with `npm run dev` (hot reloading)
- Run frontend with `npm run dev` (hot reloading)
- Frontend will be available at http://localhost:5173

## 📋 Available Commands

### Docker Compose Commands

```bash
# Start all services
docker-compose up -d

# Start with admin UI
docker-compose --profile admin up -d

# View logs
docker-compose logs -f

# View logs for specific service
docker-compose logs -f backend

# Stop all services
docker-compose down

# Stop and remove volumes
docker-compose down -v

# Rebuild and start
docker-compose up -d --build

# View service status
docker-compose ps

# Execute command in running container
docker-compose exec backend bash
docker-compose exec frontend sh
```

### Individual Service Commands

```bash
# Build specific service
docker-compose build backend
docker-compose build frontend

# Start specific service
docker-compose up -d backend

# View service logs
docker-compose logs backend
docker-compose logs frontend
docker-compose logs mongodb
```

## 🐛 Troubleshooting

### Common Issues

1. **Port Already in Use**
   ```bash
   # Check what's using the port
   lsof -i :3000
   lsof -i :3001
   lsof -i :27017
   
   # Kill the process or change ports in docker-compose.yml
   ```

2. **MongoDB Connection Issues**
   ```bash
   # Check MongoDB logs
   docker-compose logs mongodb
   
   # Restart MongoDB
   docker-compose restart mongodb
   ```

3. **Backend API Not Responding**
   ```bash
   # Check backend logs
   docker-compose logs backend
   
   # Check if backend is healthy
   curl http://localhost:3001/api/health
   ```

4. **Frontend Not Loading**
   ```bash
   # Check frontend logs
   docker-compose logs frontend
   
   # Check if frontend is healthy
   curl http://localhost:3000/health
   ```

### Reset Everything

```bash
# Stop and remove all containers, networks, and volumes
docker-compose down -v --remove-orphans

# Remove all images (optional)
docker-compose down --rmi all

# Start fresh
docker-compose up -d --build
```

## 🔒 Security Considerations

1. **Change Default Passwords**: Update all default passwords in `.env`
2. **JWT Secret**: Use a strong, random JWT secret
3. **API Keys**: Keep your HuggingFace API key secure
4. **Network**: The application uses a private Docker network
5. **Non-root Users**: Containers run as non-root users for security

## 📊 Monitoring

### Health Checks

All services have health checks configured:
- MongoDB: `mongosh --eval "db.adminCommand('ping')"`
- Backend: `curl http://localhost:3001/api/health`
- Frontend: `curl http://localhost:3000/health`

### Logs

```bash
# View all logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f mongodb
```

## 🚀 Production Deployment

For production deployment:

1. **Update Environment Variables**:
   - Use strong passwords
   - Set `NODE_ENV=production`
   - Configure proper CORS origins

2. **Use Production Images**:
   ```bash
   docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
   ```

3. **Configure Reverse Proxy** (Nginx/Apache) for SSL termination

4. **Set up Monitoring** and logging

5. **Backup Strategy** for MongoDB data

## 📁 File Structure

```
├── docker-compose.yml          # Main Docker Compose configuration
├── docker-setup.sh            # Setup script for easy deployment
├── docker-dev.sh              # Development mode script
├── env.example                # Environment variables template
├── chatbot-backend/
│   ├── Dockerfile             # Backend container configuration
│   └── .dockerignore          # Backend ignore file
├── chatbot-frontend/
│   ├── Dockerfile             # Frontend container configuration
│   ├── nginx.conf             # Nginx configuration
│   └── .dockerignore          # Frontend ignore file
└── mongo-init/                # MongoDB initialization scripts
```

## 🤝 Contributing

1. Make changes to the application
2. Test with Docker setup
3. Update documentation if needed
4. Submit pull request

## 📞 Support

If you encounter any issues:

1. Check the troubleshooting section
2. View service logs
3. Check Docker and Docker Compose versions
4. Create an issue with detailed error information
