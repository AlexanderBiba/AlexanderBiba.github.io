import '../Home.scss'

export default function Home() {
    return (
        <header id="home">
            <div className="hero">
                <h1>Alex Biba</h1>
                <h2>Senior Software Engineer</h2>
                <p>Building scalable solutions with modern technologies</p>
                <div className="cta-buttons">
                    <a href="#experience" className="btn-primary">View Experience</a>
                    <a href="https://github.com/AlexanderBiba" target="_blank" rel="noreferrer" className="btn-secondary">
                        <i className="fa fa-github"></i> GitHub
                    </a>
                </div>
            </div>
        </header>
    )
}

