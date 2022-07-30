import "./Works.scss";

export default function Works() {
    return (
        <section id="works">
            <h2 className="title">Works</h2>
            <div className="content">
                <h3><a className="project" href="https://alex152.github.io/wordle">Wordle</a><a className="fa fa-github" href="https://github.com/alex152/wordle" target="_blank"/></h3>
                <h4>A simple Wordle game with a new word every day</h4>
                <h3><a className="project" href="https://alex152.github.io/goal-keeper">Goal Keeper</a><a className="fa fa-github" href="https://github.com/alex152/goal-keeper" target="_blank"/></h3>
                <h4>A ToDo List With a Twist!</h4>
            </div>
        </section>
    )
}
