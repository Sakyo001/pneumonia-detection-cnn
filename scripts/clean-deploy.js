/**
 * Clean-deploy script to remove large files before deployment
 * This script is called from package.json before build
 * Works on both Windows and Unix-like systems
 */

const fs = require('fs');
const path = require('path');

console.log('Running pre-deployment cleanup...');

// List of large files to remove before deployment
const largeFilesToRemove = [
  'best_model.pth',
  // Add other large files here
];

// Remove specific large files
largeFilesToRemove.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  
  try {
    if (fs.existsSync(filePath)) {
      console.log(`Removing large file: ${file}`);
      fs.unlinkSync(filePath);
      console.log(`Successfully removed ${file}`);
    } else {
      console.log(`File not found: ${file} - skipping`);
    }
  } catch (err) {
    console.error(`Error removing ${file}:`, err);
    // Don't fail the build if we can't remove a file
    console.log('Continuing with deployment...');
  }
});

// Function to recursively remove a directory
function removeDirectory(dirPath) {
  if (fs.existsSync(dirPath)) {
    fs.readdirSync(dirPath).forEach((file) => {
      const curPath = path.join(dirPath, file);
      if (fs.lstatSync(curPath).isDirectory()) {
        // Recursive call
        removeDirectory(curPath);
      } else {
        try {
          // Remove file
          fs.unlinkSync(curPath);
        } catch (error) {
          console.log(`Warning: Could not delete ${curPath}`, error.message);
        }
      }
    });
    try {
      fs.rmdirSync(dirPath);
    } catch (error) {
      console.log(`Warning: Could not remove directory ${dirPath}`, error.message);
    }
  }
}

// Check and remove large directories
const largeDirectoriesToRemove = [
  'pneumonia-ml',
  'output',
  'models'
];

largeDirectoriesToRemove.forEach(dir => {
  const dirPath = path.join(process.cwd(), dir);
  
  try {
    if (fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory()) {
      console.log(`Removing directory: ${dir}`);
      // Use our recursive directory deletion function
      removeDirectory(dirPath);
      console.log(`Successfully removed directory: ${dir}`);
    }
  } catch (err) {
    console.error(`Error removing directory ${dir}:`, err);
    // Don't fail the build if we can't remove a directory
    console.log('Continuing with deployment...');
  }
});

// Clean Next.js cache directory
const nextCachePath = path.join(process.cwd(), '.next', 'cache');
if (fs.existsSync(nextCachePath)) {
  console.log('Cleaning Next.js cache directory...');
  try {
    removeDirectory(nextCachePath);
    console.log('Successfully removed Next.js cache');
  } catch (err) {
    console.error('Error removing Next.js cache:', err);
  }
}

// Clean large Prisma files
const prismaDir = path.join(process.cwd(), 'generated', 'prisma');
if (fs.existsSync(prismaDir)) {
  console.log('Cleaning Prisma engine files...');
  
  // Find and remove Windows DLLs - they're particularly large
  const files = fs.readdirSync(prismaDir);
  files.forEach(file => {
    if (file.includes('query_engine-windows') || file.includes('libquery_engine')) {
      try {
        const filePath = path.join(prismaDir, file);
        fs.unlinkSync(filePath);
        console.log(`Removed large Prisma file: ${file}`);
      } catch (err) {
        console.error(`Error removing ${file}:`, err);
      }
    }
  });
}

// Clean large image files
const largeImages = [
  path.join(process.cwd(), 'public', 'large-assets')
  // Keep essential UI images
  // path.join(process.cwd(), 'public', 'images', 'bg.png'),
  // path.join(process.cwd(), 'public', 'images', 'bg2.jpg')
];

largeImages.forEach(imagePath => {
  if (fs.existsSync(imagePath)) {
    console.log(`Removing large image: ${imagePath}`);
    if (fs.statSync(imagePath).isDirectory()) {
      removeDirectory(imagePath);
    } else {
      fs.unlinkSync(imagePath);
    }
  }
});

console.log('Cleanup completed successfully'); 