import "./Works.scss";

export default function Works() {
    return (
        <section id="works">
            <h2 className="title">Code Samples</h2>
            <div className="content">
                <h3><a className="project" href="https://github.com/AlexanderBiba/timezone-converter-extension">Timezone Converter Browser Extension</a><a className="fa fa-github" href="https://github.com/AlexanderBiba/timezone-converter-extension" target="_blank"/></h3>
                <p>A browser extension that allows conversion of natural language timestamp expressions to a user configured timezone.</p>
                <h3><a className="project" href="https://AlexanderBiba.github.io/wordle">Wordle</a><a className="fa fa-github" href="https://github.com/AlexanderBiba/wordle" target="_blank"/></h3>
                <p>A classic wordle game with a new word every day, React.js., Firebase DB, Google Cloud Functions</p>
                <h3><a className="project" href="https://AlexanderBiba.github.io/goal-keeper">Goal Keeper</a><a className="fa fa-github" href="https://github.com/AlexanderBiba/goal-keeper" target="_blank"/></h3>
                <p>Complete daily tasks by working with a partner, React.js, Firebase DB, Material UI.</p>
                <h3><a className="project" href="https://AlexanderBiba.github.io/">My Personal Homepage</a><a className="fa fa-github" href="https://github.com/AlexanderBiba/AlexanderBiba.github.io" target="_blank"/></h3>
                <p>You're already here, might as well check out the code, written in React.js.</p>
            </div>
        </section>
    )
}
