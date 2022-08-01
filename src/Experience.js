import "./Experience.scss";

export default function Experience() {
    return (
        <section id="experience">
            <h2 className="title">Experience</h2>
            <div className="content">
                <div>
                    <h3>Bloomberg, Senior Software Engineer, New York</h3>
                    <h4>2018-2022</h4>
                    <p>Developing Equity Research Document Search Engine and a Collaborative Document Viewer Web Application</p>
                    <h5>Tech Stack: Vue.js, Node.js, Groovy, Python, C++, Java, <a href="https://bloomberg.github.io/comdb2/overview_home.html">comdb2<a></a></a></h5>
                </div>
                <div>
                    <h3>Bloomberg, Software Engineer, Tel Aviv</h3>
                    <h4>2016-2018</h4>
                    <p>Developing Bloomberg's Transaction Cost Analysis (BTCA) Terminal Application</p>
                    <h5>Tech Stack: JavaScript, C++, Python, <a href="https://bloomberg.github.io/comdb2/overview_home.html">comdb2<a></a></a></h5>
                </div>
                <div>
                    <h3>Intel, Hardware Engineer Intern, Haifa</h3>
                    <h4>2015-2016</h4>
                    <p>Developing pre-silicon hardware verification enviroments for an image processing SoC</p>
                    <h5>Tech Stack: System Verilog, Perl, Python</h5>
                </div>
                <div>
                    <h3>CSR, Hardware Engineer Intern, Haifa</h3>
                    <h4>2012-2015</h4>
                    <p>Developing pre-silicon hardware verification enviroments for automotive SoCs</p>
                    <h5>Tech Stack: Specman, Perl, Python, C</h5>
                </div>
            </div>
        </section>
    )
}