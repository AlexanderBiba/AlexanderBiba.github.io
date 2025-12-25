import '../Works.scss'

export default function Works() {
    return (
        <section id="works">
            <h2>Projects</h2>
            <div className="projects-list">
                <div className="project-item">
                    <div className="project-header">
                        <h3>ESP32 Weather Clock</h3>
                        <div className="project-links">
                            <a href="https://github.com/AlexanderBiba/esp32-dotmatrix-wifi-clock" target="_blank" rel="noreferrer noopener">
                                <i className="fa fa-github"></i> View Code
                            </a>
                        </div>
                    </div>
                    <p>Digital clock with weather display using ESP32 and dot matrix displays</p>
                </div>
                
                <div className="project-item">
                    <div className="project-header">
                        <h3>Wordle Game</h3>
                        <div className="project-links">
                            <a href="https://AlexanderBiba.github.io/wordle" target="_blank" rel="noreferrer noopener">Live Version</a>
                            <a href="https://github.com/AlexanderBiba/wordle" target="_blank" rel="noreferrer noopener">
                                <i className="fa fa-github"></i> Code
                            </a>
                        </div>
                    </div>
                    <p>Daily word game built with React, Firebase, and Google Cloud Functions</p>
                </div>
                
                <div className="project-item">
                    <div className="project-header">
                        <h3>Goal Keeper</h3>
                        <div className="project-links">
                            <a href="https://AlexanderBiba.github.io/goal-keeper" target="_blank" rel="noreferrer noopener">Live Version</a>
                            <a href="https://github.com/AlexanderBiba/goal-keeper" target="_blank" rel="noreferrer noopener">
                                <i className="fa fa-github"></i> Code
                            </a>
                        </div>
                    </div>
                    <p>Task management app for partners built with React and Material UI</p>
                </div>
            </div>
            <div className="github-cta">
                <a href="https://github.com/AlexanderBiba" target="_blank" rel="noreferrer noopener" className="btn-github">
                    <i className="fa fa-github"></i> View All Projects on GitHub
                </a>
            </div>
        </section>
    )
}

