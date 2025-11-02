import { Link, useLocation } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import "./Navbar.scss";

export default function Navbar() {
    const location = useLocation();
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
                        <Link to="/blog">Blog</Link>
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
                </ul>
            </div>
            <div className={`shadow-indicator right ${showRightShadow ? "visible" : ""}`}></div>
        </div>
    );
}