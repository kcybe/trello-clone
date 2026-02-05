/**
 * Postinstall script to create symlink for Prisma client
 * This is needed for Prisma v7+ with custom output paths
 */

const fs = require('fs');
const path = require('path');

const prismaClientPath = path.join(__dirname, '..', 'node_modules', '@prisma', 'client');
const prismaClientPrismaPath = path.join(prismaClientPath, '.prisma');
const targetPath = path.join(__dirname, '..', '.prisma', 'client');

// Create .prisma directory if it doesn't exist
if (!fs.existsSync(prismaClientPrismaPath)) {
  fs.mkdirSync(prismaClientPrismaPath, { recursive: true });
}

// Create symlink to the generated Prisma client
if (!fs.existsSync(path.join(prismaClientPrismaPath, 'client'))) {
  try {
    // Use relative path for cross-platform compatibility
    const relativeTarget = path.relative(prismaClientPrismaPath, targetPath);
    fs.symlinkSync(relativeTarget, path.join(prismaClientPrismaPath, 'client'));
    console.log('✅ Prisma client symlink created successfully');
  } catch (err) {
    // Ignore if already exists
    if (err.code !== 'EEXIST') {
      console.error('❌ Failed to create symlink:', err.message);
    }
  }
}
