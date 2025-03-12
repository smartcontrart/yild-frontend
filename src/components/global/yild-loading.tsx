export function YildLoading({ loading }: { loading: boolean}) {
  if (loading)
    return (
      <div className="flex items-center justify-center h-screen absolute left-0 top-0 w-full bg-white/50 dark:bg-black/50 backdrop-blur">
        <p className="text-xl animate-pulse text-black">Loading...</p>
      </div>
    )
  return <></>
}