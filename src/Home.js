import "./Home.scss";
import SocialMediaButtons from "./SocialMediaButtons";

export default function Home() {
    return (
        <header id="home">
            <div className="greeting">
                <h1>Hi There! 👋</h1>
                <h1>I'm Alex Biba</h1>
            </div>
            <h2 className="description">I'm a <span className="hilite">New York</span> Based Software Engineer</h2>
            <SocialMediaButtons className="social-media-buttons"/>
            <a
                className="fa fa-arrow-down scroll-down"
                href="#navbar"
            />
        </header>
    );
}