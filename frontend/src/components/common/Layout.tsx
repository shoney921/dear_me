import { Outlet } from 'react-router-dom'
import Header from './Header'
import MobileHeader from './MobileHeader'
import BottomTabBar from './BottomTabBar'

export default function Layout() {
  return (
    <div
      className="min-h-screen bg-cover bg-center bg-fixed"
      style={{ backgroundImage: 'url(/dearme-background.png)' }}
    >
      <div className="min-h-screen bg-white/70 backdrop-blur-sm">
        <MobileHeader />
        <Header />
        <main className="max-w-5xl mx-auto px-4 py-6 pb-24 sm:pb-6">
          <Outlet />
        </main>
      </div>
      {/* BottomTabBar는 backdrop-blur 컨테이너 바깥에 위치해야 fixed가 정상 작동 */}
      <BottomTabBar />
    </div>
  )
}
