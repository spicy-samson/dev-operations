<template>
  <div>
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Uploads</h1>
        <p class="text-sm text-gray-500 mt-0.5">{{ uploadList.length }} file{{ uploadList.length !== 1 ? 's' : '' }}</p>
      </div>
    </div>

    <!-- Drop zone -->
    <div
      class="border-2 border-dashed rounded-xl p-10 text-center mb-6 transition-colors cursor-pointer"
      :class="isDragging
        ? 'border-gray-900 bg-gray-50'
        : 'border-gray-300 hover:border-gray-400 bg-white'"
      @dragover.prevent="isDragging = true"
      @dragleave.prevent="isDragging = false"
      @drop.prevent="handleDrop"
      @click="fileInput?.click()"
    >
      <p class="text-2xl mb-2">📂</p>
      <p class="text-sm font-medium text-gray-700">
        {{ isDragging ? 'Drop files here' : 'Click or drag files to upload' }}
      </p>
      <p class="text-xs text-gray-400 mt-1">
        Images, PDFs, CSV, DOCX, XLSX, ZIP — max 50 MB each
      </p>
      <input
        ref="fileInput"
        type="file"
        multiple
        class="hidden"
        @change="handleFileInput"
      />
    </div>

    <!-- Active uploads (progress) -->
    <div v-if="activeUploads.length > 0" class="space-y-2 mb-6">
      <div
        v-for="(item, i) in activeUploads"
        :key="i"
        class="bg-white rounded-xl border border-gray-200 px-4 py-3"
      >
        <div class="flex items-center justify-between mb-1.5">
          <div class="flex items-center gap-2 min-w-0">
            <span>{{ fileIcon(item.file.type) }}</span>
            <span class="text-sm font-medium text-gray-800 truncate">{{ item.file.name }}</span>
            <span class="text-xs text-gray-400 shrink-0">{{ formatBytes(item.file.size) }}</span>
          </div>
          <span class="text-xs font-medium ml-2 shrink-0" :class="statusColor(item.status)">
            {{ statusLabel(item.status, item.progress) }}
          </span>
        </div>
        <!-- Progress bar -->
        <div class="h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            class="h-full rounded-full transition-all duration-300"
            :class="item.status === 'error' ? 'bg-red-400' : item.status === 'done' ? 'bg-green-400' : 'bg-gray-800'"
            :style="{ width: `${item.progress}%` }"
          />
        </div>
        <p v-if="item.error" class="text-xs text-red-500 mt-1">{{ item.error }}</p>
      </div>
    </div>

    <!-- Upload list -->
    <div v-if="loading" class="text-sm text-gray-400 py-12 text-center">Loading…</div>

    <div
      v-else-if="uploadList.length === 0 && activeUploads.length === 0"
      class="text-center py-16 bg-white rounded-xl border border-gray-200"
    >
      <p class="text-gray-400 text-sm">No uploads yet. Drop some files above.</p>
    </div>

    <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      <div
        v-for="upload in uploadList"
        :key="upload.id"
        class="bg-white rounded-xl border border-gray-200 p-4 group hover:border-gray-300 transition"
      >
        <!-- Preview for images -->
        <div v-if="upload.mimeType.startsWith('image/')" class="mb-3">
          <img
            :src="upload.url"
            :alt="upload.fileName"
            class="w-full h-32 object-cover rounded-lg bg-gray-50"
            loading="lazy"
          />
        </div>
        <!-- Icon for non-images -->
        <div v-else class="flex items-center justify-center h-20 bg-gray-50 rounded-lg mb-3 text-3xl">
          {{ fileIcon(upload.mimeType) }}
        </div>

        <!-- File info -->
        <p class="text-sm font-medium text-gray-900 truncate mb-0.5">{{ upload.fileName }}</p>
        <p class="text-xs text-gray-400 mb-3">{{ formatBytes(upload.size) }} · {{ formatDate(upload.createdAt) }}</p>

        <!-- Actions -->
        <div class="flex items-center gap-2">
          <a
            :href="upload.url"
            target="_blank"
            rel="noopener noreferrer"
            class="flex-1 text-center text-xs px-3 py-1.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
          >
            View
          </a>
          <button
            @click="confirmDelete(upload)"
            class="text-xs px-3 py-1.5 text-red-400 hover:text-red-600 border border-transparent hover:border-red-200 rounded-lg transition opacity-0 group-hover:opacity-100"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { UploadItem, UploadProgress } from '~/composables/useUploads'

definePageMeta({ layout: 'app', middleware: 'auth' })

const { uploadList, loading, fetchUploads, uploadFiles, deleteUpload, formatBytes, fileIcon } = useUploads()

const fileInput    = ref<HTMLInputElement | null>(null)
const isDragging   = ref(false)
const activeUploads = ref<UploadProgress[]>([])

onMounted(fetchUploads)

// ── File picking ──────────────────────────────────────────────────────────

function handleDrop(e: DragEvent) {
  isDragging.value = false
  const files = Array.from(e.dataTransfer?.files ?? [])
  if (files.length) startUploads(files)
}

function handleFileInput(e: Event) {
  const files = Array.from((e.target as HTMLInputElement).files ?? [])
  if (files.length) startUploads(files)
  // Reset input so the same file can be re-uploaded
  if (fileInput.value) fileInput.value.value = ''
}

// ── Upload orchestration ──────────────────────────────────────────────────

async function startUploads(files: File[]) {
  // Add a progress entry for each file
  const startIndex = activeUploads.value.length
  files.forEach(file => {
    activeUploads.value.push({ file, uploadId: null, progress: 0, status: 'presigning', error: null })
  })

  for (let i = 0; i < files.length; i++) {
    const idx   = startIndex + i
    const entry = activeUploads.value[idx]

    try {
      entry.status = 'uploading'
      await uploadFiles(
        [files[i]],
        {},
        (_fileIdx, pct) => {
          entry.progress = pct
          if (pct >= 90) entry.status = 'confirming'
        },
      )
      entry.status   = 'done'
      entry.progress = 100
    } catch (err: any) {
      entry.status = 'error'
      entry.error  = err?.data?.message ?? err?.message ?? 'Upload failed'
    }
  }

  // Remove completed entries after 3 seconds
  setTimeout(() => {
    activeUploads.value = activeUploads.value.filter(u => u.status === 'error')
  }, 3000)
}

// ── Delete ────────────────────────────────────────────────────────────────

async function confirmDelete(upload: UploadItem) {
  if (!confirm(`Delete "${upload.fileName}"? This cannot be undone.`)) return
  try {
    await deleteUpload(upload.id)
  } catch {
    alert('Failed to delete file.')
  }
}

// ── Formatting ────────────────────────────────────────────────────────────

function formatDate(date: string | Date) {
  return new Date(date).toLocaleDateString('en-PH', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
}

function statusLabel(status: UploadProgress['status'], progress: number) {
  switch (status) {
    case 'presigning':  return 'Preparing…'
    case 'uploading':   return `${progress}%`
    case 'confirming':  return 'Finishing…'
    case 'done':        return '✓ Done'
    case 'error':       return '✗ Failed'
    default:            return ''
  }
}

function statusColor(status: UploadProgress['status']) {
  switch (status) {
    case 'done':   return 'text-green-600'
    case 'error':  return 'text-red-500'
    default:       return 'text-gray-500'
  }
}
</script>