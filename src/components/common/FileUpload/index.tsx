import { useRef, useState, useCallback } from 'react'
import './styles.css'

export interface FileAttachment {
  id: string
  name: string
  type: string
  size: number
  sizeFormatted: string
  dateAdded: string
}

export interface FileUploadProps {
  files: FileAttachment[]
  onChange: (files: FileAttachment[]) => void
  accept?: string
  multiple?: boolean
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

const getFileIcon = (type: string) => {
  if (type.includes('pdf')) {
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="file-upload-icon pdf">
        <rect x="4" y="2" width="16" height="20" rx="2" fill="#E53935"/>
        <text x="12" y="15" textAnchor="middle" fill="white" fontSize="6" fontWeight="bold">PDF</text>
      </svg>
    )
  }
  if (type.includes('image')) {
    return (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="file-upload-icon image">
        <rect x="4" y="2" width="16" height="20" rx="2" fill="#4CAF50"/>
        <circle cx="9" cy="9" r="2" fill="white"/>
        <path d="M6 18l4-5 3 3 5-6v8H6z" fill="white"/>
      </svg>
    )
  }
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="file-upload-icon doc">
      <rect x="4" y="2" width="16" height="20" rx="2" fill="#607D8B"/>
      <line x1="8" y1="8" x2="16" y2="8" stroke="white" strokeWidth="1.5"/>
      <line x1="8" y1="12" x2="16" y2="12" stroke="white" strokeWidth="1.5"/>
      <line x1="8" y1="16" x2="12" y2="16" stroke="white" strokeWidth="1.5"/>
    </svg>
  )
}

const TrashIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
)

const DownloadIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
)

export const FileUpload = ({ files, onChange, accept, multiple = true }: FileUploadProps) => {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  const handleFiles = useCallback((fileList: FileList | null) => {
    if (!fileList) return

    const newFiles: FileAttachment[] = Array.from(fileList).map(file => ({
      id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: file.name,
      type: file.type,
      size: file.size,
      sizeFormatted: formatFileSize(file.size),
      dateAdded: new Date().toISOString(),
    }))

    onChange([...files, ...newFiles])
  }, [files, onChange])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    handleFiles(e.dataTransfer.files)
  }, [handleFiles])

  const handleClick = () => {
    inputRef.current?.click()
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files)
    // Reset input value to allow selecting the same file again
    e.target.value = ''
  }

  const handleRemove = (fileId: string) => {
    onChange(files.filter(f => f.id !== fileId))
  }

  return (
    <div className="file-upload">
      <div
        className={`file-upload-dropzone ${isDragging ? 'dragging' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input
          ref={inputRef}
          type="file"
          className="file-upload-input"
          accept={accept}
          multiple={multiple}
          onChange={handleInputChange}
        />
        <span className="file-upload-text">
          Click <span className="file-upload-link">here</span> or drag file to this area
        </span>
        <span className="file-upload-hint">You can select one or a few files</span>
      </div>

      {files.length > 0 && (
        <div className="file-upload-list">
          {files.map(file => (
            <div key={file.id} className="file-upload-item">
              <div className="file-upload-item-preview">
                {getFileIcon(file.type)}
              </div>
              <div className="file-upload-item-info">
                <span className="file-upload-item-name" title={file.name}>
                  {file.name.length > 15 ? file.name.substring(0, 12) + '...' : file.name}
                </span>
                <span className="file-upload-item-type">
                  {file.type.split('/')[1]?.toUpperCase() || 'FILE'}
                </span>
              </div>
              <div className="file-upload-item-actions">
                <button
                  type="button"
                  className="file-upload-item-btn download"
                  title="Download"
                >
                  <DownloadIcon />
                </button>
                <button
                  type="button"
                  className="file-upload-item-btn delete"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleRemove(file.id)
                  }}
                  title="Remove"
                >
                  <TrashIcon />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default FileUpload
