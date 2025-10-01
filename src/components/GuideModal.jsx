export function GuideModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div style={{ 
      position: 'fixed', 
      top: 0, 
      left: 0, 
      right: 0, 
      bottom: 0, 
      backgroundColor: 'rgba(0,0,0,0.5)', 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      zIndex: 1000 
    }}>
      <div style={{ 
        backgroundColor: 'white', 
        padding: '30px', 
        borderRadius: '8px', 
        width: '700px', 
        maxWidth: '90vw', 
        maxHeight: '80vh', 
        overflowY: 'auto' 
      }}>
        <h3 style={{ marginTop: 0, color: '#333' }}>📚 Smart Notes Vault - User Guide</h3>
        <div style={{ marginBottom: '20px', color: '#333', textAlign: 'left' }}>
          <h4 style={{ color: '#007bff' }}>How to Use:</h4>
          <ul style={{ fontSize: '14px', color: '#333', lineHeight: '1.6' }}>
            <li><strong>Create Notes:</strong> Click "+ Create Note" button, fill in name and description, attach multiple files of any type</li>
            <li><strong>File Management:</strong> Select multiple files during creation or update. Same filename replaces old file, different filename adds new file</li>
            <li><strong>Update Notes:</strong> Select exactly one note with checkbox, click "Update Selected Note" to modify content or add/replace files</li>
            <li><strong>Bulk Delete:</strong> Select multiple notes with checkboxes, click "Delete Selected" to remove multiple notes at once</li>
            <li><strong>Sort & View:</strong> Click "Date & Time" header to toggle ascending/descending sort. Click file icons to open/download files</li>
          </ul>
          
          <h4 style={{ color: '#28a745' }}>Advanced File Features:</h4>
          <ul style={{ fontSize: '14px', color: '#333', lineHeight: '1.6' }}>
            <li><strong>Universal Support:</strong> Upload any file type - documents, images, archives, spreadsheets, presentations</li>
            <li><strong>Smart Versioning:</strong> Upload file with same name to replace old version. Different name adds to collection</li>
            <li><strong>Visual Previews:</strong> Images show thumbnails, documents show type-specific icons (PDF 📄, Word 📝, Excel 📊)</li>
            <li><strong>File Counter:</strong> See total file count per note. View primary filename plus "+ X more" indicator</li>
            <li><strong>Direct Access:</strong> Click any file icon or thumbnail to instantly open/download from secure S3 storage</li>
            <li><strong>Auto Cleanup:</strong> Files automatically removed from S3 when notes are deleted - no orphaned files</li>
          </ul>
          
          <h4 style={{ color: '#dc3545' }}>Enterprise Security:</h4>
          <ul style={{ fontSize: '14px', color: '#333', lineHeight: '1.6' }}>
            <li><strong>Authentication:</strong> AWS Cognito email-based login with password requirements and email verification</li>
            <li><strong>Data Isolation:</strong> Complete user separation - you only see your notes, files stored in your private S3 folder</li>
            <li><strong>Encrypted Storage:</strong> All files encrypted at rest in Amazon S3 with server-side encryption</li>
            <li><strong>Serverless Security:</strong> No servers to hack - fully managed AWS infrastructure with enterprise-grade security</li>
            <li><strong>Compliance Ready:</strong> Built on AWS compliance frameworks (GDPR, SOC2, HIPAA-eligible architecture)</li>
          </ul>
          
          <h4 style={{ color: '#6f42c1' }}>Technical Benefits:</h4>
          <ul style={{ fontSize: '14px', color: '#333', lineHeight: '1.6' }}>
            <li><strong>Modular Architecture:</strong> Clean, maintainable code with separated components and utilities</li>
            <li><strong>Auto-scaling:</strong> Handles 1 user to 1 million users without configuration changes</li>
            <li><strong>Zero Maintenance:</strong> No servers to manage, patch, or monitor - AWS handles everything</li>
            <li><strong>Cost Effective:</strong> Pay only for what you use, stays within AWS free tier for typical usage</li>
            <li><strong>Global Performance:</strong> Fast response times worldwide with AWS global infrastructure</li>
            <li><strong>Real-time Updates:</strong> Changes appear instantly across all your devices and browser tabs</li>
          </ul>
          
          <div style={{ backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '5px', color: '#333', textAlign: 'left' }}>
            <strong>Useful for:</strong> Healthcare (patient records), Legal (case files), Education (student portfolios), Real Estate (property reports), Manufacturing (quality logs), Consulting (project docs), Research (data collection), Personal (document organization), Small Business (client files), and any scenario requiring secure note-taking with file attachments
          </div>
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <button 
            onClick={onClose} 
            style={{ 
              padding: '10px 20px', 
              backgroundColor: '#007bff', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px' 
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}