import "./Home.scss";
import SocialMediaButtons from "./SocialMediaButtons";

export default function Home() {
    return (
        <header id="home">
            <div className="greeting">
                <h1>Hi There! 👋</h1>
                <h1>I'm Alex</h1>
                <h1>I'm a <span className="hilite">New York</span> Based Software Engineer</h1>
            </div>
            <SocialMediaButtons className="social-media-buttons"/>
            <a href="#navbar"><i className="fa fa-arrow-down scroll-down"></i></a>
        </header>
    );
}