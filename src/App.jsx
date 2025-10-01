import { useState } from "react";
import { Amplify } from "aws-amplify";
import { Authenticator } from "@aws-amplify/ui-react";
import "@aws-amplify/ui-react/styles.css";
import outputs from "../amplify_outputs.json";
import "./App.css";
import logo from "./assets/atal.jpg";

// Components
import { NoteModal } from "./components/NoteModal";
import { NotesTable } from "./components/NotesTable";
import { GuideModal } from "./components/GuideModal";

// Hooks
import { useNotes } from "./hooks/useNotes";

// Utils
import { logUserAction } from "./utils/auditLogger";

Amplify.configure(outputs);

function App() {
  const [showModal, setShowModal] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  
  // Use custom hook for notes management
  const {
    notes,
    selectedNotes,
    setSelectedNotes,
    editingNote,
    setEditingNote,
    sortOrder,
    createNote,
    updateNote,
    deleteSelectedNotes,
    toggleSort,
    handleUserChange
  } = useNotes();

  // Event handlers
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
    setSelectedNotes([]);
  }

  function handleNoteSubmit(noteData, files) {
    if (editingNote) {
      updateNote(noteData, files);
    } else {
      createNote(noteData, files);
    }
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
      {({ signOut, user }) => {
        // Handle user changes for isolation
        handleUserChange(user);
        
        return (
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
          
          {/* Notes Table */}
          <NotesTable 
            notes={notes}
            selectedNotes={selectedNotes}
            onSelectNote={handleSelectNote}
            onSelectAll={handleSelectAll}
            onUpdateNote={handleUpdateNote}
            onDeleteNotes={deleteSelectedNotes}
            sortOrder={sortOrder}
            onToggleSort={toggleSort}
          />

          {/* Note Modal */}
          <NoteModal 
            isOpen={showModal}
            onClose={closeModal}
            onSubmit={handleNoteSubmit}
            editingNote={editingNote}
            title={editingNote ? 'Update Note' : 'Create New Note'}
          />

          {/* Guide Modal */}
          <GuideModal 
            isOpen={showAbout}
            onClose={() => setShowAbout(false)}
          />
        </main>
        );
      }}
    </Authenticator>
  );
}

export default App;
