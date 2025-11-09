'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React from 'react'
import { Menu, Search, X, PenSquare, User, LogIn, LogOut } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { SearchInput } from '@/components/ui/search-input'
import { cn } from '@/lib/utils'

const navigation = [
  { name: '首页', href: '/' },
  { name: '文章', href: '/posts' },
  { name: '分类', href: '/categories' },
  { name: '标签', href: '/tags' },
  { name: '关于', href: '/about' },
]

interface HeaderProps {
  className?: string
  user?: {
    name?: string
    email: string
    avatar?: string
    username?: string
  } | null
}

export function Header({ className, user }: HeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false)
  const [isSearchOpen, setIsSearchOpen] = React.useState(false)
  const pathname = usePathname()

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === href
    }
    return pathname.startsWith(href)
  }

  return (
    <header
      className={cn(
        'sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60',
        className
      )}
    >
      <div className="container flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <PenSquare className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold">个人博客</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center space-x-6 md:flex">
          {navigation.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'text-sm font-medium transition-colors hover:text-foreground/80',
                isActive(item.href) ? 'text-foreground' : 'text-foreground/60'
              )}
            >
              {item.name}
            </Link>
          ))}
        </nav>

        {/* Right side actions */}
        <div className="flex items-center space-x-2">
          {/* Search button - Desktop */}
          <Button
            variant="ghost"
            size="icon"
            className="hidden md:flex"
            onClick={() => setIsSearchOpen(!isSearchOpen)}
          >
            <Search className="h-5 w-5" />
            <span className="sr-only">搜索</span>
          </Button>

          {/* Theme toggle */}
          <ThemeToggle />

          {/* User menu */}
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.avatar} alt={user.name || user.email} />
                    <AvatarFallback>
                      {(user.name || user.email).charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1 leading-none">
                    {user.name && <p className="font-medium">{user.name}</p>}
                    {user.email && (
                      <p className="w-[200px] truncate text-sm text-muted-foreground">
                        {user.email}
                      </p>
                    )}
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile" className="flex items-center">
                    <User className="mr-2 h-4 w-4" />
                    个人资料
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/dashboard" className="flex items-center">
                    <PenSquare className="mr-2 h-4 w-4" />
                    写文章
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <LogOut className="mr-2 h-4 w-4" />
                  退出登录
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/auth/signin">
                  <LogIn className="mr-2 h-4 w-4" />
                  登录
                </Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/auth/signup">注册</Link>
              </Button>
            </div>
          )}

          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            <span className="sr-only">切换菜单</span>
          </Button>
        </div>
      </div>

      {/* Search bar - Desktop */}
      {isSearchOpen && (
        <div className="hidden border-t px-4 py-3 md:block">
          <div className="container mx-auto max-w-2xl">
            <SearchInput
              placeholder="搜索文章..."
              className="w-full"
              onBlur={() => setTimeout(() => setIsSearchOpen(false), 200)}
            />
          </div>
        </div>
      )}

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="border-t bg-background md:hidden">
          <div className="container space-y-3 px-4 py-3">
            {/* Mobile search */}
            <SearchInput placeholder="搜索文章..." className="w-full" />

            {/* Mobile navigation */}
            <nav className="flex flex-col space-y-3">
              {navigation.map(item => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'py-2 text-sm font-medium transition-colors hover:text-foreground/80',
                    isActive(item.href)
                      ? 'border-l-2 border-primary pl-2 text-foreground'
                      : 'pl-2 text-foreground/60'
                  )}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
            </nav>

            {/* Mobile user actions */}
            <div className="flex flex-col space-y-3 border-t pt-3">
              {user ? (
                <>
                  <Link
                    href="/profile"
                    className="text-sm font-medium text-foreground/60 hover:text-foreground/80"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    个人资料
                  </Link>
                  <Link
                    href="/dashboard"
                    className="text-sm font-medium text-foreground/60 hover:text-foreground/80"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    写文章
                  </Link>
                  <button className="text-left text-sm font-medium text-foreground/60 hover:text-foreground/80">
                    退出登录
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/auth/signin"
                    className="text-sm font-medium text-foreground/60 hover:text-foreground/80"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    登录
                  </Link>
                  <Link
                    href="/auth/signup"
                    className="text-sm font-medium text-foreground/60 hover:text-foreground/80"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    注册
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
