import React from 'react'

type Props = { children: React.ReactNode }

type State = { hasError: boolean }

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch() {}

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="rounded-full h-12 w-12 bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">!</div>
            <p className="text-gray-700">Something went wrong. Please refresh the page.</p>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

