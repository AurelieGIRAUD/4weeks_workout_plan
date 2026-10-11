import { Mail, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { Button, ErrorNote, inputClass } from '@/components/ui'
import { isConfigured, supabase } from '@/lib/supabase'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [step, setStep] = useState<'email' | 'code'>('email')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<unknown>(null)

  const sendLink = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: window.location.origin },
    })
    setBusy(false)
    if (error) setError(error)
    else setStep('code')
  }

  const verify = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    const { error } = await supabase.auth.verifyOtp({ email: email.trim(), token: code.trim(), type: 'email' })
    setBusy(false)
    if (error) setError(error)
  }

  return (
    <main className="pt-safe flex min-h-dvh items-center justify-center bg-gradient-to-br from-violet-100 via-pink-50 to-amber-100 px-4 dark:from-violet-950 dark:via-bg dark:to-bg">
      <div className="animate-rise w-full max-w-sm rounded-[2rem] border border-line bg-card p-6 shadow-xl">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <div className="grid size-16 place-items-center rounded-3xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-amber-400 text-white shadow-lg">
            <Sparkles className="size-8" aria-hidden />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">Life Hub</h1>
          <p className="text-sm text-muted">Lists, workouts and beauty care. All in one happy place.</p>
        </div>

        {!isConfigured && (
          <ErrorNote error="Supabase is not configured. Copy .env.example to .env and fill in your project URL and key." />
        )}

        {step === 'email' ? (
          <form onSubmit={sendLink} className="flex flex-col gap-3">
            <label htmlFor="email" className="text-sm font-semibold text-muted">
              Your email
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              inputMode="email"
              placeholder="you@example.com"
              className={inputClass}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Button type="submit" loading={busy}>
              <Mail className="size-4" aria-hidden /> Send me a sign-in email
            </Button>
          </form>
        ) : (
          <form onSubmit={verify} className="flex flex-col gap-3">
            <p className="text-sm">
              We sent an email to <strong>{email}</strong>. Tap the link, <em>or</em> type the code from the email here.
            </p>
            <p className="text-xs text-muted">
              Using the app from your home screen? Use the code. On iPhone, links open in Safari, not in the installed app.
            </p>
            <input
              aria-label="Code from email"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]{6,10}"
              maxLength={10}
              placeholder="123456"
              className={inputClass + ' text-center text-2xl tracking-[0.4em]'}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
            />
            <Button type="submit" loading={busy} disabled={code.length < 6}>
              Sign in
            </Button>
            <button type="button" className="text-sm text-muted underline" onClick={() => setStep('email')}>
              Use a different email
            </button>
          </form>
        )}

        <div className="mt-4">
          <ErrorNote error={error} />
        </div>
      </div>
    </main>
  )
}
