import { useState, useEffect, ReactNode } from 'react'
import { PageTemplate } from './PageTemplate'
import { BrandLogoLeft } from '@/components/BrandLogoLeft'
import { SocialLinks } from '@/components/SocialLinks'
import { FloatingCart } from '@/components/FloatingCart'
import { ProfileMenu } from '@/components/ProfileMenu'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { ShoppingCart, Menu, X, Wand2 } from 'lucide-react'
import { useCartUISafe } from '@/components/CartProvider'
import { useCart } from '@/contexts/CartContext'

/**
 * EDITABLE TEMPLATE - EcommerceTemplate
 * Template Patapete con header premium sticky y footer de marca.
 */

interface EcommerceTemplateProps {
  children: ReactNode
  pageTitle?: string
  showCart?: boolean
  className?: string
  headerClassName?: string
  footerClassName?: string
  layout?: 'default' | 'full-width' | 'centered'
  hideFloatingCartOnMobile?: boolean
  transparentOnTop?: boolean
}

export const EcommerceTemplate = ({
  children,
  pageTitle,
  showCart = true,
  className,
  headerClassName,
  footerClassName,
  layout = 'default',
  hideFloatingCartOnMobile = false,
  transparentOnTop = false
}: EcommerceTemplateProps) => {
  const cartUI = useCartUISafe()
  const openCart = cartUI?.openCart ?? (() => {})
  const { getTotalItems } = useCart()
  const totalItems = getTotalItems()

  const [scrolled, setScrolled] = useState(!transparentOnTop)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    if (!transparentOnTop) {
      setScrolled(true)
      return
    }
    const onScroll = () => setScrolled(window.scrollY > 30)
    // Set initial state based on current scroll position
    setScrolled(window.scrollY > 30)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [transparentOnTop])

  const navLinks = [
    { label: '¿Cómo funciona?', href: '/#como-funciona' },
    { label: 'Galería', href: '/#galeria' },
    { label: 'Reseñas', href: '/#testimonios' },
  ]

  const header = (
    <div
      className={`transition-all duration-300 ${scrolled ? 'py-3' : 'py-4'} ${headerClassName ?? ''}`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <BrandLogoLeft transparent={!scrolled} />

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8" aria-label="Navegación principal">
            {navLinks.map(({ label, href }) => (
              <a
                key={label}
                href={href}
                className={`relative text-sm font-medium transition-colors duration-300 group py-1 ${
                  scrolled
                    ? 'text-foreground/60 hover:text-foreground'
                    : 'text-white/80 hover:text-white'
                }`}
              >
                {label}
                <span className={`absolute bottom-0 left-0 h-[1.5px] w-0 rounded-full transition-all duration-300 group-hover:w-full ${
                  scrolled ? 'bg-primary' : 'bg-white'
                }`} />
              </a>
            ))}
          </nav>

          {/* Right: profile, cart, CTA */}
          <div className="flex items-center gap-2">
            <ProfileMenu className={`transition-colors duration-300 ${scrolled ? 'text-foreground/70 hover:text-foreground' : 'text-white/80 hover:text-white'}`} />

            {showCart && (
              <Button
                variant="ghost"
                size="icon"
                onClick={openCart}
                className={`relative transition-colors duration-300 ${
                  scrolled
                    ? 'text-foreground/70 hover:text-foreground'
                    : 'text-white/80 hover:text-white'
                }`}
                aria-label="Ver carrito"
              >
                <ShoppingCart className="h-5 w-5" />
                {totalItems > 0 && (
                  <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center">
                    {totalItems > 99 ? '99+' : totalItems}
                  </span>
                )}
              </Button>
            )}

            <Button
              asChild
              size="sm"
              className="hidden md:inline-flex rounded-xl font-semibold ml-1 gap-1.5 shadow-primary hover:-translate-y-0.5 transition-all duration-200"
            >
              <Link to="/productos/tapete-personalizado-patapete">
                <Wand2 className="h-3.5 w-3.5" />
                Diseña el tuyo
              </Link>
            </Button>

            {/* Mobile hamburger */}
            <Button
              variant="ghost"
              size="icon"
              className={`md:hidden transition-colors duration-300 ${
                scrolled
                  ? 'text-foreground/70 hover:text-foreground'
                  : 'text-white/80 hover:text-white'
              }`}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Page title */}
        {pageTitle && (
          <div className="mt-6">
            <h1 className="font-display text-3xl font-bold text-foreground">{pageTitle}</h1>
          </div>
        )}

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-4 pt-4 pb-2 border-t border-border space-y-1 animate-fade-in">
            {navLinks.map(({ label, href }) => (
              <a
                key={label}
                href={href}
                className="block py-2.5 text-sm font-medium text-foreground/70 hover:text-foreground transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                {label}
              </a>
            ))}
            <div className="pt-3 pb-1">
              <Button asChild className="w-full rounded-xl font-semibold gap-1.5">
                <Link
                  to="/productos/tapete-personalizado-patapete"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Wand2 className="h-4 w-4" /> Diseña el tuyo
                </Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )

  const footer = (
    <div className={`bg-foreground py-14 ${footerClassName ?? ''}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {/* Brand */}
          <div>
            <div className="text-background mb-4">
              <BrandLogoLeft />
            </div>
            <p className="text-sm leading-relaxed mt-3" style={{ color: 'hsl(38 25% 65%)' }}>
              Tapetes personalizados con el retrato de tu mascota, impresos en alta definición. Hecho a pedido en México.
            </p>
          </div>

          {/* Links */}
          <div>
            <h3 className="text-sm font-semibold mb-5" style={{ color: 'hsl(38 25% 85%)' }}>
              Navegación
            </h3>
            <div className="space-y-3">
              {[
                { label: 'Inicio', href: '/' },
                { label: '¿Cómo funciona?', href: '/#como-funciona' },
                { label: 'Galería', href: '/#galeria' },
                { label: 'Reseñas', href: '/#testimonios' },
                { label: 'Blog', href: '/blog' },
              ].map(({ label, href }) => (
                href.startsWith('/') && !href.includes('#') ? (
                  <Link
                    key={label}
                    to={href}
                    className="block text-sm transition-colors"
                    style={{ color: 'hsl(38 20% 58%)' }}
                  >
                    {label}
                  </Link>
                ) : (
                  <a
                    key={label}
                    href={href}
                    className="block text-sm transition-colors"
                    style={{ color: 'hsl(38 20% 58%)' }}
                  >
                    {label}
                  </a>
                )
              ))}
            </div>
          </div>

          {/* Social */}
          <div>
            <h3 className="text-sm font-semibold mb-5" style={{ color: 'hsl(38 25% 85%)' }}>
              Síguenos
            </h3>
            <div style={{ color: 'hsl(38 20% 58%)' }}>
              <SocialLinks />
            </div>
            <p className="text-xs mt-5" style={{ color: 'hsl(38 15% 48%)' }}>
              💬 También puedes escribirnos por WhatsApp para ayudarte con tu pedido.
            </p>
          </div>
        </div>

        <div className="mt-10 pt-8 border-t text-center text-xs" style={{ borderColor: 'hsl(20 15% 20%)', color: 'hsl(38 15% 42%)' }}>
          © 2025 Patapete. Todos los derechos reservados. · Hecho con 🐾 en México
        </div>
      </div>
    </div>
  )

  return (
    <>
      <PageTemplate
        header={header}
        footer={footer}
        className={className}
        layout={layout}
        stickyHeaderClassName={
          scrolled
            ? 'bg-background/90 supports-[backdrop-filter]:bg-background/75 border-b border-border/40 shadow-sm'
            : 'bg-background/0 border-b border-transparent'
        }
      >
        {children}
      </PageTemplate>

      {showCart && <FloatingCart hideOnMobile={hideFloatingCartOnMobile} />}
    </>
  )
}