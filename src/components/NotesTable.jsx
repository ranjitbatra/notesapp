import { getFileIcon, isImageFile } from '../utils/fileUtils';

export function NotesTable({ 
  notes, 
  selectedNotes, 
  onSelectNote, 
  onSelectAll, 
  onUpdateNote, 
  onDeleteNotes, 
  sortOrder, 
  onToggleSort 
}) {
  return (
    <div style={{ maxHeight: '80vh', overflowY: 'auto', border: '1px solid #ddd', borderRadius: '5px' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <thead>
          <tr style={{ backgroundColor: '#007bff', color: 'white' }}>
            <th style={{ padding: '15px', textAlign: 'center', border: '1px solid #ddd', width: '50px' }}>
              <input 
                type="checkbox" 
                onChange={(e) => onSelectAll(e.target.checked)}
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
              onClick={onToggleSort}
            >
              Date & Time {sortOrder === 'desc' ? '↓' : '↑'}
            </th>
            <th style={{ padding: '15px', textAlign: 'center', border: '1px solid #ddd', width: '150px' }}>File Attached</th>
          </tr>
          {selectedNotes.length > 0 && (
            <tr style={{ backgroundColor: '#fff3cd' }}>
              <td colSpan="7" style={{ padding: '15px', textAlign: 'center' }}>
                <button 
                  onClick={onUpdateNote}
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
                  onClick={onDeleteNotes}
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
                  onChange={(e) => onSelectNote(note.id, e.target.checked)}
                />
              </td>
              <td style={{ padding: '15px', border: '1px solid #ddd', fontWeight: 'bold', color: '#666' }}>
                {index + 1}
              </td>
              <td style={{ padding: '15px', border: '1px solid #ddd', fontWeight: '600', color: '#333' }}>
                {note.name}
              </td>
              <td style={{ padding: '15px', border: '1px solid #ddd', color: '#666' }}>
                {note.description}
              </td>
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
  );
}