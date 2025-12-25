'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import '../Navbar.scss'

export default function Navbar() {
    const pathname = usePathname()
    const isBlogPage = pathname?.startsWith('/blog')
    const scrollContainerRef = useRef<HTMLDivElement>(null)
    const [showLeftShadow, setShowLeftShadow] = useState(false)
    const [showRightShadow, setShowRightShadow] = useState(false)

    const checkScroll = () => {
        const container = scrollContainerRef.current
        if (!container) return

        const { scrollLeft, scrollWidth, clientWidth } = container
        setShowLeftShadow(scrollLeft > 0)
        setShowRightShadow(scrollLeft < scrollWidth - clientWidth - 1)
    }

    useEffect(() => {
        const container = scrollContainerRef.current
        if (!container) return

        checkScroll()
        container.addEventListener('scroll', checkScroll)
        window.addEventListener('resize', checkScroll)

        return () => {
            container.removeEventListener('scroll', checkScroll)
            window.removeEventListener('resize', checkScroll)
        }
    }, [])

    const handleHashNavigation = (e: React.MouseEvent<HTMLAnchorElement>, hash: string) => {
        e.preventDefault()
        // Navigate to home first
        window.location.href = '/'
        // Set hash after a brief delay to ensure route has changed
        setTimeout(() => {
            window.location.hash = hash
        }, 50)
    }

    return (
        <div id="navbar">
            <div className={`shadow-indicator left ${showLeftShadow ? 'visible' : ''}`}></div>
            <div 
                className="navbar-scroll-container" 
                ref={scrollContainerRef}
            >
                <ul>
                    <li>
                        {isBlogPage ? (
                            <a href="#about" onClick={(e) => handleHashNavigation(e, '#about')}>About</a>
                        ) : (
                            <a href="#about">About</a>
                        )}
                    </li>
                    <li>
                        <Link href="/blog">Blog</Link>
                    </li>
                </ul>
            </div>
            <div className={`shadow-indicator right ${showRightShadow ? 'visible' : ''}`}></div>
        </div>
    )
}

