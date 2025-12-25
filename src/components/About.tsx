import Image from 'next/image'
import '../About.scss'

export default function About() {
  return (
    <section id="about">
      <div className="about-content">
        <div className="avatar">
          <Image src="/avatar.png" alt="Alex Biba Profile Pic" width={200} height={200} />
        </div>
        <div className="content">
          <h2>About Me</h2>
          <p>
            I'm a hands-on engineer who enjoys turning complex ideas into
            simple, scalable products. I work across the stack with Node.js,
            React, and cloud technologies, always aiming to write code that's
            clean, maintainable, and purposeful. I care about building things
            that actually make an impact — not just ship fast, but last.{' '}
          </p>
          <div className="passions">
            <h3>Passions</h3>
            <div className="passion-tags">
              <span className="tag">Software Development</span>
              <span className="tag">AI Tools</span>
              <span className="tag">3D Printing</span>
              <span className="tag">Music</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

