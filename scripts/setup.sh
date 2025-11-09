#!/bin/bash

# Personal Blog Setup Script
# This script helps you set up the development environment quickly

set -e

echo "🚀 Setting up Personal Blog Development Environment..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ All prerequisites are met!"

# Copy environment file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "✅ Environment file created. Please update it with your configuration."
else
    echo "✅ Environment file already exists."
fi

# Choose setup method
echo ""
echo "Choose setup method:"
echo "1) Docker (Recommended)"
echo "2) Local Development"
echo "3) Both (Install dependencies and set up Docker)"
read -p "Enter your choice (1-3): " choice

case $choice in
    1)
        echo "🐳 Setting up with Docker..."
        docker-compose up -d db redis
        echo "⏳ Waiting for database to be ready..."
        sleep 10

        echo "🔧 Running database migrations..."
        docker-compose run --rm app npm run db:migrate

        echo "🌱 Seeding database with sample data..."
        docker-compose run --rm app npm run db:seed

        echo "🚀 Starting application..."
        docker-compose up -d app

        echo "✅ Setup complete! Your blog is running at http://localhost:3000"
        ;;
    2)
        echo "💻 Setting up local development..."
        echo "📦 Installing dependencies..."
        npm install

        echo "🐳 Starting database services..."
        docker-compose up -d db redis
        echo "⏳ Waiting for database to be ready..."
        sleep 10

        echo "🔧 Generating Prisma client..."
        npm run db:generate

        echo "🔧 Running database migrations..."
        npm run db:migrate

        echo "🌱 Seeding database with sample data..."
        npm run db:seed

        echo "🚀 Starting development server..."
        npm run dev

        echo "✅ Setup complete! Your blog is running at http://localhost:3000"
        ;;
    3)
        echo "🔧 Setting up both environments..."
        echo "📦 Installing dependencies..."
        npm install

        echo "🐳 Setting up Docker services..."
        docker-compose up -d

        echo "⏳ Waiting for services to be ready..."
        sleep 15

        echo "🔧 Running database migrations..."
        npm run db:migrate

        echo "🌱 Seeding database with sample data..."
        npm run db:seed

        echo "✅ Setup complete! Your blog is running at http://localhost:3000"
        echo "💡 Use 'npm run dev' for local development or 'docker-compose up' for Docker"
        ;;
    *)
        echo "❌ Invalid choice. Exiting."
        exit 1
        ;;
esac

echo ""
echo "🎉 Setup completed successfully!"
echo ""
echo "📚 Next steps:"
echo "1. Visit http://localhost:3000 to see your blog"
echo "2. Update .env file with your configuration"
echo "3. Customize the blog content and styling"
echo "4. Check the README.md for more information"
echo ""
echo "🛠️ Useful commands:"
echo "- npm run dev          - Start development server"
echo "- npm run build        - Build for production"
echo "- npm run db:studio    - Open Prisma Studio"
echo "- npm run docker:down  - Stop Docker services"
echo "- npm run lint         - Run code linting"
echo "- npm run format       - Format code"