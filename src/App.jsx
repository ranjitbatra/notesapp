import { useState, useEffect } from "react";
import { Amplify } from "aws-amplify";
import { generateClient } from "aws-amplify/data";
import { uploadData, getUrl, remove } from "aws-amplify/storage";
import { Authenticator } from "@aws-amplify/ui-react";
import "@aws-amplify/ui-react/styles.css";
import outputs from "../amplify_outputs.json";
import "./App.css";
import logo from "./assets/atal.jpg";

Amplify.configure(outputs);
const client = generateClient();

// Helper function to get file type icon
function getFileIcon(filename) {
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
function isImageFile(filename) {
  if (!filename) return false;
  const ext = filename.split('.').pop().toLowerCase();
  return ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp'].includes(ext);
}

// Helper function to create file object with unique ID
function createFileObject(file, s3Path) {
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
function parseFiles(filesArray) {
  if (!filesArray || !Array.isArray(filesArray)) return [];
  return filesArray.map(fileStr => {
    try {
      return JSON.parse(fileStr);
    } catch {
      return null;
    }
  }).filter(Boolean);
}

// Audit logging function
function logUserAction(action, details = {}) {
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

function App() {
  const [notes, setNotes] = useState([]);
  const [selectedNotes, setSelectedNotes] = useState([]);
  const [editingNote, setEditingNote] = useState(null);
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc' or 'desc'
  const [showModal, setShowModal] = useState(false);
  const [showAbout, setShowAbout] = useState(false);

  useEffect(() => {
    fetchNotes();
  }, []);

  async function fetchNotes() {
    const { data: notes } = await client.models.Note.list();
    await Promise.all(
      notes.map(async (note) => {
        // Parse files from JSON strings
        const parsedFiles = parseFiles(note.files);
        
        // Get URLs for all files
        note.fileObjects = await Promise.all(
          parsedFiles.map(async (fileObj) => {
            try {
              const linkToStorageFile = await getUrl({ path: fileObj.s3Path });
              return {
                ...fileObj,
                url: linkToStorageFile.url
              };
            } catch (error) {
              console.error('Error getting file URL:', error);
              return fileObj; // Return without URL if error
            }
          })
        );
        
        return note;
      })
    );
    
    // Sort notes by createdAt in current sort order
    const sortedNotes = notes.sort((a, b) => {
      const dateA = new Date(a.createdAt);
      const dateB = new Date(b.createdAt);
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });
    setNotes(sortedNotes);
  }

  async function createNote(event) {
    event.preventDefault();
    const form = new FormData(event.target);
    
    const noteName = form.get("name");
    const noteDescription = form.get("description");
    
    // Create note first
    const { data: newNote } = await client.models.Note.create({
      name: noteName,
      description: noteDescription,
      files: [], // Start with empty files array
    });

    // Handle multiple file uploads
    const fileInput = form.get("files");
    const files = fileInput ? Array.from(event.target.files.files) : [];
    
    if (files.length > 0) {
      const fileObjects = [];
      
      // Upload each file and create file objects
      for (const file of files) {
        const fileId = 'file_' + crypto.randomUUID();
        const result = await uploadData({
          path: ({ identityId }) => `media/${identityId}/${fileId}_${file.name}`,
          data: file,
        }).result;
        
        const fileObject = createFileObject(file, result.path);
        fileObjects.push(JSON.stringify(fileObject));
      }
      
      // Update note with files
      await client.models.Note.update({
        id: newNote.id,
        files: fileObjects,
      });
    }
    
    // Log the action
    logUserAction('CREATE_NOTE', {
      noteId: newNote.id,
      noteName: noteName,
      fileCount: files.length,
      fileNames: files.map(f => f.name)
    });
    
    closeModal();
    fetchNotes();
    event.target.reset();
  }

  async function deleteNote({ id, imagePath, name }) {
    const confirmed = window.confirm(`Notes name ${name} >>> will be deleted do you want to continue`);
    if (confirmed) {
      const toBeDeletedNote = { id };
      const { data: deletedNote } = await client.models.Note.delete(toBeDeletedNote);
      if (imagePath) {
        await remove({ path: imagePath });
      }
      fetchNotes();
      window.location.reload();
    }
  }

  async function deleteSelectedNotes() {
    if (selectedNotes.length === 0) {
      alert('Please select notes to delete');
      return;
    }
    
    const noteNames = selectedNotes.map(id => notes.find(note => note.id === id)?.name).join(', ');
    const confirmed = window.confirm(`Selected notes: ${noteNames} >>> will be deleted do you want to continue`);
    
    if (confirmed) {
      const deletedNotes = selectedNotes.map(id => notes.find(note => note.id === id));
      
      await Promise.all(selectedNotes.map(async (noteId) => {
        const note = notes.find(n => n.id === noteId);
        if (note) {
          await client.models.Note.delete({ id: noteId });
          if (note.imagePath) {
            await remove({ path: note.imagePath });
          }
        }
      }));
      
      // Log the action
      logUserAction('DELETE_NOTES_BULK', {
        noteCount: deletedNotes.length,
        noteNames: deletedNotes.map(note => note?.name).filter(Boolean)
      });
      
      setSelectedNotes([]);
      window.location.reload();
    }
  }

  function handleSelectNote(noteId, isChecked) {
    if (isChecked) {
      setSelectedNotes([...selectedNotes, noteId]);
    } else {
      setSelectedNotes(selectedNotes.filter(id => id !== noteId));
    }
  }

  function handleSelectAll(isChecked) {
    if (isChecked) {
      setSelectedNotes(notes.map(note => note.id));
    } else {
      setSelectedNotes([]);
    }
  }

  function handleUpdateNote() {
    if (selectedNotes.length !== 1) {
      alert('Please select exactly one note to update');
      return;
    }
    const noteToEdit = notes.find(note => note.id === selectedNotes[0]);
    setEditingNote(noteToEdit);
    setShowModal(true);
  }

  function openCreateModal() {
    setEditingNote(null);
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditingNote(null);
  }

  async function updateNote(event) {
    event.preventDefault();
    const form = new FormData(event.target);
    
    const updatedData = {
      id: editingNote.id,
      name: form.get("name"),
      description: form.get("description"),
    };

    // Handle multiple file uploads
    const fileInput = form.get("files");
    const files = fileInput ? Array.from(event.target.files.files) : [];
    
    if (files.length > 0) {
      // Start with existing files
      const existingFiles = editingNote.fileObjects || [];
      const updatedFiles = [...existingFiles];
      
      // Process each new file
      for (const file of files) {
        // Check if file with same name already exists
        const existingFileIndex = updatedFiles.findIndex(fileObj => fileObj.filename === file.name);
        
        if (existingFileIndex !== -1) {
          // Replace existing file with same name
          const oldFile = updatedFiles[existingFileIndex];
          
          // Delete old file from S3
          await remove({ path: oldFile.s3Path }).catch(console.error);
          
          // Upload new file
          const fileId = 'file_' + crypto.randomUUID();
          const result = await uploadData({
            path: ({ identityId }) => `media/${identityId}/${fileId}_${file.name}`,
            data: file,
          }).result;
          
          // Replace in array
          updatedFiles[existingFileIndex] = createFileObject(file, result.path);
        } else {
          // Add new file (different name)
          const fileId = 'file_' + crypto.randomUUID();
          const result = await uploadData({
            path: ({ identityId }) => `media/${identityId}/${fileId}_${file.name}`,
            data: file,
          }).result;
          
          // Add to array
          updatedFiles.push(createFileObject(file, result.path));
        }
      }
      
      // Convert to JSON strings for DynamoDB
      updatedData.files = updatedFiles.map(fileObj => JSON.stringify(fileObj));
    }

    await client.models.Note.update(updatedData);
    
    // Log the action
    logUserAction('UPDATE_NOTE', {
      noteId: editingNote.id,
      noteName: updatedData.name,
      fileCount: files.length,
      fileNames: files.map(f => f.name)
    });
    
    closeModal();
    setSelectedNotes([]);
    fetchNotes();
  }

  function cancelEdit() {
    closeModal();
  }

  function toggleSort() {
    const newOrder = sortOrder === 'desc' ? 'asc' : 'desc';
    setSortOrder(newOrder);
    const sortedNotes = [...notes].sort((a, b) => {
      const dateA = new Date(a.createdAt);
      const dateB = new Date(b.createdAt);
      return newOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });
    setNotes(sortedNotes);
    
    // Log the action
    logUserAction('SORT_NOTES', { sortOrder: newOrder });
  }

  return (
    <Authenticator
      components={{
        Header() {
          return (
            <div className="auth-header">
              <div className="auth-header-content">
                <img src={logo} alt="Smart Notes Vault" className="auth-logo" />
                <h1 className="auth-title">Smart Notes Vault</h1>
              </div>
              <p className="auth-subtitle">Professional Notes Management Platform</p>
            </div>
          );
        },
        Footer() {
          return (
            <div className="auth-footer">
              <div className="trust-indicators">
                <div className="trust-item">
                  <span className="trust-icon">👥</span>
                  <span>Professional Notes Management</span>
                </div>
                <div className="trust-item">
                  <span className="trust-icon">☁️</span>
                  <span>Built on AWS Platform</span>
                </div>
                <div className="trust-item">
                  <span className="trust-icon">🔒</span>
                  <span>Secure Cloud Storage</span>
                </div>
                <div className="trust-item">
                  <span className="trust-icon">📱</span>
                  <span>Access Anywhere</span>
                </div>
              </div>
              <div className="value-props">
                <div className="value-item">✅ Completely Serverless</div>
                <div className="value-item">✅ Multi-Device Access</div>
              </div>
            </div>
          );
        }
      }}
    >
      {({ signOut, user }) => (
        <main style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
            <img src={logo} alt="Smart Notes Vault Logo" style={{ width: '50px', height: '50px', marginRight: '15px', borderRadius: '8px' }} />
            <h1 
              style={{ color: '#333', margin: '0', cursor: 'help' }}
              title="Smart Notes Vault SaaS - Enterprise-grade notes management platform. Features: Multiple files per note with smart versioning, Universal file support (PDF, Word, Excel, Images with thumbnails), Bulk operations, Real-time sorting, AWS Cognito authentication, Complete user data isolation, Encrypted S3 storage, Serverless auto-scaling architecture. Useful for Healthcare, Legal, Education, Real Estate, Manufacturing, Consulting, Research, Personal organization, and Small Business. Click Guide button for detailed instructions."
            >
              Smart Notes Vault SaaS
            </h1>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ color: '#666', margin: '0' }}>Hello User - {user.signInDetails?.loginId || user.username}</h2>
            <div>
              <button onClick={() => { setShowAbout(true); logUserAction('VIEW_GUIDE'); }} style={{ padding: '10px 20px', backgroundColor: '#6f42c1', color: 'white', border: 'none', borderRadius: '4px', marginRight: '10px' }}>📚 Guide</button>
              <button onClick={openCreateModal} style={{ padding: '10px 20px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', marginRight: '10px' }}>+ Create Note</button>
              <button onClick={signOut} style={{ padding: '10px 20px' }}>Sign out</button>
            </div>
          </div>
          

          
          <div style={{ maxHeight: '80vh', overflowY: 'auto', border: '1px solid #ddd', borderRadius: '5px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <thead>
              <tr style={{ backgroundColor: '#007bff', color: 'white' }}>
                <th style={{ padding: '15px', textAlign: 'center', border: '1px solid #ddd', width: '50px' }}>
                  <input 
                    type="checkbox" 
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    checked={selectedNotes.length === notes.length && notes.length > 0}
                  />
                </th>
                <th style={{ padding: '15px', textAlign: 'left', border: '1px solid #ddd', width: '60px' }}>#</th>
                <th style={{ padding: '15px', textAlign: 'left', border: '1px solid #ddd', width: '200px' }}>Note Name</th>
                <th style={{ padding: '15px', textAlign: 'left', border: '1px solid #ddd' }}>Description</th>
                <th style={{ padding: '15px', textAlign: 'left', border: '1px solid #ddd', width: '150px' }}>File Name</th>
                <th 
                  style={{ 
                    padding: '15px', 
                    textAlign: 'center', 
                    border: '1px solid #ddd', 
                    width: '180px',
                    cursor: 'pointer',
                    userSelect: 'none'
                  }}
                  onClick={toggleSort}
                >
                  Date & Time {sortOrder === 'desc' ? '↓' : '↑'}
                </th>
                <th style={{ padding: '15px', textAlign: 'center', border: '1px solid #ddd', width: '150px' }}>File Attached</th>
              </tr>
              {selectedNotes.length > 0 && (
                <tr style={{ backgroundColor: '#fff3cd' }}>
                  <td colSpan="7" style={{ padding: '15px', textAlign: 'center' }}>
                    <button 
                      onClick={handleUpdateNote}
                      style={{ 
                        padding: '10px 20px', 
                        backgroundColor: '#28a745', 
                        color: 'white', 
                        border: 'none', 
                        borderRadius: '4px', 
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: 'bold',
                        marginRight: '10px'
                      }}
                    >
                      Update Selected Note
                    </button>
                    <button 
                      onClick={deleteSelectedNotes}
                      style={{ 
                        padding: '10px 20px', 
                        backgroundColor: '#dc3545', 
                        color: 'white', 
                        border: 'none', 
                        borderRadius: '4px', 
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: 'bold'
                      }}
                    >
                      Delete Selected ({selectedNotes.length}) Notes
                    </button>
                  </td>
                </tr>
              )}
            </thead>
            <tbody>
              {notes.map((note, index) => (
                <tr key={note.id} style={{ backgroundColor: index % 2 === 0 ? '#f8f9fa' : 'white' }}>
                  <td style={{ padding: '15px', border: '1px solid #ddd', textAlign: 'center' }}>
                    <input 
                      type="checkbox" 
                      checked={selectedNotes.includes(note.id)}
                      onChange={(e) => handleSelectNote(note.id, e.target.checked)}
                    />
                  </td>
                  <td style={{ padding: '15px', border: '1px solid #ddd', fontWeight: 'bold', color: '#666' }}>{index + 1}</td>
                  <td style={{ padding: '15px', border: '1px solid #ddd', fontWeight: '600', color: '#333' }}>{note.name}</td>
                  <td style={{ padding: '15px', border: '1px solid #ddd', color: '#666' }}>{note.description}</td>
                  <td style={{ padding: '15px', border: '1px solid #ddd', color: '#333' }}>
                    {note.fileObjects && note.fileObjects.length > 0 ? (
                      <div>
                        <span style={{ fontSize: '14px', fontWeight: 'bold' }}>
                          {note.fileObjects.length} file{note.fileObjects.length > 1 ? 's' : ''}
                        </span>
                        <br />
                        <span style={{ fontSize: '12px', color: '#666' }}>
                          {note.fileObjects[0].filename}
                          {note.fileObjects.length > 1 && ` +${note.fileObjects.length - 1} more`}
                        </span>
                      </div>
                    ) : (
                      <span style={{ color: '#999', fontStyle: 'italic' }}>No files</span>
                    )}
                  </td>
                  <td style={{ padding: '15px', border: '1px solid #ddd', textAlign: 'center', fontSize: '12px', color: '#666' }}>
                    {new Date(note.createdAt).toLocaleString()}
                  </td>
                  <td style={{ padding: '15px', border: '1px solid #ddd', textAlign: 'center' }}>
                    {note.fileObjects && note.fileObjects.length > 0 ? (
                      <div style={{ display: 'flex', gap: '5px', justifyContent: 'center', flexWrap: 'wrap' }}>
                        {note.fileObjects.slice(0, 3).map((fileObj, idx) => (
                          <div key={fileObj.id || idx}>
                            {isImageFile(fileObj.filename) ? (
                              <img
                                src={fileObj.url}
                                alt={fileObj.filename}
                                style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px', cursor: 'pointer' }}
                                onClick={() => window.open(fileObj.url, '_blank')}
                                title={fileObj.filename}
                              />
                            ) : (
                              <div 
                                style={{ 
                                  fontSize: '24px', 
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  width: '40px',
                                  height: '40px'
                                }}
                                onClick={() => window.open(fileObj.url, '_blank')}
                                title={fileObj.filename}
                              >
                                {getFileIcon(fileObj.filename)}
                              </div>
                            )}
                          </div>
                        ))}
                        {note.fileObjects.length > 3 && (
                          <div style={{ 
                            fontSize: '12px', 
                            color: '#666',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '40px',
                            height: '40px',
                            border: '1px dashed #ccc',
                            borderRadius: '4px'
                          }}>
                            +{note.fileObjects.length - 3}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span style={{ color: '#999', fontStyle: 'italic' }}>No files</span>
                    )}
                  </td>
                </tr>
              ))}
              {notes.length === 0 && (
                <tr>
                  <td colSpan="7" style={{ padding: '30px', textAlign: 'center', color: '#999', fontStyle: 'italic' }}>
                    No notes created yet. Create your first note above!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          </div>

          {/* Modal */}
          {showModal && (
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
              <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '8px', width: '500px', maxWidth: '90vw' }}>
                <h3 style={{ marginTop: 0, color: '#333' }}>{editingNote ? 'Update Note' : 'Create New Note'}</h3>
                <form onSubmit={editingNote ? updateNote : createNote}>
                  <div style={{ marginBottom: '15px' }}>
                    <input
                      name="name"
                      placeholder="Note name"
                      type="text"
                      required
                      defaultValue={editingNote ? editingNote.name : ''}
                      style={{ padding: '10px', width: '100%', border: '1px solid #ddd', borderRadius: '4px' }}
                    />
                  </div>
                  <div style={{ marginBottom: '15px' }}>
                    <textarea
                      name="description"
                      placeholder="Note description"
                      required
                      defaultValue={editingNote ? editingNote.description : ''}
                      style={{ padding: '10px', width: '100%', minHeight: '80px', border: '1px solid #ddd', borderRadius: '4px', resize: 'vertical' }}
                    />
                  </div>
                  <div style={{ marginBottom: '20px' }}>
                    <input
                      name="files"
                      type="file"
                      accept="*/*"
                      multiple
                      style={{ width: '100%', padding: '5px' }}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                    <button type="button" onClick={closeModal} style={{ padding: '10px 20px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '4px' }}>
                      Cancel
                    </button>
                    <button type="submit" style={{ padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px' }}>
                      {editingNote ? 'Update Note' : 'Create Note'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Guide Modal */}
          {showAbout && (
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
              <div style={{ backgroundColor: 'white', padding: '30px', borderRadius: '8px', width: '700px', maxWidth: '90vw', maxHeight: '80vh', overflowY: 'auto' }}>
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
                  <button onClick={() => setShowAbout(false)} style={{ padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px' }}>
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      )}
    </Authenticator>
  );
}

export default App;
