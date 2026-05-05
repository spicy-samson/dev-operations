/**
 * composables/useUploads.ts
 *
 * Manages the full S3 presigned upload flow:
 *   1. presign  — get a presigned PUT URL from our API
 *   2. put      — PUT file bytes directly to S3
 *   3. confirm  — tell our API the upload succeeded/failed
 *
 * Also handles listing and deleting uploads.
 */
import type { Upload } from '~/server/db/schema'

export interface UploadItem extends Upload {
  url: string
}

export interface UploadProgress {
  file:       File
  uploadId:   string | null
  progress:   number          // 0–100
  status:     'idle' | 'presigning' | 'uploading' | 'confirming' | 'done' | 'error'
  error:      string | null
}

export function useUploads() {
  const uploadList = useState<UploadItem[]>('uploads', () => [])
  const loading    = ref(false)
  const error      = ref<string | null>(null)

  // ── Fetch all uploads ─────────────────────────────────────────────────

  async function fetchUploads() {
    loading.value = true
    error.value   = null
    try {
      const data = await $fetch<{ uploads: UploadItem[] }>('/api/uploads')
      uploadList.value = data.uploads
    } catch (err: any) {
      error.value = err?.data?.message ?? 'Failed to load uploads'
    } finally {
      loading.value = false
    }
  }

  // ── Upload a single file (full 3-step flow) ───────────────────────────

  async function uploadFile(
    file:      File,
    options?: { projectId?: string | null },
    onProgress?: (pct: number) => void,
  ): Promise<UploadItem> {
    // ── Step 1: Get presigned URL ────────────────────────────────────────
    onProgress?.(0)
    const presign = await $fetch<{
      uploadId:    string
      presignedUrl: string
      s3Key:       string
    }>('/api/uploads/presign', {
      method: 'POST',
      body: {
        fileName:  file.name,
        mimeType:  file.type || 'application/octet-stream',
        size:      file.size,
        projectId: options?.projectId ?? null,
      },
    })

    onProgress?.(10)

    // ── Step 2: PUT directly to S3 ───────────────────────────────────────
    // We use XMLHttpRequest instead of fetch so we get progress events
    await new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest()

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const pct = 10 + Math.round((e.loaded / e.total) * 80) // 10–90%
          onProgress?.(pct)
        }
      })

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve()
        } else {
          reject(new Error(`S3 upload failed: HTTP ${xhr.status}`))
        }
      })

      xhr.addEventListener('error', () => reject(new Error('Network error during upload')))
      xhr.addEventListener('abort', () => reject(new Error('Upload aborted')))

      xhr.open('PUT', presign.presignedUrl)
      xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream')
      xhr.send(file)
    })

    onProgress?.(90)

    // ── Step 3: Confirm with our API ─────────────────────────────────────
    const confirm = await $fetch<{ upload: UploadItem }>('/api/uploads/confirm', {
      method: 'POST',
      body: { uploadId: presign.uploadId, status: 'uploaded' },
    })

    onProgress?.(100)

    // Add to local list
    uploadList.value.unshift(confirm.upload)
    return confirm.upload
  }

  // ── Upload multiple files sequentially ───────────────────────────────

  async function uploadFiles(
    files:    File[],
    options?: { projectId?: string | null },
    onFileProgress?: (fileIndex: number, pct: number) => void,
  ): Promise<UploadItem[]> {
    const results: UploadItem[] = []
    for (let i = 0; i < files.length; i++) {
      const item = await uploadFile(
        files[i],
        options,
        (pct) => onFileProgress?.(i, pct),
      )
      results.push(item)
    }
    return results
  }

  // ── Delete an upload ──────────────────────────────────────────────────

  async function deleteUpload(id: string) {
    await $fetch(`/api/uploads/${id}`, { method: 'DELETE' })
    uploadList.value = uploadList.value.filter(u => u.id !== id)
  }

  // ── Helpers ───────────────────────────────────────────────────────────

  function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B'
    const k     = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i     = Math.floor(Math.log(bytes) / Math.log(k))
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
  }

  function fileIcon(mimeType: string): string {
    if (mimeType.startsWith('image/'))       return '🖼️'
    if (mimeType === 'application/pdf')      return '📄'
    if (mimeType === 'text/csv')             return '📊'
    if (mimeType.startsWith('text/'))        return '📝'
    if (mimeType.includes('spreadsheet'))   return '📊'
    if (mimeType.includes('wordprocessing')) return '📝'
    if (mimeType === 'application/zip')      return '🗜️'
    return '📎'
  }

  return {
    uploadList,
    loading,
    error,
    fetchUploads,
    uploadFile,
    uploadFiles,
    deleteUpload,
    formatBytes,
    fileIcon,
  }
}