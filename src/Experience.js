import "./Experience.scss";

export default function Experience() {
    return (
        <div className="experience">
            <h2 className="title">Experience</h2>
            <div className="content">
                <div>
                    <h3>Bloomberg L.P.</h3>
                    <h4>2016-2022</h4>
                    <p>Developing financial products, maintaining critical services and designing databases, using various tools including Vue.js, Node.js, Groovy, Python, C++, SQL</p>
                </div>
                <div>
                    <h3>Intel Corporation</h3>
                    <h4>2015-2016</h4>
                    <p>Developing pre-silicon hardware verification enviroments for an image processing SoC</p>
                </div>
                <div>
                    <h3>CSR plc (acquired by Qualcomm)</h3>
                    <h4>2012-2015</h4>
                    <p>Developing pre-silicon hardware verification enviroments for automotive SoCs</p>
                </div>
            </div>
        </div>
    )
}