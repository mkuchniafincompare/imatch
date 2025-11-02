'use client'

import React, { useState, useEffect } from 'react'
import { STRENGTH_LABEL, getStrengthOrder } from '@/config/ageStrength'

type Props = {
  open: boolean
  onClose: () => void
  onSave: (data: EditOfferData) => Promise<void>
  offer: {
    id: string
    offerDate?: string | null
    kickoffTime?: string | null
    kickoffFlexible?: boolean
    strength?: string | null
    playForm?: string | null
    durationText?: string | null
    homeAway?: string
    fieldType?: string
    notes?: string | null
  }
}

export type EditOfferData = {
  offerDate?: string
  kickoffTime?: string
  kickoffFlexible?: boolean
  strength?: string
  playForm?: string
  durationText?: string
  homeAway?: string
  fieldType?: string
  notes?: string
}

const STRENGTH_OPTIONS = getStrengthOrder().map(s => ({
  value: s,
  label: STRENGTH_LABEL[s]
}))

const PLAYFORM_OPTIONS = [
  { value: 'FUNINO', label: 'Funino' },
  { value: 'FUSSBALL_4', label: '4er' },
  { value: 'FUSSBALL_5', label: '5er' },
  { value: 'FUSSBALL_7', label: '7er' },
  { value: 'NEUN_GEGEN_NEUN', label: '9er' },
  { value: 'ELF_GEGEN_ELF', label: '11er' },
]

const HOMEAWAY_OPTIONS = [
  { value: 'HOME', label: 'Heim' },
  { value: 'AWAY', label: 'Auswärts' },
  { value: 'FLEX', label: 'Flexibel' },
]

const FIELDTYPE_OPTIONS = [
  { value: 'FIELD', label: 'Rasen' },
  { value: 'TURF', label: 'Kunstrasen' },
  { value: 'HALL', label: 'Halle' },
]

export default function EditOfferModal({ open, onClose, onSave, offer }: Props) {
  const [formData, setFormData] = useState<EditOfferData>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open && offer) {
      setFormData({
        offerDate: offer.offerDate || '',
        kickoffTime: offer.kickoffTime || '',
        kickoffFlexible: offer.kickoffFlexible || false,
        strength: offer.strength || '',
        playForm: offer.playForm || '',
        durationText: offer.durationText || '',
        homeAway: offer.homeAway || 'FLEX',
        fieldType: offer.fieldType || 'FIELD',
        notes: offer.notes || '',
      })
    }
  }, [open, offer])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await onSave(formData)
      onClose()
    } catch (error) {
      console.error('Save failed:', error)
    } finally {
      setSaving(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 my-8 max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">
          Angebot bearbeiten
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Datum */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Spieltermin
            </label>
            <input
              type="date"
              value={formData.offerDate || ''}
              onChange={(e) => setFormData({ ...formData, offerDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D04D2E]"
            />
          </div>

          {/* Anstoßzeit */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Anstoßzeit
            </label>
            <input
              type="time"
              value={formData.kickoffTime || ''}
              onChange={(e) => setFormData({ ...formData, kickoffTime: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D04D2E]"
            />
            <label className="flex items-center mt-2">
              <input
                type="checkbox"
                checked={formData.kickoffFlexible || false}
                onChange={(e) => setFormData({ ...formData, kickoffFlexible: e.target.checked })}
                className="mr-2"
              />
              <span className="text-sm text-gray-600">Anstoßzeit flexibel</span>
            </label>
          </div>

          {/* Spielstärke */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Spielstärke
            </label>
            <select
              value={formData.strength || ''}
              onChange={(e) => setFormData({ ...formData, strength: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D04D2E]"
            >
              <option value="">Bitte wählen</option>
              {STRENGTH_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Spielform */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Spielform
            </label>
            <select
              value={formData.playForm || ''}
              onChange={(e) => setFormData({ ...formData, playForm: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D04D2E]"
            >
              <option value="">Bitte wählen</option>
              {PLAYFORM_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Spielzeit */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Spielzeit
            </label>
            <input
              type="text"
              value={formData.durationText || ''}
              onChange={(e) => setFormData({ ...formData, durationText: e.target.value })}
              placeholder="z.B. 2x25 Min."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D04D2E]"
            />
          </div>

          {/* Heim/Auswärts */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Heim/Auswärts
            </label>
            <select
              value={formData.homeAway || 'FLEX'}
              onChange={(e) => setFormData({ ...formData, homeAway: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D04D2E]"
            >
              {HOMEAWAY_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Platzart */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Platzart
            </label>
            <select
              value={formData.fieldType || 'FIELD'}
              onChange={(e) => setFormData({ ...formData, fieldType: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D04D2E]"
            >
              {FIELDTYPE_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Notizen */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notizen
            </label>
            <textarea
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#D04D2E]"
              placeholder="Zusätzliche Informationen..."
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition disabled:opacity-50"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2.5 bg-[#D04D2E] text-white rounded-lg font-medium hover:bg-[#B83D1E] transition disabled:opacity-50"
            >
              {saving ? 'Speichern...' : 'Speichern'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
