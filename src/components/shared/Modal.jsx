// src/components/shared/Modal.jsx
// ---------------------------------------------------------------
// Reusable Modal Dialog Component
//
// LEARNING CONCEPTS:
// 1. Props — data passed from parent to child component
// 2. children — the content between opening and closing tags
// 3. Event handling — stopping click propagation
// 4. Portal — rendering outside the normal component tree
//    (createPortal ensures the modal is always on top)
// ---------------------------------------------------------------

import React, { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

// USAGE in parent component:
// <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Add Material">
//   <p>Modal content goes here</p>
// </Modal>

export default function Modal({ isOpen, onClose, title, children, size = 'md' }) {
  // Close modal on Escape key press
  // useEffect with cleanup — learn about this pattern:
  // The function returned from useEffect is the "cleanup" function.
  // It runs when the component unmounts (or before the next effect runs).
  useEffect(() => {
    if (!isOpen) return
    
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
    }
    
    // Add event listener when modal opens
    document.addEventListener('keydown', handleKeyDown)
    
    // Cleanup: remove event listener when modal closes
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const maxWidths = {
    sm: '400px',
    md: '560px',
    lg: '720px',
    xl: '900px',
  }

  // createPortal renders the modal into document.body instead of
  // inside the normal component tree. This ensures the modal overlay
  // always covers the full screen, regardless of parent CSS.
  return createPortal(
    <div
      className="modal-overlay"
      // Clicking the dark overlay closes the modal
      onClick={onClose}
    >
      <div
        className="modal-box"
        style={{ maxWidth: maxWidths[size] }}
        // stopPropagation prevents the click from reaching the overlay
        // So clicking inside the modal won't close it
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2 className="modal-title">{title}</h2>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        
        {/* children = whatever is nested between <Modal>...</Modal> tags */}
        {children}
      </div>
    </div>,
    document.body  // Target: render into document.body
  )
}
