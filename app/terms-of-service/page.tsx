import React from 'react';
import Link from 'next/link';

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="mb-8">
            <Link 
              href="/" 
              className="text-blue-600 hover:text-blue-800 transition-colors duration-200"
            >
              ← Back to Home
            </Link>
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Terms of Service</h1>
          <p className="text-gray-600 mb-6">Last updated: {new Date().toLocaleDateString()}</p>
          
          <div className="space-y-6 text-gray-700">
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Acceptance of Terms</h2>
              <p>
                By accessing and using EcompulseData services, you accept and agree to be bound by the 
                terms and provision of this agreement. If you do not agree to abide by the above, 
                please do not use this service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Description of Service</h2>
              <p className="mb-3">
                EcompulseData provides e-commerce analytics and product trend analysis services, including:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Product ranking and trend analysis</li>
                <li>Market research and insights</li>
                <li>Data visualization and reporting</li>
                <li>API access to our data services</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">3. User Accounts</h2>
              <p className="mb-3">When you create an account with us, you must provide accurate and complete information. You are responsible for:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Maintaining the security of your account</li>
                <li>All activities that occur under your account</li>
                <li>Notifying us immediately of any unauthorized use</li>
                <li>Ensuring your account information remains current</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Acceptable Use</h2>
              <p className="mb-3">You agree not to use the service to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Violate any applicable laws or regulations</li>
                <li>Infringe on intellectual property rights</li>
                <li>Transmit harmful, offensive, or inappropriate content</li>
                <li>Attempt to gain unauthorized access to our systems</li>
                <li>Interfere with the service or other users</li>
                <li>Use the service for commercial purposes without proper authorization</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Payment Terms</h2>
              <p className="mb-3">
                Subscription fees are billed in advance on a recurring basis. You agree to pay all 
                charges at the prices then in effect for your use of the service.
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>All payments are non-refundable unless otherwise stated</li>
                <li>We may change our pricing with 30 days notice</li>
                <li>Failed payments may result in service suspension</li>
                <li>You may cancel your subscription at any time</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Intellectual Property</h2>
              <p>
                The service and its original content, features, and functionality are and will remain 
                the exclusive property of EcompulseData and its licensors. The service is protected by 
                copyright, trademark, and other laws.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Data and Privacy</h2>
              <p>
                Your use of the service is also governed by our Privacy Policy. By using the service, 
                you consent to the collection and use of information as detailed in our Privacy Policy.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Service Availability</h2>
              <p>
                We strive to maintain high availability of our service, but we do not guarantee 
                uninterrupted access. We may temporarily suspend the service for maintenance, 
                updates, or other operational reasons.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">9. Limitation of Liability</h2>
              <p>
                In no event shall EcompulseData be liable for any indirect, incidental, special, 
                consequential, or punitive damages, including without limitation, loss of profits, 
                data, use, goodwill, or other intangible losses.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">10. Termination</h2>
              <p>
                We may terminate or suspend your account and bar access to the service immediately, 
                without prior notice or liability, under our sole discretion, for any reason 
                whatsoever and without limitation.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">11. Governing Law</h2>
              <p>
                These Terms shall be interpreted and governed by the laws of the jurisdiction in 
                which EcompulseData operates, without regard to its conflict of law provisions.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">12. Changes to Terms</h2>
              <p>
                We reserve the right to modify or replace these Terms at any time. If a revision is 
                material, we will provide at least 30 days notice prior to any new terms taking effect.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-3">13. Contact Information</h2>
              <p>
                If you have any questions about these Terms of Service, please contact us at:{' '}
                <a 
                  href="mailto:legal@ecompulsedata.com" 
                  className="text-blue-600 hover:text-blue-800 transition-colors duration-200"
                >
                  legal@ecompulsedata.com
                </a>
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
} 