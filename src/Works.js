import "./Works.scss";

export default function Works() {
    return (
        <section id="works">
            <h2 className="title">Code Samples</h2>
            <div className="content">
                <h3><a className="project" href="https://AlexanderBiba.github.io/wordle">Wordle</a><a className="fa fa-github" href="https://github.com/AlexanderBiba/wordle" target="_blank"/></h3>
                <h4>A classic wordle game with a new word every day, React.js</h4>
                <h3><a className="project" href="https://AlexanderBiba.github.io/goal-keeper">Goal Keeper</a><a className="fa fa-github" href="https://github.com/AlexanderBiba/goal-keeper" target="_blank"/></h3>
                <h4>A to-do list with a twist! React.js, Firebase DB, Material UI</h4>
                <h3><a className="project" href="https://github.com/AlexanderBiba/password-generator">Python Password Generator</a><a className="fa fa-github" href="https://github.com/AlexanderBiba/password-generator" target="_blank"/></h3>
                <h4>A Password Generator using Python secrets, unit-tests with PyTest</h4>
                <h3><a className="project" href="https://AlexanderBiba.github.io/">My Personal Homepage</a><a className="fa fa-github" href="https://github.com/AlexanderBiba/AlexanderBiba.github.io" target="_blank"/></h3>
                <h4>You're already here, might as well check out the code, written in React.s</h4>
            </div>
        </section>
    )
}
