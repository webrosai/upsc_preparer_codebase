import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { email, name } = await request.json()

    // For now, we'll just log the email
    // In production, you would use a service like SendGrid, Resend, or AWS SES
    console.log("[v0] Welcome email triggered for:", { email, name })

    // Example of using Resend (if you have it set up):
    // import { Resend } from 'resend'
    // const resend = new Resend(process.env.RESEND_API_KEY)
    // await resend.emails.send({
    //   from: 'noreply@upscpreparer.com',
    //   to: email,
    //   subject: 'Welcome to UPSCPreparer!',
    //   html: `<h1>Welcome ${name}!</h1><p>Your account has been created successfully. Please confirm your email to get started.</p>`
    // })

    return NextResponse.json(
      { success: true, message: 'Email trigger executed' },
      { status: 200 }
    )
  } catch (error) {
    console.error('[v0] Email API error:', error)
    return NextResponse.json(
      { error: 'Failed to process email' },
      { status: 500 }
    )
  }
}
