import Link from 'next/link'
import '../Navbar.scss'

export default function Navbar() {
    return (
        <nav className="navbar">
            <div className="content-container">
                <Link href="/">Home</Link>
                <Link href="/blog">Blog</Link>
                <Link href="/portfolio">Portfolio</Link>
            </div>
        </nav>
    )
}

