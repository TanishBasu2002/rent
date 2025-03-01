#!/bin/bash
# setup.sh - Script to set up the Next.js application with MySQL and Prisma

# Create Next.js app
echo "Creating Next.js application..."
npx create-next-app@latest . --typescript --eslint --tailwind --app

# Install dependencies
echo "Installing dependencies..."
npm install prisma @prisma/client mysql2 

# Development dependencies
npm install -D ts-node @types/node

# Initialize Prisma
echo "Initializing Prisma..."
npx prisma init

# Create .env file
echo "Creating .env file..."
cat > .env << EOL
# Environment variables
DATABASE_URL="mysql://user:password@localhost:3306/nextapp"
EOL

# Copy the Prisma schema
echo "Setting up Prisma schema..."
# (This is already provided in the prisma-schema artifact)

# Create a script to run migrations
echo "Creating database setup script..."
cat > scripts/setup-db.js << EOL
const { execSync } = require('child_process');

async function main() {
  console.log('Running Prisma migrations...');
  execSync('npx prisma migrate dev --name init', { stdio: 'inherit' });
  
  console.log('Generating Prisma client...');
  execSync('npx prisma generate', { stdio: 'inherit' });
  
  console.log('Database setup complete!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  });
EOL

# Create Docker helper scripts
echo "Creating Docker helper scripts..."

cat > docker-dev.sh << EOL
#!/bin/bash
# Start the development environment
docker-compose up -d
EOL

cat > docker-prod.sh << EOL
#!/bin/bash
# Build and start the production environment
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
EOL

chmod +x docker-dev.sh docker-prod.sh

echo "Setup complete! 🚀"