'use client';

import { useState, useCallback } from 'react';
import { useGoogleReCaptcha } from 'react-google-recaptcha-v3';

export default function ContactForm() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    company: '',
    message: '',
  });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const { executeRecaptcha } = useGoogleReCaptcha();

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMessage('');

    try {
      let recaptchaToken = '';

      if (executeRecaptcha) {
        recaptchaToken = await executeRecaptcha('contact_form');
      }

      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          recaptchaToken,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus('success');
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          company: '',
          message: '',
        });
      } else {
        setStatus('error');
        setErrorMessage(data.error || 'Failed to submit form. Please try again.');
      }
    } catch {
      setStatus('error');
      setErrorMessage('An error occurred. Please try again later.');
    }
  }, [executeRecaptcha, formData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5">
        <div>
          <label htmlFor="contact-firstName" className="mb-1.5 block text-sm font-medium text-gray-700">
            First Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="contact-firstName"
            name="firstName"
            required
            value={formData.firstName}
            onChange={handleChange}
            className="w-full rounded-md border border-gray-300 px-4 py-3 text-base outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-accent"
            placeholder="John"
          />
        </div>
        <div>
          <label htmlFor="contact-lastName" className="mb-1.5 block text-sm font-medium text-gray-700">
            Last Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="contact-lastName"
            name="lastName"
            required
            value={formData.lastName}
            onChange={handleChange}
            className="w-full rounded-md border border-gray-300 px-4 py-3 text-base outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-accent"
            placeholder="Doe"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5">
        <div>
          <label htmlFor="contact-email" className="mb-1.5 block text-sm font-medium text-gray-700">
            Email Address <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            id="contact-email"
            name="email"
            required
            value={formData.email}
            onChange={handleChange}
            className="w-full rounded-md border border-gray-300 px-4 py-3 text-base outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-accent"
            placeholder="john@company.com"
          />
        </div>
        <div>
          <label htmlFor="contact-phone" className="mb-1.5 block text-sm font-medium text-gray-700">
            Phone Number
          </label>
          <input
            type="tel"
            id="contact-phone"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            className="w-full rounded-md border border-gray-300 px-4 py-3 text-base outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-accent"
            placeholder="(555) 000-0000"
          />
        </div>
      </div>

      <div>
        <label htmlFor="contact-company" className="mb-1.5 block text-sm font-medium text-gray-700">
          Company Name
        </label>
        <input
          type="text"
          id="contact-company"
          name="company"
          value={formData.company}
          onChange={handleChange}
          className="w-full rounded-md border border-gray-300 px-4 py-3 text-base outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-accent"
          placeholder="Your Company"
        />
      </div>

      <div>
        <label htmlFor="contact-message" className="mb-1.5 block text-sm font-medium text-gray-700">
          How can we help? <span className="text-red-500">*</span>
        </label>
        <textarea
          id="contact-message"
          name="message"
          required
          rows={4}
          value={formData.message}
          onChange={handleChange}
          className="w-full resize-none rounded-md border border-gray-300 px-4 py-3 text-base outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-accent"
          placeholder="Tell us about your business and capital needs..."
        />
      </div>

      <button
        type="submit"
        disabled={status === 'loading'}
        className="w-full rounded-md bg-accent px-8 py-4 text-base font-bold text-white transition-all duration-300 hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
      >
        {status === 'loading' ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Sending...
          </span>
        ) : (
          'Send Message'
        )}
      </button>

      {status === 'success' && (
        <div className="rounded-md border border-green-200 bg-green-50 p-4">
          <p className="text-center text-sm font-medium text-green-700">
            Thank you for your inquiry. We&apos;ll be in touch shortly.
          </p>
        </div>
      )}

      {status === 'error' && (
        <div className="rounded-md border border-red-200 bg-red-50 p-4">
          <p className="text-center text-sm font-medium text-red-700">
            {errorMessage}
          </p>
        </div>
      )}

      <p className="text-center text-xs text-gray-500">
        This site is protected by reCAPTCHA and the Google{' '}
        <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="underline hover:text-accent">
          Privacy Policy
        </a>{' '}
        and{' '}
        <a href="https://policies.google.com/terms" target="_blank" rel="noopener noreferrer" className="underline hover:text-accent">
          Terms of Service
        </a>{' '}
        apply.
      </p>
    </form>
  );
}
