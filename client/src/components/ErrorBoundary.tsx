import { Component, type ReactNode } from 'react'

interface State {
  failed: boolean
}

/** Last-resort safety net: shows a plain-language screen instead of a blank page if rendering crashes. */
export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { failed: false }

  static getDerivedStateFromError(): State {
    return { failed: true }
  }

  componentDidCatch(error: unknown) {
    console.error('UI crashed:', error)
  }

  render() {
    if (!this.state.failed) return this.props.children
    return (
      <div role="alert" className="mx-auto mt-16 max-w-md rounded border border-stone-200 bg-white p-6 text-center">
        <h1 className="mb-2 text-lg font-semibold">Something went wrong</h1>
        <p className="mb-4 text-sm text-stone-600">The page hit a problem. Your saved notes are safe. Reload to carry on.</p>
        <button onClick={() => window.location.reload()} className="rounded bg-teal-700 px-4 py-2 text-sm text-white hover:bg-teal-800">
          Reload
        </button>
      </div>
    )
  }
}
