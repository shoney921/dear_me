import { BookOpen } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'
import type { BookRecommendation } from '@/types/mental'

interface BookCardProps {
  book: BookRecommendation
}

const CATEGORY_COLORS: Record<string, string> = {
  '에세이': 'bg-pink-100 text-pink-700',
  '자기계발': 'bg-blue-100 text-blue-700',
  '심리학': 'bg-purple-100 text-purple-700',
  '소설': 'bg-green-100 text-green-700',
  '시집': 'bg-orange-100 text-orange-700',
}

export function BookCard({ book }: BookCardProps) {
  const categoryColor = CATEGORY_COLORS[book.category] || 'bg-gray-100 text-gray-700'

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex gap-4">
          <div className="flex-shrink-0 w-16 h-20 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-lg flex items-center justify-center">
            <BookOpen className="w-8 h-8 text-indigo-500" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold text-gray-900 truncate">{book.title}</h3>
              <span className={`flex-shrink-0 px-2 py-0.5 text-xs font-medium rounded-full ${categoryColor}`}>
                {book.category}
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-0.5">{book.author}</p>
            <p className="text-sm text-gray-700 mt-2 line-clamp-2">{book.description}</p>
            <p className="text-xs text-indigo-600 mt-2 italic">"{book.reason}"</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

interface BookListProps {
  books: BookRecommendation[]
  basedOnStatus?: string
}

export function BookList({ books, basedOnStatus }: BookListProps) {
  if (books.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        추천할 책이 없습니다.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {basedOnStatus && (
        <p className="text-sm text-gray-600">
          현재 <span className="font-medium">{basedOnStatus}</span> 상태에 맞는 책을 추천해드려요
        </p>
      )}
      <div className="space-y-3">
        {books.map((book, index) => (
          <BookCard key={index} book={book} />
        ))}
      </div>
    </div>
  )
}
