'use client'

//reset is used to reset the current error boundary. when executed, will try to rerender the current route segment
export default async function Error ({error, reset}: {error: Error | {digest ?: string}, reset: ()  => void}){

    return (
        <main className="flex h-full flex-col items-center justify-center">
        <h2 className="text-center">Something went wrong!</h2>
        <button
            className="mt-4 rounded-md bg-blue-500 px-4 py-2 text-sm text-white transition-colors hover:bg-blue-400"
            onClick={
            // Attempt to recover by trying to re-render the invoices route
            () => reset()
            }
        >
            Try again
        </button>
        </main>
    )
}
