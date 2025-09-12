import React from 'react';

const TermsAndConditions = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-2xl">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Terms and Conditions
        </h2>
      </div>
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-2xl">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="space-y-6">
            <p className="text-sm text-gray-700">
              Please read these terms and conditions carefully before using Our Service.
            </p>

            <h3 className="text-lg font-medium text-gray-900">Interpretation and Definitions</h3>
            <p className="text-sm text-gray-700">
              The words of which the initial letter is capitalized have meanings defined under the following conditions. The following definitions shall have the same meaning regardless of whether they appear in singular or in plural.
            </p>

            <h3 className="text-lg font-medium text-gray-900">Acknowledgment</h3>
            <p className="text-sm text-gray-700">
              These are the Terms and Conditions governing the use of this Service and the agreement that operates between You and the Company. These Terms and Conditions set out the rights and obligations of all users regarding the use of the Service.
            </p>
            <p className="text-sm text-gray-700">
              Your access to and use of the Service is conditioned on Your acceptance of and compliance with these Terms and Conditions. These Terms and Conditions apply to all visitors, users and others who access or use the Service.
            </p>
            <p className="text-sm text-gray-700">
              By accessing or using the Service You agree to be bound by these Terms and Conditions. If You disagree with any part of these Terms and Conditions then You may not access the Service.
            </p>

            <h3 className="text-lg font-medium text-gray-900">Demo User Restrictions</h3>
            <p className="text-sm text-gray-700">Users with a 'demo' account are subject to the following restrictions:</p>
            <ul className="list-disc list-inside text-sm text-gray-700">
              <li>Demo users are limited to a single lead generation search.</li>
              <li>The results of the lead generation search will not be displayed directly on the website.</li>
              <li>Generated leads for demo users will be processed and made available in the user's dashboard.</li>
            </ul>

            <h3 className="text-lg font-medium text-gray-900">User Accounts</h3>
            <p className="text-sm text-gray-700">
              When You create an account with Us, You must provide Us information that is accurate, complete, and current at all times. Failure to do so constitutes a breach of the Terms, which may result in immediate termination of Your account on Our Service.
            </p>
            <p className="text-sm text-gray-700">
              You are responsible for safeguarding the password that You use to access the Service and for any activities or actions under Your password, whether Your password is with Our Service or a third-party social media service.
            </p>

            <h3 className="text-lg font-medium text-gray-900">Intellectual Property</h3>
            <p className="text-sm text-gray-700">
              The Service and its original content, features and functionality are and will remain the exclusive property of the Company and its licensors.
            </p>

            <h3 className="text-lg font-medium text-gray-900">Limitation of Liability</h3>
            <p className="text-sm text-gray-700">
              Notwithstanding any damages that You might incur, the entire liability of the Company and any of its suppliers under any provision of this Terms and Your exclusive remedy for all of the foregoing shall be limited to the amount actually paid by You through the Service or 100 USD if You haven't purchased anything through the Service.
            </p>

            <h3 className="text-lg font-medium text-gray-900">"AS IS" and "AS AVAILABLE" Disclaimer</h3>
            <p className="text-sm text-gray-700">
              The Service is provided to You "AS IS" and "AS AVAILABLE" and with all faults and defects without warranty of any kind.
            </p>

            <h3 className="text-lg font-medium text-gray-900">Governing Law</h3>
            <p className="text-sm text-gray-700">
              The laws of the Country, excluding its conflicts of law rules, shall govern this Terms and Your use of the Service. Your use of the Application may also be subject to other local, state, national, or international laws.
            </p>

            <h3 className="text-lg font-medium text-gray-900">Disputes Resolution</h3>
            <p className="text-sm text-gray-700">
              If You have any concern or dispute about the Service, You agree to first try to resolve the dispute informally by contacting the Company.
            </p>

            <h3 className="text-lg font-medium text-gray-900">Changes to These Terms and Conditions</h3>
            <p className="text-sm text-gray-700">
              We reserve the right, at Our sole discretion, to modify or replace these Terms at any time. If a revision is material We will make reasonable efforts to provide at least 30 days' notice prior to any new terms taking effect. What constitutes a material change will be determined at Our sole discretion.
            </p>

            <h3 className="text-lg font-medium text-gray-900">Contact Us</h3>
            <p className="text-sm text-gray-700">
              If you have any questions about these Terms and Conditions, You can contact us:
            </p>
            <ul className="list-disc list-inside text-sm text-gray-700">
              <li>By email: support@example.com</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsAndConditions;