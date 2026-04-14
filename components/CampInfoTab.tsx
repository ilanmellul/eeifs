'use client'

import { useState, useTransition } from 'react'
import { CampInfo } from '@/types'
import { saveCampInfo } from '@/lib/actions/camp-info'
import {
  MapPin, Phone, Mail, User, Clock, Navigation,
  Backpack, AlertCircle, FileText, Check, Pencil, X
} from 'lucide-react'

interface CampInfoTabProps {
  campId: string
  info: CampInfo | null
  canEdit: boolean
}

interface Field {
  key: keyof Omit<CampInfo, 'id' | 'camp_id' | 'updated_at'>
  label: string
  icon: React.ReactNode
  placeholder: string
  multiline?: boolean
}

const FIELDS: Field[] = [
  { key: 'address',           label: 'Adresse',                icon: <MapPin className="w-4 h-4" />,      placeholder: '12 rue des Pins, 75000 Paris' },
  { key: 'meeting_point',     label: 'Point de rendez-vous',   icon: <Navigation className="w-4 h-4" />,  placeholder: 'Devant l\'entrée principale…' },
  { key: 'director',          label: 'Directeur / Responsable',icon: <User className="w-4 h-4" />,        placeholder: 'Prénom Nom' },
  { key: 'phone',             label: 'Téléphone de contact',   icon: <Phone className="w-4 h-4" />,       placeholder: '06 00 00 00 00' },
  { key: 'email',             label: 'Email de contact',       icon: <Mail className="w-4 h-4" />,        placeholder: 'contact@eeifs.fr' },
  { key: 'arrival_time',      label: 'Heure d\'arrivée',       icon: <Clock className="w-4 h-4" />,       placeholder: 'Ex : 9h00' },
  { key: 'departure_time',    label: 'Heure de départ',        icon: <Clock className="w-4 h-4" />,       placeholder: 'Ex : 17h30' },
  { key: 'emergency_contact', label: 'Contact d\'urgence',     icon: <AlertCircle className="w-4 h-4" />, placeholder: 'Nom + téléphone' },
  { key: 'what_to_bring',     label: 'Ce qu\'il faut apporter',icon: <Backpack className="w-4 h-4" />,    placeholder: 'Gourde, chapeau, crème solaire…', multiline: true },
  { key: 'extra_info',        label: 'Informations complémentaires', icon: <FileText className="w-4 h-4" />, placeholder: 'Toute autre info utile aux parents…', multiline: true },
]

export default function CampInfoTab({ campId, info, canEdit }: CampInfoTabProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  // State éditable initialisé depuis les données existantes
  const [form, setForm] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {}
    for (const f of FIELDS) {
      init[f.key] = info?.[f.key] ?? ''
    }
    return init
  })

  // State affiché (mis à jour après sauvegarde)
  const [displayed, setDisplayed] = useState(form)

  function handleSave() {
    setError(null)
    startTransition(async () => {
      const fd = new FormData()
      for (const [k, v] of Object.entries(form)) fd.set(k, v)
      const result = await saveCampInfo(campId, fd)
      if (result?.error) {
        setError(result.error)
      } else {
        setDisplayed({ ...form })
        setSaved(true)
        setIsEditing(false)
        setTimeout(() => setSaved(false), 2500)
      }
    })
  }

  function handleCancel() {
    setForm({ ...displayed })
    setError(null)
    setIsEditing(false)
  }

  const hasAnyInfo = FIELDS.some((f) => displayed[f.key])

  // Vue lecture seule
  if (!isEditing) {
    return (
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-gray-800">Infos du camp</h2>
          <div className="flex items-center gap-2">
            {saved && (
              <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
                <Check className="w-3.5 h-3.5" /> Enregistré
              </span>
            )}
            {canEdit && (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold text-orange-500 bg-orange-50 hover:bg-orange-100 border border-orange-100 transition-colors"
              >
                <Pencil className="w-3.5 h-3.5" /> Modifier
              </button>
            )}
          </div>
        </div>

        {!hasAnyInfo ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-orange-50">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-50 rounded-2xl mb-4">
              <FileText className="w-8 h-8 text-orange-300" />
            </div>
            <p className="font-semibold text-gray-600">Aucune info renseignée</p>
            {canEdit && (
              <p className="text-sm text-gray-400 mt-1">Cliquez sur "Modifier" pour renseigner les infos du camp.</p>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-orange-50 shadow-sm shadow-orange-100 divide-y divide-orange-50 overflow-hidden">
            {FIELDS.map((field) => {
              const value = displayed[field.key]
              if (!value) return null
              return (
                <div key={field.key} className="flex gap-3 px-5 py-4">
                  <span className="text-orange-400 mt-0.5 shrink-0">{field.icon}</span>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-gray-400 mb-0.5">{field.label}</p>
                    <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap break-words">{value}</p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  // Vue édition (animateur/admin uniquement)
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-gray-800">Modifier les infos</h2>
        <button
          onClick={handleCancel}
          className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-4 h-4" /> Annuler
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-orange-100 shadow-sm divide-y divide-orange-50 overflow-hidden">
        {FIELDS.map((field) => (
          <div key={field.key} className="flex gap-3 px-5 py-4 items-start">
            <span className="text-orange-400 mt-2.5 shrink-0">{field.icon}</span>
            <div className="flex-1 min-w-0">
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">{field.label}</label>
              {field.multiline ? (
                <textarea
                  value={form[field.key]}
                  onChange={(e) => setForm((prev) => ({ ...prev, [field.key]: e.target.value }))}
                  placeholder={field.placeholder}
                  rows={3}
                  className="w-full px-3 py-2 rounded-xl border border-orange-100 focus:outline-none focus:ring-2 focus:ring-orange-300 text-sm resize-none placeholder:text-gray-300 bg-orange-50/30"
                />
              ) : (
                <input
                  type="text"
                  value={form[field.key]}
                  onChange={(e) => setForm((prev) => ({ ...prev, [field.key]: e.target.value }))}
                  placeholder={field.placeholder}
                  className="w-full px-3 py-2 rounded-xl border border-orange-100 focus:outline-none focus:ring-2 focus:ring-orange-300 text-sm placeholder:text-gray-300 bg-orange-50/30"
                />
              )}
            </div>
          </div>
        ))}
      </div>

      {error && (
        <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-xl px-3 py-2">{error}</p>
      )}

      <button
        onClick={handleSave}
        disabled={isPending}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-bold text-white bg-gradient-to-r from-orange-400 to-rose-500 hover:opacity-90 disabled:opacity-60 transition-opacity shadow-sm shadow-orange-200"
      >
        {isPending ? 'Enregistrement…' : <><Check className="w-4 h-4" /> Enregistrer</>}
      </button>
    </div>
  )
}
