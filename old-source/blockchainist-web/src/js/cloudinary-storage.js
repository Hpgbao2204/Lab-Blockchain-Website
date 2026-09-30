// Cloudinary Storage Solution for Blockchainist Web
// Complete image management system with CDN optimization

const CLOUDINARY_CONFIG = {
  cloudName: 'dmvqsv4xq', // Change to your Cloudinary cloud name
  uploadPreset: 'blockchainist-uploads', // Change to your upload preset
  folders: {
    avatars: 'blockchainist/avatars',
    banners: 'blockchainist/banners',
    gallery: 'blockchainist/gallery',
    icons: 'blockchainist/icons'
  },
  // Predefined transformations for common use cases
  transforms: {
    avatar: 'c_fill,g_face,h_150,w_150,q_auto,f_auto',
    avatarLarge: 'c_fill,g_face,h_300,w_300,q_auto,f_auto',
    thumbnail: 'c_fill,h_200,w_200,q_auto,f_auto',
    banner: 'c_fill,h_400,w_800,q_auto,f_auto',
    optimized: 'q_auto,f_auto',
    compressed: 'q_auto:low,f_auto,c_limit,w_800'
  }
};

// Core function to build Cloudinary URL with transformations
function buildCloudinaryUrl(publicId, transformation = 'q_auto,f_auto') {
  if (!publicId) return null;
  
  // Handle full URLs (already processed)
  if (publicId.startsWith('http')) {
    return publicId;
  }
  
  return `https://res.cloudinary.com/${CLOUDINARY_CONFIG.cloudName}/image/upload/${transformation}/${publicId}`;
}

// Upload single file to Cloudinary
async function uploadToCloudinary(file, folder = 'avatars', customName = null) {
  try {
    // Validate input
    if (!file) {
      throw new Error('Không có file để upload');
    }
    
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type.toLowerCase())) {
      throw new Error(`Định dạng file không được hỗ trợ. Chỉ chấp nhận: ${allowedTypes.map(t => t.split('/')[1].toUpperCase()).join(', ')}`);
    }
    
    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      throw new Error(`File quá lớn. Kích thước tối đa: ${(maxSize/1024/1024)}MB`);
    }
    
    // Create FormData for upload
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_CONFIG.uploadPreset);
    
    // Set folder
    const targetFolder = CLOUDINARY_CONFIG.folders[folder] || folder;
    formData.append('folder', targetFolder);
    
    // Set custom filename if provided
    if (customName) {
      const cleanName = customName.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
      const timestamp = Date.now();
      formData.append('public_id', `${targetFolder}/${cleanName}_${timestamp}`);
    }
    
    // Add tags for organization
    formData.append('tags', `blockchainist,${folder},web-upload`);
    
    // Upload to Cloudinary
    const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/image/upload`, {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Upload thất bại: ${errorData.error?.message || response.statusText}`);
    }
    
    const result = await response.json();
    
    // Process and return standardized result
    return {
      success: true,
      publicId: result.public_id,
      secureUrl: result.secure_url,
      url: result.url,
      // Generate optimized URLs for common use cases
      avatarUrl: buildCloudinaryUrl(result.public_id, CLOUDINARY_CONFIG.transforms.avatar),
      thumbnailUrl: buildCloudinaryUrl(result.public_id, CLOUDINARY_CONFIG.transforms.thumbnail),
      optimizedUrl: buildCloudinaryUrl(result.public_id, CLOUDINARY_CONFIG.transforms.optimized),
      // File metadata
      width: result.width,
      height: result.height,
      format: result.format,
      size: result.bytes,
      resourceType: result.resource_type,
      // Cloudinary metadata
      version: result.version,
      signature: result.signature,
      etag: result.etag,
      tags: result.tags || []
    };
    
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw error;
  }
}

// Upload multiple files with progress callback
async function uploadMultipleToCloudinary(files, folder = 'gallery', onProgress = null, onFileComplete = null) {
  if (!files || files.length === 0) {
    throw new Error('Không có file nào được chọn');
  }
  
  const results = [];
  const errors = [];
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    
    try {
      // Report progress
      if (onProgress) {
        onProgress({
          current: i + 1,
          total: files.length,
          filename: file.name,
          percentage: Math.round(((i + 1) / files.length) * 100)
        });
      }
      
      // Upload file
      const result = await uploadToCloudinary(file, folder, file.name.split('.')[0]);
      results.push(result);
      
      // Report individual file completion
      if (onFileComplete) {
        onFileComplete(result, i + 1);
      }
      
    } catch (error) {
      const errorInfo = {
        filename: file.name,
        index: i,
        error: error.message
      };
      errors.push(errorInfo);
      
      console.error(`Upload failed for ${file.name}:`, error);
    }
  }
  
  return {
    results,
    errors,
    totalFiles: files.length,
    successCount: results.length,
    errorCount: errors.length,
    successRate: Math.round((results.length / files.length) * 100)
  };
}

// Get optimized URL for different use cases
function getOptimizedUrl(publicId, useCase = 'optimized') {
  if (!publicId) return getPlaceholderUrl(useCase);
  
  const transformation = CLOUDINARY_CONFIG.transforms[useCase] || CLOUDINARY_CONFIG.transforms.optimized;
  return buildCloudinaryUrl(publicId, transformation);
}

// Get placeholder/default images
function getPlaceholderUrl(type = 'avatar', size = 150) {
  const placeholders = {
    avatar: `https://res.cloudinary.com/${CLOUDINARY_CONFIG.cloudName}/image/upload/c_fill,g_face,h_${size},w_${size},q_auto,f_auto/samples/people/smiling-man.jpg`,
    banner: `https://res.cloudinary.com/${CLOUDINARY_CONFIG.cloudName}/image/upload/c_fill,h_400,w_800,q_auto,f_auto/samples/landscapes/beach-boat.jpg`,
    thumbnail: `https://res.cloudinary.com/${CLOUDINARY_CONFIG.cloudName}/image/upload/c_fill,h_200,w_200,q_auto,f_auto/samples/food/spices.jpg`
  };
  
  return placeholders[type] || placeholders.avatar;
}

