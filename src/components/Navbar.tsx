import Link from 'next/link'
import '../Navbar.scss'

export default function Navbar() {
    return (
        <nav className="navbar">
            <div className="content-container">
                <Link href="/">Home</Link>
                <Link href="/blog">Blog</Link>
                <Link href="/projects">Projects</Link>
                <Link href="/explore/" className="explore-link" aria-label="Enter 3D mode"><span aria-hidden="true">🎮</span></Link>
            </div>
        </nav>
    )
}

