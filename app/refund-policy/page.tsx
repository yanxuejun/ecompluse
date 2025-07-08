import React from "react";

export default function RefundPolicyPage() {
  return (
    <main className="max-w-2xl mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold mb-6">Refund and Dispute Policy</h1>
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">1. Overview</h2>
        <p>
          At EcomPulse, we are committed to customer satisfaction. This Refund and Dispute Policy outlines the terms and conditions under which refunds and dispute resolutions are handled for purchases made through our platform.
        </p>
      </section>
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">2. Refund Eligibility</h2>
        <ul className="list-disc pl-6">
          <li>Refund requests must be submitted within 14 days of purchase.</li>
          <li>Products or services must be unused and in their original condition.</li>
          <li>Certain digital products or services may not be eligible for refunds. Please refer to the product description for details.</li>
        </ul>
      </section>
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">3. How to Request a Refund</h2>
        <ol className="list-decimal pl-6">
          <li>Contact our support team at <a href="mailto:support@ecompulsedata.com" className="text-blue-600 underline">support@ecompulsedata.com</a> with your order details.</li>
          <li>Provide a clear reason for your refund request and any supporting documentation.</li>
          <li>Our team will review your request and respond within 5 business days.</li>
        </ol>
      </section>
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">4. Dispute Resolution</h2>
        <p>
          If you are dissatisfied with the outcome of your refund request, you may escalate the issue by contacting our dispute resolution team at <a href="mailto:disputes@ecompulsedata.com" className="text-blue-600 underline">disputes@ecompulsedata.com</a>. We aim to resolve all disputes in a fair and timely manner.
        </p>
      </section>
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">5. Exceptions</h2>
        <ul className="list-disc pl-6">
          <li>Refunds are not available for services that have already been rendered or products that have been used.</li>
          <li>Custom or personalized products are non-refundable unless defective.</li>
        </ul>
      </section>
      <section>
        <h2 className="text-xl font-semibold mb-2">6. Contact Us</h2>
        <p>
          For any questions regarding this policy, please contact us at <a href="mailto:support@ecompulsedata.com" className="text-blue-600 underline">support@ecompulsedata.com</a>.
        </p>
      </section>
    </main>
  );
} 