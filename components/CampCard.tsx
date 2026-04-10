import Link from 'next/link'
import { Camp } from '@/types'
import { Calendar, ChevronRight } from 'lucide-react'

interface CampCardProps {
  camp: Camp
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default function CampCard({ camp }: CampCardProps) {
  const now = new Date()
  const start = new Date(camp.date_start)
  const end = new Date(camp.date_end)
  const isActive = now >= start && now <= end
  const isPast = now > end

  return (
    <Link href={`/camp/${camp.id}`}>
      <div className={`group bg-white rounded-2xl border p-5 hover:shadow-md transition-all duration-200 ${
        isActive ? 'border-emerald-200 hover:border-emerald-400'
        : isPast  ? 'border-gray-100 hover:border-gray-200'
        :           'border-orange-100 hover:border-orange-300'
      }`}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            {isActive && (
              <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-600">
                🔴 En cours
              </span>
            )}
            {isPast && (
              <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-gray-100 text-gray-400">
                Terminé
              </span>
            )}
            {!isActive && !isPast && (
              <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-sky-100 text-sky-600">
                À venir
              </span>
            )}
            <h2 className={`font-bold text-gray-900 text-lg mt-2 truncate transition-colors ${
              isActive ? 'group-hover:text-emerald-600'
              : isPast  ? 'group-hover:text-gray-500'
              :           'group-hover:text-orange-500'
            }`}>
              {camp.name}
            </h2>
            <div className="flex items-center gap-1.5 mt-1.5 text-sm text-gray-400">
              <Calendar className="w-4 h-4 shrink-0" />
              <span>{formatDate(camp.date_start)} → {formatDate(camp.date_end)}</span>
            </div>
          </div>
          <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center group-hover:bg-orange-100 transition-colors shrink-0">
            <ChevronRight className="w-5 h-5 text-orange-400" />
          </div>
        </div>
      </div>
    </Link>
  )
}
