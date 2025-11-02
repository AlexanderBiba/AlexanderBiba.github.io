import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import "./Navbar.scss";

export default function Navbar() {
    const location = useLocation();
    const navigate = useNavigate();
    const isBlogPage = location.pathname.startsWith("/blog");
    const scrollContainerRef = useRef(null);
    const [showLeftShadow, setShowLeftShadow] = useState(false);
    const [showRightShadow, setShowRightShadow] = useState(false);

    const checkScroll = () => {
        const container = scrollContainerRef.current;
        if (!container) return;

        const { scrollLeft, scrollWidth, clientWidth } = container;
        setShowLeftShadow(scrollLeft > 0);
        setShowRightShadow(scrollLeft < scrollWidth - clientWidth - 1);
    };

    useEffect(() => {
        const container = scrollContainerRef.current;
        if (!container) return;

        checkScroll();
        container.addEventListener("scroll", checkScroll);
        window.addEventListener("resize", checkScroll);

        return () => {
            container.removeEventListener("scroll", checkScroll);
            window.removeEventListener("resize", checkScroll);
        };
    }, []);

    const handleHashNavigation = (e, hash) => {
        e.preventDefault();
        // Navigate to home first
        navigate("/");
        // Set hash after a brief delay to ensure route has changed
        setTimeout(() => {
            window.location.hash = hash;
        }, 50);
    };

    return (
        <div id="navbar">
            <div className={`shadow-indicator left ${showLeftShadow ? "visible" : ""}`}></div>
            <div 
                className="navbar-scroll-container" 
                ref={scrollContainerRef}
            >
                <ul>
                    <li>
                        {isBlogPage ? (
                            <a href="#home" onClick={(e) => handleHashNavigation(e, "#home")}>Home</a>
                        ) : (
                            <a href="#home">Home</a>
                        )}
                    </li>
                    <li>
                        {isBlogPage ? (
                            <a href="#about" onClick={(e) => handleHashNavigation(e, "#about")}>About</a>
                        ) : (
                            <a href="#about">About</a>
                        )}
                    </li>
                    <li>
                        <Link to="/blog">Blog</Link>
                    </li>
                    <li>
                        {isBlogPage ? (
                            <a href="#experience" onClick={(e) => handleHashNavigation(e, "#experience")}>Experience</a>
                        ) : (
                            <a href="#experience">Experience</a>
                        )}
                    </li>
                    <li>
                        {isBlogPage ? (
                            <a href="#works" onClick={(e) => handleHashNavigation(e, "#works")}>Projects</a>
                        ) : (
                            <a href="#works">Projects</a>
                        )}
                    </li>
                </ul>
            </div>
            <div className={`shadow-indicator right ${showRightShadow ? "visible" : ""}`}></div>
        </div>
    );
}