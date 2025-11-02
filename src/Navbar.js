import { Link, useLocation } from "react-router-dom";
import "./Navbar.scss";

export default function Navbar() {
    const location = useLocation();
    const isBlogPage = location.pathname.startsWith("/blog");

    return (
        <div id="navbar">
            <ul>
                <li>
                    {isBlogPage ? (
                        <Link to="/#home">Home</Link>
                    ) : (
                        <a href="#home">Home</a>
                    )}
                </li>
                <li>
                    {isBlogPage ? (
                        <Link to="/#about">About</Link>
                    ) : (
                        <a href="#about">About</a>
                    )}
                </li>
                <li>
                    {isBlogPage ? (
                        <Link to="/#experience">Experience</Link>
                    ) : (
                        <a href="#experience">Experience</a>
                    )}
                </li>
                <li>
                    {isBlogPage ? (
                        <Link to="/#works">Projects</Link>
                    ) : (
                        <a href="#works">Projects</a>
                    )}
                </li>
                <li>
                    <Link to="/blog">Blog</Link>
                </li>
            </ul>
        </div>
    );
}