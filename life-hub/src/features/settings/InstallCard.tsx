import { Download, Share, Smartphone } from 'lucide-react'
import { Button, Card } from '@/components/ui'
import { useInstall } from '@/lib/install'

export function InstallCard() {
  const install = useInstall()
  if (install.installed) return null
  if (!install.canPrompt && !install.showIOSHint) return null

  return (
    <Card className="bg-gradient-to-br from-violet-50 to-pink-50 dark:from-violet-500/10 dark:to-pink-500/10">
      <h2 className="mb-1 flex items-center gap-2 text-lg font-extrabold">
        <Smartphone className="size-5" aria-hidden /> Install Life Hub
      </h2>
      {install.canPrompt ? (
        <>
          <p className="mb-3 text-sm text-muted">Full screen, works offline, and gets reminders.</p>
          <Button onClick={install.prompt}>
            <Download className="size-4" aria-hidden /> Install app
          </Button>
        </>
      ) : (
        <p className="text-sm text-muted">
          In Safari, tap <Share className="inline size-4" aria-label="Share" /> then <strong>Add to Home Screen</strong>. You need this for
          notifications on iPhone and iPad.
        </p>
      )}
    </Card>
  )
}
