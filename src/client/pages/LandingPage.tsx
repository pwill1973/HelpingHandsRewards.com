import { Link } from 'react-router-dom'

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-ton-blue to-blue-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-5xl font-bold mb-6">
              2×2 Community Matrix on TON
            </h1>
            <p className="text-xl mb-8 max-w-3xl mx-auto">
              A decentralized community support system built on the TON blockchain. 
              Join a transparent, multi-level community network where members support each other.
            </p>
            <div className="flex justify-center space-x-4">
              <Link to="/join" className="bg-white text-ton-blue hover:bg-gray-100 font-bold py-3 px-8 rounded-lg transition-colors">
                Join the Community
              </Link>
              <Link to="/login" className="border-2 border-white hover:bg-white hover:text-ton-blue font-bold py-3 px-8 rounded-lg transition-colors">
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900 dark:text-white">
            How It Works
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-ton-blue/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-ton-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">Join the Community</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Register with a referral link and become part of the 2×2 Community Matrix structure.
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 bg-ton-blue/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-ton-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">Make Contributions</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Participate by making contributions to the community through TON blockchain.
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-16 h-16 bg-ton-blue/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-ton-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">Receive Rewards</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Receive recurring community rewards based on your matrix activity and referrals.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* About Section */}
      <div className="py-20 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-8 text-gray-900 dark:text-white">
            What is a 2×2 Community Matrix?
          </h2>
          <div className="prose dark:prose-invert max-w-none">
            <p className="text-lg text-gray-700 dark:text-gray-300 mb-4">
              The 2×2 Community Matrix is a decentralized community support structure where each member 
              has positions for 2 direct members on Level 1, and 4 members on Level 2 (2 under each Level 1 position).
            </p>
            <p className="text-lg text-gray-700 dark:text-gray-300 mb-4">
              This creates a transparent, fair system where community activity generates recurring rewards 
              for active participants. Built on the TON blockchain, all contributions and rewards are 
              verifiable and transparent.
            </p>
            <p className="text-lg text-gray-700 dark:text-gray-300">
              <strong>Important:</strong> This is a people-helping-people community support system, 
              not a financial product. Participation is voluntary, and the focus is on building 
              a supportive decentralized community.
            </p>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-20 bg-ton-blue text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-6">
            Ready to Join the Community?
          </h2>
          <p className="text-xl mb-8">
            Be part of a transparent, decentralized community support system on TON.
          </p>
          <Link to="/join" className="bg-white text-ton-blue hover:bg-gray-100 font-bold py-3 px-8 rounded-lg transition-colors inline-block">
            Get Started Now
          </Link>
        </div>
      </div>
    </div>
  )
}
