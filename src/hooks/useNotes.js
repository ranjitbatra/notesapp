import { useState, useEffect } from 'react';
import { generateClient } from 'aws-amplify/data';
import { uploadData, getUrl, remove } from 'aws-amplify/storage';
import { parseFiles, createFileObject, sanitizeFilename } from '../utils/fileUtils';
import { logUserAction } from '../utils/auditLogger';

const client = generateClient();

export function useNotes() {
  const [notes, setNotes] = useState([]);
  const [selectedNotes, setSelectedNotes] = useState([]);
  const [editingNote, setEditingNote] = useState(null);
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentUser, setCurrentUser] = useState(null);

  // Fetch user's notes
  async function fetchNotes() {
    console.log('Fetching notes...');
    const { data: notes } = await client.models.Note.list();
    console.log('Fetched notes:', notes);
    
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

  // Create new note
  async function createNote(noteData, files) {
    // Create note first
    const { data: newNote } = await client.models.Note.create({
      name: noteData.name,
      description: noteData.description,
      files: [], // Start with empty files array
    });

    // Handle multiple file uploads
    if (files.length > 0) {
      const fileObjects = [];
      
      // Upload each file and create file objects
      for (const file of files) {
        const fileId = 'file_' + crypto.randomUUID();
        const result = await uploadData({
          path: ({ identityId }) => `media/${identityId}/${fileId}_${sanitizeFilename(file.name)}`,
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
      noteName: noteData.name,
      fileCount: files.length,
      fileNames: files.map(f => f.name)
    });
    
    fetchNotes();
  }

  // Update existing note
  async function updateNote(updatedData, files) {
    // Handle multiple file uploads
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
            path: ({ identityId }) => `media/${identityId}/${fileId}_${sanitizeFilename(file.name)}`,
            data: file,
          }).result;
          
          // Replace in array
          updatedFiles[existingFileIndex] = createFileObject(file, result.path);
        } else {
          // Add new file (different name)
          const fileId = 'file_' + crypto.randomUUID();
          const result = await uploadData({
            path: ({ identityId }) => `media/${identityId}/${fileId}_${sanitizeFilename(file.name)}`,
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
    
    fetchNotes();
  }

  // Delete selected notes
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

  // Toggle sort order
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

  // Handle user change for isolation
  function handleUserChange(user) {
    const userId = user?.signInDetails?.loginId || user?.username;
    console.log('Current user:', currentUser, 'New user:', userId, 'Full user object:', user);
    if (currentUser !== userId) {
      console.log('User changed, clearing state and fetching notes');
      setCurrentUser(userId);
      setNotes([]);
      setSelectedNotes([]);
      setEditingNote(null);
      // Fetch notes for the new user
      fetchNotes();
    }
  }

  useEffect(() => {
    fetchNotes();
  }, [sortOrder]);

  return {
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
    handleUserChange,
    fetchNotes
  };
}