// Transform existing image URL
function transformImageUrl(url, transformation) {
  if (!url || !transformation) return url;
  
  // Check if it's already a Cloudinary URL
  if (url.includes('res.cloudinary.com')) {
    // Extract the public ID and rebuild with new transformation
    const parts = url.split('/image/upload/');
    if (parts.length === 2) {
      const pathParts = parts[1].split('/');
      // Remove any existing transformation parameters
      const publicId = pathParts.slice(1).join('/');
      return buildCloudinaryUrl(publicId, transformation);
    }
  }
  
  // If not Cloudinary URL, return as is
  return url;
}

// Delete image from Cloudinary (requires API credentials)
async function deleteFromCloudinary(publicId, apiKey = null, apiSecret = null) {
  try {
    if (!apiKey || !apiSecret) {
      console.warn('API credentials required for deletion. Image will remain in Cloudinary.');
      return { success: false, message: 'API credentials required' };
    }
    
    const timestamp = Math.round(Date.now() / 1000);
    
    // Create signature (simplified - in production use proper crypto library)
    const stringToSign = `public_id=${publicId}&timestamp=${timestamp}${apiSecret}`;
    
    const formData = new FormData();
    formData.append('public_id', publicId);
    formData.append('timestamp', timestamp);
    formData.append('api_key', apiKey);
    formData.append('signature', btoa(stringToSign).substring(0, 40)); // Simplified signature
    
    const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/image/destroy`, {
      method: 'POST',
      body: formData
    });
    
    const result = await response.json();
    
    return {
      success: result.result === 'ok',
      result: result.result,
      message: result.result === 'ok' ? 'Deleted successfully' : 'Deletion failed'
    };
    
  } catch (error) {
    console.error('Delete error:', error);
    return { success: false, message: error.message };
  }
}

// Utility function to generate unique filename
function generateUniqueFilename(originalName, prefix = '') {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const extension = originalName.split('.').pop().toLowerCase();
  const nameWithoutExt = originalName.replace(/\.[^/.]+$/, '');
  const safeName = nameWithoutExt.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
  
  const finalName = prefix ? 
    `${prefix}_${safeName}_${timestamp}_${random}` : 
    `${safeName}_${timestamp}_${random}`;
    
  return `${finalName}.${extension}`;
}

// Test image accessibility and load time
async function testImageLoad(url, timeout = 10000) {
  return new Promise((resolve, reject) => {
    if (!url) {
      reject(new Error('No URL provided'));
      return;
    }
    
    const img = new Image();
    const startTime = Date.now();
    
    const timer = setTimeout(() => {
      reject(new Error(`Image load timeout after ${timeout}ms`));
    }, timeout);
    
    img.onload = () => {
      clearTimeout(timer);
      const loadTime = Date.now() - startTime;
      resolve({
        success: true,
        loadTime,
        dimensions: { width: img.naturalWidth, height: img.naturalHeight },
        url
      });
    };
    
    img.onerror = () => {
      clearTimeout(timer);
      reject(new Error('Image failed to load'));
    };
    
    img.src = url;
  });
}

// Initialize and validate Cloudinary configuration
function initCloudinary() {
  const config = CLOUDINARY_CONFIG;
  
  console.log('☁️  Cloudinary Storage Initialized');
  console.log('📦 Cloud Name:', config.cloudName);
  console.log('🎛️  Upload Preset:', config.uploadPreset);
  console.log('📁 Folders:', Object.keys(config.folders).join(', '));
  console.log('🎨 Transformations:', Object.keys(config.transforms).length);
  
  // Validate configuration
  const warnings = [];
  if (config.cloudName === 'demo') {
    warnings.push('⚠️  Using demo cloud name - update for production');
  }
  if (config.uploadPreset === 'ml_default') {
    warnings.push('⚠️  Using default upload preset - create custom preset');
  }
  
  if (warnings.length > 0) {
    console.warn('Configuration Warnings:', warnings);
  }
  
  return {
    isConfigured: warnings.length === 0,
    warnings,
    config
  };
}

// Export functions for global access
if (typeof window !== 'undefined') {
  // Main functions
  window.uploadToCloudinary = uploadToCloudinary;
  window.uploadMultipleToCloudinary = uploadMultipleToCloudinary;
  window.deleteFromCloudinary = deleteFromCloudinary;
  
  // URL builders
  window.buildCloudinaryUrl = buildCloudinaryUrl;
  window.getOptimizedUrl = getOptimizedUrl;
  window.getPlaceholderUrl = getPlaceholderUrl;
  window.transformImageUrl = transformImageUrl;
  
  // Utilities
  window.generateUniqueFilename = generateUniqueFilename;
  window.testImageLoad = testImageLoad;
  window.initCloudinary = initCloudinary;
  
  // Configuration
  window.CLOUDINARY_CONFIG = CLOUDINARY_CONFIG;
}

// ES6 Module exports
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    uploadToCloudinary,
    uploadMultipleToCloudinary,
    deleteFromCloudinary,
    buildCloudinaryUrl,
    getOptimizedUrl,
    getPlaceholderUrl,
    transformImageUrl,
    generateUniqueFilename,
    testImageLoad,
    initCloudinary,
    CLOUDINARY_CONFIG
  };
}

// Auto-initialize on load
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    initCloudinary();
  });
}