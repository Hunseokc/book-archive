function BookCard({ book, onClick }) {
  return (
    <button
      type="button"
      onClick={() => onClick?.(book)}
      className="flex flex-col items-start text-left border border-gray-200 rounded-lg p-3 bg-white hover:shadow-md transition-shadow"
    >
      <div className="w-full aspect-[2/3] bg-gray-100 rounded overflow-hidden flex items-center justify-center">
        {book.cover_url ? (
          <img
            src={book.cover_url}
            alt={book.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-xs text-gray-400 px-2 text-center">
            표지 없음
          </span>
        )}
      </div>
      <p className="mt-2 text-sm font-medium text-gray-900 line-clamp-2">
        {book.title}
      </p>
      {book.author && (
        <p className="text-xs text-gray-500 line-clamp-1">{book.author}</p>
      )}
    </button>
  )
}

export default BookCard
