"use client"

import { useState, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Upload, X, FileImage, FileVideo, File as FileIcon, Loader2, AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react'
import { useGlobalTranslation } from '@/components/translation-provider'
import { cn } from '@/lib/utils'

interface FileUploadV2Props {
  onFilesChange?: (files: File[]) => void
  maxFiles?: number
  maxSizeMB?: number
  acceptedTypes?: string[]
  disabled?: boolean
  className?: string
}

interface UploadedFile {
  file: File
  preview?: string
  progress: number
  status: 'pending' | 'uploading' | 'success' | 'error'
  error?: string
  url?: string
}

export function FileUploadV2({
  onFilesChange,
  maxFiles = 5,
  maxSizeMB = 10,
  acceptedTypes = ['image/*', 'video/*'],
  disabled = false,
  className
}: FileUploadV2Props) {
  const { t } = useGlobalTranslation()
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Convert MB to bytes
  const maxSizeBytes = maxSizeMB * 1024 * 1024

  const validateFile = (file: File): string | null => {
    // Check file size
    if (file.size > maxSizeBytes) {
      return t('fileTooLarge', `File size must be less than ${maxSizeMB}MB`)
    }

    // Check file type
    const fileType = file.type
    const isAccepted = acceptedTypes.some(type => {
      if (type.endsWith('/*')) {
        const baseType = type.split('/')[0]
        return fileType.startsWith(baseType + '/')
      }
      return fileType === type
    })

    if (!isAccepted) {
      return t('fileTypeNotAccepted', 'File type not accepted')
    }

    return null
  }

  const createPreview = (file: File): Promise<string | undefined> => {
    return new Promise((resolve) => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onloadend = () => resolve(reader.result as string)
        reader.onerror = () => resolve(undefined)
        reader.readAsDataURL(file)
      } else {
        resolve(undefined)
      }
    })
  }

  const uploadFile = async (uploadedFile: UploadedFile): Promise<UploadedFile> => {
    const { file } = uploadedFile

    try {
      // Simulate upload progress
      for (let progress = 0; progress <= 100; progress += 20) {
        await new Promise(resolve => setTimeout(resolve, 100))
        setUploadedFiles(prev => 
          prev.map(f => 
            f.file === file 
              ? { ...f, progress, status: 'uploading' as const }
              : f
          )
        )
      }

      // Convert to data URL as fallback (since Supabase storage might not be configured)
      const reader = new FileReader()
      const dataUrl = await new Promise<string>((resolve, reject) => {
        reader.onloadend = () => resolve(reader.result as string)
        reader.onerror = reject
        reader.readAsDataURL(file)
      })

      return {
        ...uploadedFile,
        status: 'success',
        progress: 100,
        url: dataUrl
      }
    } catch (error) {
      console.error('Upload error:', error)
      return {
        ...uploadedFile,
        status: 'error',
        error: t('uploadFailed', 'Upload failed. Please try again.')
      }
    }
  }

  const handleFiles = async (files: FileList | File[]) => {
    const fileArray = Array.from(files)
    
    // Check max files limit
    if (uploadedFiles.length + fileArray.length > maxFiles) {
      alert(t('maxFilesExceeded', `You can only upload up to ${maxFiles} files`))
      return
    }

    // Validate and prepare files
    const newFiles: UploadedFile[] = []
    for (const file of fileArray) {
      const error = validateFile(file)
      if (error) {
        alert(`${file.name}: ${error}`)
        continue
      }

      const preview = await createPreview(file)
      newFiles.push({
        file,
        preview,
        progress: 0,
        status: 'pending'
      })
    }

    if (newFiles.length === 0) return

    // Add to state
    setUploadedFiles(prev => [...prev, ...newFiles])

    // Upload files
    const uploadPromises = newFiles.map(uploadFile)
    const results = await Promise.all(uploadPromises)

    // Update state with results
    setUploadedFiles(prev => {
      const updated = prev.map(existing => {
        const result = results.find(r => r.file === existing.file)
        return result || existing
      })

      // Notify parent of successful uploads
      const successfulFiles = updated
        .filter(f => f.status === 'success')
        .map(f => f.file)
      
      onFilesChange?.(successfulFiles)
      
      return updated
    })
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files)
    }
  }

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!disabled) {
      setIsDragging(true)
    }
  }, [disabled])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    if (disabled) return

    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      handleFiles(files)
    }
  }, [disabled])

  const removeFile = (fileToRemove: UploadedFile) => {
    setUploadedFiles(prev => {
      const updated = prev.filter(f => f.file !== fileToRemove.file)
      const successfulFiles = updated
        .filter(f => f.status === 'success')
        .map(f => f.file)
      onFilesChange?.(successfulFiles)
      return updated
    })
  }

  const retryUpload = async (fileToRetry: UploadedFile) => {
    setUploadedFiles(prev => 
      prev.map(f => 
        f.file === fileToRetry.file
          ? { ...f, status: 'pending' as const, progress: 0, error: undefined }
          : f
      )
    )

    const result = await uploadFile(fileToRetry)
    
    setUploadedFiles(prev => {
      const updated = prev.map(f => f.file === result.file ? result : f)
      const successfulFiles = updated
        .filter(f => f.status === 'success')
        .map(f => f.file)
      onFilesChange?.(successfulFiles)
      return updated
    })
  }

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return <FileImage className="w-5 h-5" />
    if (file.type.startsWith('video/')) return <FileVideo className="w-5 h-5" />
    return <FileIcon className="w-5 h-5" />
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Upload Area */}
      <Card
        className={cn(
          "relative transition-all duration-200 cursor-pointer",
          isDragging && "border-blue-500 bg-blue-50 dark:bg-blue-950/20 shadow-lg",
          disabled && "opacity-50 cursor-not-allowed"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
      >
        <div className="p-8 text-center">
          <Upload className={cn(
            "w-12 h-12 mx-auto mb-4 transition-colors",
            isDragging ? "text-blue-600" : "text-muted-foreground"
          )} />
          
          <p className="text-base font-medium mb-1">
            {isDragging 
              ? t('dropFilesHere', 'Drop files here')
              : t('dragAndDropFiles', 'Drag and drop files here')}
          </p>
          
          <p className="text-sm text-muted-foreground mb-4">
            {t('orClickToBrowse', 'or click to browse')}
          </p>

          <div className="text-xs text-muted-foreground space-y-1">
            <p>{t('acceptedTypes', `Accepted: ${acceptedTypes.join(', ')}`)}</p>
            <p>{t('maxFiles', `Max ${maxFiles} files, ${maxSizeMB}MB each`)}</p>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={acceptedTypes.join(',')}
            onChange={handleFileInput}
            disabled={disabled}
            className="hidden"
          />
        </div>
      </Card>

      {/* Uploaded Files List */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">
            {t('uploadedFiles', 'Uploaded Files')} ({uploadedFiles.length}/{maxFiles})
          </p>
          
          <div className="space-y-2">
            {uploadedFiles.map((uploadedFile, index) => (
              <Card key={index} className="p-3">
                <div className="flex items-start gap-3">
                  {/* Preview or Icon */}
                  <div className="flex-shrink-0">
                    {uploadedFile.preview ? (
                      <img 
                        src={uploadedFile.preview} 
                        alt={uploadedFile.file.name}
                        className="w-12 h-12 object-cover rounded"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                        {getFileIcon(uploadedFile.file)}
                      </div>
                    )}
                  </div>

                  {/* File Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {uploadedFile.file.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(uploadedFile.file.size)}
                    </p>

                    {/* Progress Bar */}
                    {uploadedFile.status === 'uploading' && (
                      <div className="mt-2">
                        <Progress value={uploadedFile.progress} className="h-1" />
                        <p className="text-xs text-muted-foreground mt-1">
                          {uploadedFile.progress}%
                        </p>
                      </div>
                    )}

                    {/* Success */}
                    {uploadedFile.status === 'success' && (
                      <div className="flex items-center gap-1 mt-1 text-green-600">
                        <CheckCircle2 className="w-3 h-3" />
                        <span className="text-xs">{t('uploaded', 'Uploaded')}</span>
                      </div>
                    )}

                    {/* Error */}
                    {uploadedFile.status === 'error' && (
                      <div className="mt-1">
                        <div className="flex items-center gap-1 text-red-600">
                          <AlertCircle className="w-3 h-3" />
                          <span className="text-xs">{uploadedFile.error}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            retryUpload(uploadedFile)
                          }}
                          className="h-6 px-2 mt-1 text-xs"
                        >
                          <RefreshCw className="w-3 h-3 mr-1" />
                          {t('retry', 'Retry')}
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Remove Button */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 flex-shrink-0"
                    onClick={(e) => {
                      e.stopPropagation()
                      removeFile(uploadedFile)
                    }}
                    disabled={uploadedFile.status === 'uploading'}
                  >
                    {uploadedFile.status === 'uploading' ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <X className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
