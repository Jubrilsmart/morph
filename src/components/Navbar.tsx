import Link from "next/link"
import Logo from "./Logo"
import { ModeToggle } from "./toggle-button"
import { Button } from "./ui/button"
import { MobileDrawer } from "./Mobile"
import InstallButton from "./InstallButton"

const navLinks = [
  { id: 1, name: 'Features', href: '/#features' },
  { id: 2, name: 'Tools', href: '/tools' },
  { id: 3, name: 'Formats', href: '/#formats' },
  { id: 4, name: 'FAQ', href: '/#faq' }
]

export default function Navbar() {
  return (
    <nav className="flex flex-col justify-center items-center h-18 bg-background/80 backdrop-blur fixed border-b border-muted w-screen z-50">
      <div className="w-screen h-fit flex justify-between items-center px-5 md:px-12">
        <Logo />

        <div className="gap-6 hidden lg:flex">
          {navLinks.map((l) => (
            <Link href={l.href} key={l.id} className="text-sm text-muted-foreground hover:text-foreground transition-colors">{l.name}</Link>
          ))}
        </div>

        <div className="gap-4 justify-center items-center hidden lg:flex">
          <ModeToggle size={'icon'} />
          <InstallButton />
          <Button className='hover:cursor-pointer' render={<Link href={'/tools'} />}>
            Start Converting
          </Button>
        </div>

        {/* Mobile Drawer */}
        <div className="lg:hidden">
          <MobileDrawer />
        </div>

      </div>
    </nav>
  )
}
