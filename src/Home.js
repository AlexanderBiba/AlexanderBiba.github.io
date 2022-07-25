import "./Home.scss";
import ContactButtons from "./ContactButtons";

export default function Home() {
    return (
        <header id="home">
            <div className="greeting">
                <h1>Hi there! 👋</h1>
                <h1>I'm Alexander Biba</h1>
            </div>
            <h2>I'm a <span className="hilite">New York</span> based software engineer</h2>
            <ContactButtons className="contact-buttons"/>
            <a
                className="fa fa-arrow-down scroll-down"
                href="#navbar"
            />
        </header>
    );
}