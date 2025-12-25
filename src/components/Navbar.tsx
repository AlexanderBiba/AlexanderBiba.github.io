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

    return (
        <div id="navbar">
            <div className={`shadow-indicator left ${showLeftShadow ? 'visible' : ''}`}></div>
            <div 
                className="navbar-scroll-container" 
                ref={scrollContainerRef}
            >
                <ul>
                    <li>
                        <Link href="/">Home</Link>
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

