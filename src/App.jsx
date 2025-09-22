import { useState, useEffect } from "react";
import { Amplify } from "aws-amplify";
import { generateClient } from "aws-amplify/data";
import { uploadData, getUrl, remove } from "aws-amplify/storage";
import { Authenticator } from "@aws-amplify/ui-react";
import "@aws-amplify/ui-react/styles.css";
import outputs from "../amplify_outputs.json";
import "./App.css";

Amplify.configure(outputs);
const client = generateClient();

function App() {
  const [notes, setNotes] = useState([]);
  const [selectedNotes, setSelectedNotes] = useState([]);
  const [editingNote, setEditingNote] = useState(null);

  useEffect(() => {
    fetchNotes();
  }, []);

  async function fetchNotes() {
    const { data: notes } = await client.models.Note.list();
    await Promise.all(
      notes.map(async (note) => {
        if (note.image) {
          const linkToStorageFile = await getUrl({
            path: note.image,
          });
          note.image = linkToStorageFile.url;
        }
        return note;
      })
    );
    setNotes(notes);
  }

  async function createNote(event) {
    event.preventDefault();
    const form = new FormData(event.target);
    const { data: newNote } = await client.models.Note.create({
      name: form.get("name"),
      description: form.get("description"),
    });

    const image = form.get("image");
    if (image.size) {
      const result = await uploadData({
        path: ({ identityId }) => `media/${identityId}/${image.name}`,
        data: image,
      }).result;
      const { data: updatedNote } = await client.models.Note.update({
        id: newNote.id,
        image: result.path,
      });
      newNote.image = updatedNote.image;
    }
    fetchNotes();
    event.target.reset();
  }

  async function deleteNote({ id, image, name }) {
    const confirmed = window.confirm(`Notes name ${name} >>> will be deleted do you want to continue`);
    if (confirmed) {
      const toBeDeletedNote = { id };
      const { data: deletedNote } = await client.models.Note.delete(toBeDeletedNote);
      if (image) {
        await remove({ path: image });
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
      await Promise.all(selectedNotes.map(async (noteId) => {
        const note = notes.find(n => n.id === noteId);
        if (note) {
          await client.models.Note.delete({ id: noteId });
          if (note.image) {
            await remove({ path: note.image });
          }
        }
      }));
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
  }

  async function updateNote(event) {
    event.preventDefault();
    const form = new FormData(event.target);
    
    const updatedData = {
      id: editingNote.id,
      name: form.get("name"),
      description: form.get("description"),
    };

    const image = form.get("image");
    if (image.size) {
      const result = await uploadData({
        path: ({ identityId }) => `media/${identityId}/${image.name}`,
        data: image,
      }).result;
      updatedData.image = result.path;
    }

    await client.models.Note.update(updatedData);
    setEditingNote(null);
    setSelectedNotes([]);
    window.location.reload();
  }

  function cancelEdit() {
    setEditingNote(null);
  }

  return (
    <Authenticator>
      {({ signOut, user }) => (
        <main style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
          <h1 style={{ color: '#333' }}>AtalCloud Notes App</h1>
          <button onClick={signOut} style={{ marginBottom: '20px', padding: '10px' }}>Sign out</button>
          <h2 style={{ color: '#666' }}>Hello User - {user.signInDetails?.loginId || user.username}</h2>
          
          <form onSubmit={editingNote ? updateNote : createNote} style={{ marginBottom: '30px', padding: '20px', border: '1px solid #ddd', borderRadius: '5px' }}>
            <table style={{ width: '100%' }}>
              <tbody>
                <tr>
                  <td style={{ width: '50%', padding: '10px' }}>
                    <input
                      name="name"
                      placeholder="Note name"
                      type="text"
                      required
                      defaultValue={editingNote ? editingNote.name : ''}
                      style={{ padding: '10px', width: '100%' }}
                    />
                  </td>
                  <td style={{ width: '50%', padding: '10px' }}>
                    <input
                      name="image"
                      type="file"
                      accept="image/png, image/jpeg"
                      style={{ width: '100%' }}
                    />
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: '10px' }}>
                    <input
                      name="description"
                      placeholder="Note description"
                      type="text"
                      required
                      defaultValue={editingNote ? editingNote.description : ''}
                      style={{ padding: '10px', width: '100%' }}
                    />
                  </td>
                  <td style={{ padding: '10px' }}>
                    <button type="submit" style={{ padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '3px', width: '100%' }}>
                      {editingNote ? 'Update Note' : 'Create Note'}
                    </button>
                    {editingNote && (
                      <button type="button" onClick={cancelEdit} style={{ padding: '10px 20px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '3px', width: '100%', marginTop: '5px' }}>
                        Cancel
                      </button>
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </form>
          
          <div style={{ maxHeight: '60vh', overflowY: 'auto', border: '1px solid #ddd', borderRadius: '5px' }}>
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
                <th style={{ padding: '15px', textAlign: 'center', border: '1px solid #ddd', width: '150px' }}>File Attached</th>
              </tr>
              {selectedNotes.length > 0 && (
                <tr style={{ backgroundColor: '#fff3cd' }}>
                  <td colSpan="5" style={{ padding: '15px', textAlign: 'center' }}>
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
                  <td style={{ padding: '15px', border: '1px solid #ddd', textAlign: 'center' }}>
                    {note.image ? (
                      <img
                        src={note.image}
                        alt={`Attachment for ${note.name}`}
                        style={{ width: '80px', height: '60px', objectFit: 'cover', borderRadius: '4px', cursor: 'pointer' }}
                        onClick={() => window.open(note.image, '_blank')}
                      />
                    ) : (
                      <span style={{ color: '#999', fontStyle: 'italic' }}>No file</span>
                    )}
                  </td>
                </tr>
              ))}
              {notes.length === 0 && (
                <tr>
                  <td colSpan="5" style={{ padding: '30px', textAlign: 'center', color: '#999', fontStyle: 'italic' }}>
                    No notes created yet. Create your first note above!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          </div>
        </main>
      )}
    </Authenticator>
  );
}

export default App;
