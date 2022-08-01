import "./Experience.scss";

export default function Experience() {
    return (
        <section id="experience">
            <h2 className="title">Experience</h2>
            <div className="content">
                <div>
                    <h3>Bloomberg, New York</h3>
                    <h4>2018-2022</h4>
                    <p>Developing Equity Research Document Search Engine and a Collaborative Document Viewer Web Application</p>
                </div>
                <div>
                    <h3>Bloomberg, Tel Aviv</h3>
                    <h4>2016-2018</h4>
                    <p>Developing Bloomberg's Transaction Cost Analysis (BTCA) Terminal Application</p>
                </div>
                <div>
                    <h3>Intel, Haifa</h3>
                    <h4>2015-2016</h4>
                    <p>Developing pre-silicon hardware verification enviroments for an image processing SoC</p>
                </div>
                <div>
                    <h3>CSR (acquired by Qualcomm), Haifa</h3>
                    <h4>2012-2015</h4>
                    <p>Developing pre-silicon hardware verification enviroments for automotive SoCs</p>
                </div>
            </div>
        </section>
    )
}