import Home from "./Home";
import About from "./About";
import Education from "./Education";
import Experience from "./Experience";
import Skills from "./Skills";
import Works from "./Works";
import Contact from "./Contact";
import Navbar from "./Navbar";

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
        </div>
    );
}

export default App;
