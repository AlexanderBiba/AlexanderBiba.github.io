import "./Works.scss";

export default function Works() {
    return (
        <section id="works">
            <h2 className="title">Works</h2>
            <div className="content">
                <h3><a className="project" href="https://alex152.github.io/wordle">Wordle</a><a className="fa fa-github" href="https://github.com/alex152/wordle" target="_blank"/></h3>
                <h4>A Classic Wordle Game With a New Word Every Day</h4>
                <h3><a className="project" href="https://alex152.github.io/goal-keeper">Goal Keeper</a><a className="fa fa-github" href="https://github.com/alex152/goal-keeper" target="_blank"/></h3>
                <h4>A ToDo List With a Twist!</h4>
                <h3><a className="project" href="https://github.com/alex152/password-generator">Python Password Generator</a><a className="fa fa-github" href="https://github.com/alex152/password-generator" target="_blank"/></h3>
                <h4>A Password Generator Written in Python</h4>
            </div>
        </section>
    )
}
