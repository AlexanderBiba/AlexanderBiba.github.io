import Home from "./Home";
import About from "./About";
import Education from "./Education";
import Experience from "./Experience";
import Skills from "./Skills";
import Works from "./Works";
import SocialMedia from "./SocialMedia";
import Navbar from "./Navbar";
import Contact from "./Contact";

function App() {
    return (
        <div className="App" >
            <Home/>
            <Navbar/>
            <About/>
            <Education/>
            <Experience/>
            <Skills/>
            <Works/>
            <Contact/>
            <SocialMedia/>
        </div>
    );
}

export default App;
