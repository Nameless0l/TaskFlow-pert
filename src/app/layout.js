import './globals.css'

export const metadata = {
  title: 'Générateur de Diagrammes Gantt et PERT',
  description: 'Application pour créer et visualiser des diagrammes de Gantt et PERT avec calcul automatique des chemins critiques',
  keywords: 'gantt, pert, diagramme, projet, gestion, planification',
  authors: [{ name: 'Votre Nom' }],
  viewport: 'width=device-width, initial-scale=1',
}

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body className="antialiased">
        {children}
      </body>
    </html>
  )
}