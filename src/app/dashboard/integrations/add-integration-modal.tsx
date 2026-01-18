'use client'

import { useState } from 'react'

interface AddIntegrationModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export default function AddIntegrationModal({ open, onOpenChange, onSuccess }: AddIntegrationModalProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg max-w-md w-full">
        <h2 className="text-2xl font-bold mb-4">Add Integration</h2>
        <p className="text-muted-foreground mb-4">
          Integration modal coming soon. This will allow you to add OAuth credentials for advertising platforms.
        </p>
        <button
          onClick={() => onOpenChange(false)}
          className="bg-primary text-white px-4 py-2 rounded"
        >
          Close
        </button>
      </div>
    </div>
  )
}
