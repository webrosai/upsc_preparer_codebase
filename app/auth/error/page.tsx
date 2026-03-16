'use client'

import Link from 'next/link'

export default function AuthError() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="flex justify-center mb-4">
            <svg className="w-16 h-16 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4v2m0 0v2m0-6v-2m0 0V7a2 2 0 012-2h6a2 2 0 012 2v10a2 2 0 01-2 2h-6a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Authentication Error</h1>
          <p className="text-slate-600 mb-6">
            Something went wrong with the authentication process. Please try again.
          </p>

          <div className="space-y-3">
            <Link
              href="/auth/login"
              className="w-full block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition duration-200"
            >
              Back to Sign In
            </Link>
            <Link
              href="/"
              className="w-full block bg-slate-200 hover:bg-slate-300 text-slate-900 font-semibold py-2 rounded-lg transition duration-200"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}
