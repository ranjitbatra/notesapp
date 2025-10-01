// Audit logging utility

// Audit logging function
export function logUserAction(action, details = {}) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    action: action,
    user: 'current_user', // Will be replaced with actual user ID
    details: details,
    userAgent: navigator.userAgent,
    url: window.location.href
  };
  
  // Log to browser console (in production, send to CloudWatch or external service)
  console.log('AUDIT LOG:', JSON.stringify(logEntry, null, 2));
  
  // Store in localStorage for demo purposes (in production, use proper logging service)
  const existingLogs = JSON.parse(localStorage.getItem('auditLogs') || '[]');
  existingLogs.push(logEntry);
  // Keep only last 100 entries
  if (existingLogs.length > 100) {
    existingLogs.splice(0, existingLogs.length - 100);
  }
  localStorage.setItem('auditLogs', JSON.stringify(existingLogs));
}