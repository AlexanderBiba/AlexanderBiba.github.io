import "./Navbar.scss";

export default function Navbar() {
    return (
        <div id="navbar">
            <ul>
                <li><a href="#home">Home</a></li>
                <li><a href="#about">About</a></li>
                <li><a href="#experience">Experience</a></li>
                <li><a href="#works">Projects</a></li>
            </ul>
        </div>
    );
}