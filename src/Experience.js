import "./Experience.scss";

export default function Experience() {
    return (
        <section id="experience">
            <h2>Experience</h2>
            <div className="experience-list">
                <div className="experience-item">
                    <div className="company-logo">
                        <div className="logo-placeholder">Σ</div>
                    </div>
                    <div className="experience-content">
                        <div className="company-header">
                            <h3>Sigma Computing</h3>
                            <span className="role">Senior Software Engineer</span>
                            <span className="period">2022 - Present</span>
                            <span className="location">New York</span>
                        </div>
                        <ul>
                            <li>Building cloud analytics platform with Node.js, React, GraphQL</li>
                            <li>Developing scalable backend services and REST APIs</li>
                            <li>Working with MySQL databases and cloud infrastructure</li>
                        </ul>
                    </div>
                </div>
                
                <div className="experience-item">
                    <div className="company-logo">
                        <div className="logo-placeholder">B</div>
                    </div>
                    <div className="experience-content">
                        <div className="company-header">
                            <h3>Bloomberg</h3>
                            <span className="role">Senior Software Engineer</span>
                            <span className="period">2016 - 2022</span>
                            <span className="location">Tel Aviv → New York</span>
                        </div>
                        <ul>
                            <li>Developed Bloomberg's Transaction Cost Analysis (BTCA) Terminal Application</li>
                            <li>Built equity research document search engine and collaborative document viewer</li>
                            <li>Worked with Vue.js, Node.js, Python, C++, and proprietary databases</li>
                        </ul>
                    </div>
                </div>
                
                <div className="experience-item">
                    <div className="company-logo">
                        <div className="logo-placeholder">I</div>
                    </div>
                    <div className="experience-content">
                        <div className="company-header">
                            <h3>Intel</h3>
                            <span className="role">Hardware Engineer (Part Time)</span>
                            <span className="period">2015 - 2016</span>
                            <span className="location">Haifa</span>
                        </div>
                        <ul>
                            <li>Developed pre-silicon hardware verification environments for image processing SoC</li>
                            <li>Worked with System Verilog, Perl, and Python</li>
                        </ul>
                    </div>
                </div>
            </div>
        </section>
    );
}