import { useState } from 'react';

export function NoteModal({ isOpen, onClose, onSubmit, editingNote, title }) {
  const [formData, setFormData] = useState({
    name: editingNote?.name || '',
    description: editingNote?.description || ''
  });

  const handleSubmit = (event) => {
    event.preventDefault();
    const form = new FormData(event.target);
    const files = Array.from(event.target.files.files || []);
    
    onSubmit({
      id: editingNote?.id,
      name: form.get("name"),
      description: form.get("description"),
    }, files);
    
    onClose();
    event.target.reset();
  };

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
        width: '500px', 
        maxWidth: '90vw' 
      }}>
        <h3 style={{ marginTop: 0, color: '#333' }}>{title}</h3>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '15px' }}>
            <input
              name="name"
              placeholder="Note name"
              type="text"
              required
              defaultValue={editingNote ? editingNote.name : ''}
              style={{ 
                padding: '10px', 
                width: '100%', 
                border: '1px solid #ddd', 
                borderRadius: '4px' 
              }}
            />
          </div>
          <div style={{ marginBottom: '15px' }}>
            <textarea
              name="description"
              placeholder="Note description"
              required
              defaultValue={editingNote ? editingNote.description : ''}
              style={{ 
                padding: '10px', 
                width: '100%', 
                minHeight: '80px', 
                border: '1px solid #ddd', 
                borderRadius: '4px', 
                resize: 'vertical' 
              }}
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
            <button 
              type="button" 
              onClick={onClose} 
              style={{ 
                padding: '10px 20px', 
                backgroundColor: '#6c757d', 
                color: 'white', 
                border: 'none', 
                borderRadius: '4px' 
              }}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              style={{ 
                padding: '10px 20px', 
                backgroundColor: '#007bff', 
                color: 'white', 
                border: 'none', 
                borderRadius: '4px' 
              }}
            >
              {editingNote ? 'Update Note' : 'Create Note'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}