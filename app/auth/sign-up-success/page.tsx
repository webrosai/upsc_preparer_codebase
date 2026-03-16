'use client'

import Link from 'next/link'

export default function SignUpSuccess() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="flex justify-center mb-4">
            <svg className="w-16 h-16 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Account Created!</h1>
          <p className="text-slate-600 mb-4">
            Your account has been successfully created.
          </p>
          <p className="text-slate-600 mb-6">
            Please check your email to confirm your account before logging in.
          </p>

          <div className="space-y-3">
            <Link
              href="/auth/login"
              className="w-full block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition duration-200"
            >
              Go to Sign In
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
