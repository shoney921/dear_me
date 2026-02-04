import { Outlet } from 'react-router-dom'
import Header from './Header'

export default function Layout() {
  return (
    <div 
      className="min-h-screen bg-cover bg-center bg-fixed"
      style={{ backgroundImage: 'url(/dearme-background.png)' }}
    >
      <div className="min-h-screen bg-white/70 backdrop-blur-sm">
        <Header />
        <main className="container mx-auto px-4 py-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
