import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./Home";
import About from "./About";
import Experience from "./Experience";
import Works from "./Works";
import SocialMedia from "./SocialMedia";
import Navbar from "./Navbar";
import BlogList from "./BlogList";
import BlogPost from "./BlogPost";
import BlogPreview from "./BlogPreview";
import ScrollToTop from "./ScrollToTop";

function HomePage() {
    return (
        <>
            <Home/>
            <About/>
            <BlogPreview/>
            <Experience/>
            <Works/>
            <SocialMedia/>
        </>
    );
}

function App() {
    return (
        <BrowserRouter>
            <div className="App">
                <ScrollToTop />
                <Navbar/>
                <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/blog" element={<BlogList />} />
                    <Route path="/blog/:slug" element={<BlogPost />} />
                </Routes>
            </div>
        </BrowserRouter>
    );
}

export default App;
