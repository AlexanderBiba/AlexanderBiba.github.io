import "./Experience.scss";

export default function Experience() {
    return (
        <section id="experience">
            <h2 className="title">Experience</h2>
            <div className="content">
                <div>
                    <h3>Bloomberg, New York</h3>
                    <h4>2018-2022</h4>
                    <h5>Developing Equity Research Document Search Engine and a Collaborative Document Viewer Web Application</h5>
                </div>
                <div>
                    <h3>Bloomberg, Tel Aviv</h3>
                    <h4>2016-2018</h4>
                    <h5>Developing Bloomberg's Transaction Cost Analysis (BTCA) Terminal Application</h5>
                </div>
                <div>
                    <h3>Intel, Haifa</h3>
                    <h4>2015-2016</h4>
                    <h5>Developing pre-silicon hardware verification enviroments for an image processing SoC</h5>
                </div>
                <div>
                    <h3>CSR (acquired by Qualcomm), Haifa</h3>
                    <h4>2012-2015</h4>
                    <h5>Developing pre-silicon hardware verification enviroments for automotive SoCs</h5>
                </div>
            </div>
        </section>
    )
}