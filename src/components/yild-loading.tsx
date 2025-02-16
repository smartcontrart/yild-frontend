export function YildLoading({ hydrated }: { hydrated: boolean}) {
  if (!hydrated)
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 text-white absolute left-0 top-0 w-full">
        <p className="text-xl animate-pulse">Loading...</p>
      </div>
    )
}