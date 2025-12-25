'use client'

import { useState, FormEvent } from 'react'
import '../Contact.scss'

export default function Contact() {
    const [contactResponseMessage, setContactResponseMessage] = useState('')
    
    const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const form = e.currentTarget
        const formData = new FormData(form)
        const name = formData.get('user_name') as string
        const email = formData.get('user_email') as string
        const message = formData.get('message') as string
        
        // Create mailto link
        const subject = encodeURIComponent(`Contact from ${name}`)
        const body = encodeURIComponent(`From: ${name} (${email})\n\n${message}`)
        window.location.href = `mailto:?subject=${subject}&body=${body}`
        
        setContactResponseMessage('Opening your email client...')
        setTimeout(() => setContactResponseMessage(''), 5000)
        form.reset()
    }
    
    return (
        <section id="contact">
            <h2 className="title">Contact Me</h2>
            <div className="content">
                <form id="contact-form" onSubmit={handleSubmit}>
                    <input className="contact-field" type="text" name="user_name" placeholder="Name" required />
                    <input className="contact-field" type="email" name="user_email" placeholder="Email" required />
                    <textarea className="contact-field" name="message" placeholder="Message" required />
                    <button id="submit-button" type="submit">Submit</button>
                </form>
                {contactResponseMessage.length > 0 && <h3>{contactResponseMessage}</h3>}
            </div>
        </section>
    )
}

