// File utility functions

// Helper function to sanitize filename for secure path creation
export function sanitizeFilename(filename) {
  if (!filename) return 'unnamed_file';
  return filename
    .replace(/[/\\:*?"<>|]/g, '_')  // Replace dangerous chars
    .replace(/\.\./g, '_')           // Replace .. sequences
    .replace(/^\.+/, '')             // Remove leading dots
    .substring(0, 255);              // Limit length
}

// Helper function to get file type icon
export function getFileIcon(filename) {
  if (!filename) return '📎';
  const ext = filename.split('.').pop().toLowerCase();
  const icons = {
    // Documents
    pdf: '📄',
    doc: '📝', docx: '📝',
    xls: '📊', xlsx: '📊',
    ppt: '📋', pptx: '📋',
    txt: '📃',
    // Archives
    zip: '📦', rar: '📦', '7z': '📦',
    // Images (keep for reference)
    png: '🖼️', jpg: '🖼️', jpeg: '🖼️', gif: '🖼️',
    // Other
    csv: '📈',
    json: '📋',
    xml: '📋'
  };
  return icons[ext] || '📎';
}

// Helper function to check if file is an image
export function isImageFile(filename) {
  if (!filename) return false;
  const ext = filename.split('.').pop().toLowerCase();
  return ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp'].includes(ext);
}

// Helper function to create file object with unique ID
export function createFileObject(file, s3Path) {
  return {
    id: 'file_' + crypto.randomUUID(),
    filename: file.name,
    s3Path: s3Path,
    size: file.size,
    type: file.type,
    uploadedAt: new Date().toISOString()
  };
}

// Helper function to parse files from DynamoDB
export function parseFiles(filesArray) {
  if (!filesArray || !Array.isArray(filesArray)) return [];
  return filesArray.map(fileStr => {
    try {
      return JSON.parse(fileStr);
    } catch {
      return null;
    }
  }).filter(Boolean);
}