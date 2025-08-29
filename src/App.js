import Home from "./Home";
import About from "./About";
import Experience from "./Experience";
import Works from "./Works";
import SocialMedia from "./SocialMedia";
import Navbar from "./Navbar";

function App() {
    return (
        <div className="App">
            <Navbar/>
            <Home/>
            <About/>
            <Experience/>
            <Works/>
            <SocialMedia/>
        </div>
    );
}

export default App;
