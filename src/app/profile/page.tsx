import BackgroundImage from '@/components/BackgroundImage'
import HeaderBar from '@/components/HeaderBar'
import ProfileInfo from '@/components/ProfileInfo'
import ProfileAffiliation from '@/components/ProfileAffiliation'
import PasswordChange from '@/components/PasswordChange'

export default function ProfilePage() {
  return (
    <main className="relative min-h-dvh text-white">
      <BackgroundImage />
      <HeaderBar />

      <div className="mx-auto max-w-sm px-4 pt-16 pb-24">
        {/* Titel */}
        <h1 className="text-xl font-semibold mb-3">Dein Profil</h1>

        {/* Profil-Daten */}
        <section className="rounded-2xl border border-white/25 bg-white/10 backdrop-blur-sm p-4 space-y-4">
          <ProfileInfo />
        </section>

        {/* Verein & Teams */}
        <section className="mt-4 rounded-2xl border border-white/25 bg-white/10 backdrop-blur-sm p-4">
          <ProfileAffiliation />
        </section>

        {/* Passwort ändern */}
        <section className="mt-4">
          <PasswordChange />
        </section>
      </div>
    </main>
  )
}