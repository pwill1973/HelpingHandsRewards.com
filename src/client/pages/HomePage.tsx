import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useLanguage } from '../contexts/LanguageContext'

export default function HomePage() {
  const { isAuthenticated } = useAuth()
  const { t } = useLanguage()

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-ton-blue to-blue-600 text-white py-20 md:py-32">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
            {t.home.heroTitle}
          </h1>
          <p className="text-xl md:text-2xl mb-4 text-blue-100">
            {t.home.heroSubtitle}
          </p>
          <p className="text-lg md:text-xl mb-8 max-w-3xl mx-auto text-blue-50">
            {t.home.heroDescription}
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
            <Link 
              to={isAuthenticated ? "/dashboard" : "/join"} 
              className="bg-white text-ton-blue hover:bg-gray-100 font-bold py-4 px-8 rounded-lg text-lg transition-all shadow-lg hover:shadow-xl"
            >
              {t.home.ctaButton}
            </Link>
            <a 
              href="#telegram-app" 
              className="border-2 border-white hover:bg-white hover:text-ton-blue font-bold py-4 px-8 rounded-lg text-lg transition-all"
            >
              {t.home.telegramButton}
            </a>
          </div>
          
          <p className="text-sm text-blue-100 max-w-2xl mx-auto">
            <strong>{t.compliance.disclaimer.split(':')[0]}:</strong> {t.compliance.disclaimer.split(':')[1]}
          </p>
        </div>
      </section>

      {/* Accessible for Everyone Section */}
      <section className="py-16 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-8 text-gray-900 dark:text-white">
            {t.home.accessibleTitle}
          </h2>
          
          <div className="space-y-6 text-lg text-gray-700 dark:text-gray-300">
            <p className="leading-relaxed">
              {t.home.accessiblePara1}
            </p>
            
            <p className="leading-relaxed">
              {t.home.accessiblePara2}
            </p>
            
            <div className="text-center py-4">
              <p className="text-2xl md:text-3xl font-bold text-ton-blue dark:text-blue-400">
                {t.home.accessibleTruth}
              </p>
            </div>
            
            <p className="leading-relaxed">
              {t.home.accessiblePara3}
            </p>
            
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border-2 border-ton-blue shadow-lg">
              <p className="text-xl md:text-2xl font-bold text-center text-gray-900 dark:text-white">
                {t.home.accessibleCore}
              </p>
            </div>
            
            <p className="leading-relaxed">
              {t.home.accessiblePara4}
            </p>
          </div>
        </div>
      </section>

      {/* Contribution Intro Section */}
      <section className="py-12 bg-blue-50 dark:bg-gray-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
            {t.home.contributionIntro}
          </p>
        </div>
      </section>

      {/* What is HelpingHandsRewards Section */}
      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-gray-900 dark:text-white">
            {t.home.whatIsTitle}
          </h2>
          
          <div className="max-w-4xl mx-auto">
            <p className="text-lg text-gray-700 dark:text-gray-300 mb-6 leading-relaxed">
              <strong>{t.home.heroTitle}</strong> {t.home.whatIsIntro.split('HelpingHandsRewards.com')[1]}
            </p>
            
            <p className="text-lg text-gray-700 dark:text-gray-300 mb-6 leading-relaxed">
              {t.home.whatIsDetails}
            </p>
            
            <div className="bg-blue-50 dark:bg-gray-800 rounded-xl p-8 mb-6">
              <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">{t.home.focusTitle}</h3>
              <ul className="space-y-3 text-lg text-gray-700 dark:text-gray-300">
                <li className="flex items-start">
                  <svg className="w-6 h-6 text-ton-blue mr-3 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>{t.home.focusPoint1}</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-6 h-6 text-ton-blue mr-3 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>{t.home.focusPoint2}</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-6 h-6 text-ton-blue mr-3 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>{t.home.focusPoint3}</span>
                </li>
              </ul>
            </div>
            
            <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
              {t.home.noPromises}
            </p>
          </div>
        </div>
      </section>

      {/* How the 2×2 Community Matrix Works */}
      <section className="py-20 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-gray-900 dark:text-white">
            {t.home.howWorksTitle}
          </h2>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {/* Step 1 */}
            <div className="bg-white dark:bg-gray-900 rounded-xl p-8 shadow-lg">
              <div className="w-16 h-16 bg-ton-blue rounded-full flex items-center justify-center text-white text-2xl font-bold mb-6">
                1
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
                {t.home.step1Title}
              </h3>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                {t.home.step1Description}
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-white dark:bg-gray-900 rounded-xl p-8 shadow-lg">
              <div className="w-16 h-16 bg-ton-blue rounded-full flex items-center justify-center text-white text-2xl font-bold mb-6">
                2
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
                {t.home.step2Title}
              </h3>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                {t.home.step2Description}
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-white dark:bg-gray-900 rounded-xl p-8 shadow-lg">
              <div className="w-16 h-16 bg-ton-blue rounded-full flex items-center justify-center text-white text-2xl font-bold mb-6">
                3
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
                {t.home.step3Title}
              </h3>
              <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                <li>• {t.home.step3Point1}</li>
                <li>• {t.home.step3Point2}</li>
                <li>• {t.home.step3Point3}</li>
                <li>• {t.home.step3Point4}</li>
              </ul>
            </div>

            {/* Step 4 */}
            <div className="bg-white dark:bg-gray-900 rounded-xl p-8 shadow-lg">
              <div className="w-16 h-16 bg-ton-blue rounded-full flex items-center justify-center text-white text-2xl font-bold mb-6">
                4
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
                {t.home.step4Title}
              </h3>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                {t.home.step4Description}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Contribution Levels Table */}
      <section className="py-20 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-6 text-gray-900 dark:text-white">
            {t.home.levelsTitle}
          </h2>
          <p className="text-center text-gray-600 dark:text-gray-400 mb-12 max-w-3xl mx-auto">
            {t.home.levelsSubtitle}
          </p>
          
          <div className="max-w-4xl mx-auto overflow-x-auto">
            <table className="w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg overflow-hidden">
              <thead className="bg-ton-blue text-white">
                <tr>
                  <th className="px-6 py-4 text-left">{t.common.level}</th>
                  <th className="px-6 py-4 text-right">{t.common.contribution} ({t.common.usdt_ton})</th>
                  <th className="px-6 py-4 text-left">{t.levels.status}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {[
                  { level: 1, amount: 5, desc: t.home.levelDescription1 },
                  { level: 2, amount: 10, desc: t.home.levelDescription2 },
                  { level: 3, amount: 20, desc: t.home.levelDescription3 },
                  { level: 4, amount: 40, desc: t.home.levelDescription4 },
                  { level: 5, amount: 80, desc: t.home.levelDescription5 },
                  { level: 6, amount: 160, desc: t.home.levelDescription6 },
                  { level: 7, amount: 320, desc: t.home.levelDescription7 },
                  { level: 8, amount: 640, desc: t.home.levelDescription8 },
                  { level: 9, amount: 1280, desc: t.home.levelDescription9 },
                  { level: 10, amount: 2560, desc: t.home.levelDescription10 },
                ].map((item) => (
                  <tr key={item.level} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">{item.level}</td>
                    <td className="px-6 py-4 text-right font-bold text-ton-blue">{item.amount.toLocaleString()}</td>
                    <td className="px-6 py-4 text-gray-700 dark:text-gray-300">{item.desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Full Potential Rewards Section */}
      <section className="py-20 bg-gradient-to-br from-blue-50 to-white dark:from-gray-800 dark:to-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900 dark:text-white">
              {t.home.fullPotentialTitle}
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
              {t.home.fullPotentialSubtitle}
            </p>
          </div>

          <div className="max-w-5xl mx-auto mb-12">
            <div className="bg-gradient-to-br from-ton-blue to-blue-600 text-white rounded-2xl p-8 shadow-2xl text-center mb-8">
              <p className="text-xl md:text-2xl leading-relaxed">
                {t.home.fullPotentialIntro}
              </p>
            </div>

            <h3 className="text-2xl font-bold text-center mb-8 text-gray-900 dark:text-white">
              {t.home.rewardsPerCycleTitle}
            </h3>
            <p className="text-center text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
              {t.home.rewardsPerCycleSubtitle}
            </p>

            <div className="overflow-x-auto">
              <table className="w-full bg-white dark:bg-gray-800 shadow-xl rounded-lg overflow-hidden">
                <thead className="bg-gradient-to-r from-ton-blue to-blue-600 text-white">
                  <tr>
                    <th className="px-6 py-4 text-left text-lg">{t.common.contribution}</th>
                    <th className="px-6 py-4 text-right text-lg">{t.common.rewards} per Cycle</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {t.home.rewardsBreakdown.map((item: any, index: number) => (
                    <tr key={index} className="hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors">
                      <td className="px-6 py-4 font-semibold text-gray-900 dark:text-white">
                        {item.level}
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-ton-blue dark:text-blue-400 text-lg">
                        {item.reward}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-gray-700 dark:to-gray-700 border-t-4 border-ton-blue">
                    <td className="px-6 py-5 font-bold text-gray-900 dark:text-white text-lg">
                      {t.home.fullPotentialTotal}
                    </td>
                    <td className="px-6 py-5 text-right font-bold text-green-600 dark:text-green-400 text-xl">
                      {t.home.fullPotentialTotalAmount}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg border-l-4 border-ton-blue">
              <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white flex items-center">
                <svg className="w-8 h-8 text-ton-blue mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                {t.home.motivationalTitle}
              </h3>
              <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
                {t.home.motivationalText}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Why TON & Telegram */}
      <section className="py-20 bg-gray-50 dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-gray-900 dark:text-white">
            {t.home.whyTonTitle}
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <div className="bg-white dark:bg-gray-900 rounded-xl p-8 text-center shadow-lg">
              <div className="w-20 h-20 bg-ton-blue/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-ton-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">{t.home.tonReason1Title}</h3>
              <p className="text-gray-700 dark:text-gray-300">
                {t.home.tonReason1Description}
              </p>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-xl p-8 text-center shadow-lg">
              <div className="w-20 h-20 bg-ton-blue/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-ton-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">{t.home.tonReason2Title}</h3>
              <p className="text-gray-700 dark:text-gray-300">
                {t.home.tonReason2Description}
              </p>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-xl p-8 text-center shadow-lg">
              <div className="w-20 h-20 bg-ton-blue/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-ton-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">{t.home.tonReason3Title}</h3>
              <p className="text-gray-700 dark:text-gray-300">
                {t.home.tonReason3Description}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* People Helping People Philosophy */}
      <section className="py-20 bg-ton-blue text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-8">
            {t.home.philosophyTitle}
          </h2>
          
          <p className="text-xl mb-6 leading-relaxed">
            {t.home.philosophyIntro}
          </p>
          
          <p className="text-lg mb-8 leading-relaxed max-w-3xl mx-auto">
            {t.home.philosophyDescription}
          </p>
          
          <div className="bg-white/10 rounded-xl p-8 max-w-3xl mx-auto">
            <h3 className="text-xl font-bold mb-4">{t.home.encourageTitle}</h3>
            <ul className="space-y-3 text-lg text-left">
              <li className="flex items-start">
                <svg className="w-6 h-6 mr-3 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>{t.home.encouragePoint1}</span>
              </li>
              <li className="flex items-start">
                <svg className="w-6 h-6 mr-3 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>{t.home.encouragePoint2}</span>
              </li>
              <li className="flex items-start">
                <svg className="w-6 h-6 mr-3 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>{t.home.encouragePoint3}</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 bg-white dark:bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-gray-900 dark:text-white">
            {t.home.faqTitle}
          </h2>
          
          <div className="space-y-6">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6">
              <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">
                {t.home.faq1Question}
              </h3>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                <strong>{t.common.no}.</strong> {t.home.faq1Answer}
              </p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6">
              <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">
                {t.home.faq2Question}
              </h3>
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2">
                <li>{t.home.faq2Answer1}</li>
                <li>{t.home.faq2Answer2}</li>
                <li>{t.home.faq2Answer3}</li>
              </ul>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6">
              <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">
                {t.home.faq3Question}
              </h3>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                <strong>{t.common.yes}.</strong> {t.home.faq3Answer}
              </p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6">
              <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">
                {t.home.faq4Question}
              </h3>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                <strong>{t.common.yes}.</strong> {t.home.faq4Answer}
              </p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6">
              <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white">
                {t.home.faq5Question}
              </h3>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                {t.home.faq5Answer}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="telegram-app" className="py-20 bg-gradient-to-br from-ton-blue to-blue-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            {t.home.readyTitle}
          </h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            {t.home.readySubtitle}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              to={isAuthenticated ? "/dashboard" : "/join"} 
              className="bg-white text-ton-blue hover:bg-gray-100 font-bold py-4 px-8 rounded-lg text-lg transition-all shadow-lg"
            >
              {t.home.webPlatform}
            </Link>
            <Link 
              to="/telegram" 
              className="border-2 border-white hover:bg-white hover:text-ton-blue font-bold py-4 px-8 rounded-lg text-lg transition-all"
            >
              {t.home.telegramMiniApp}
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
