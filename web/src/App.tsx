import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from '@/components/Header';
import Hero from '@/components/Hero';
import Features from '@/components/Features';
import NewFeaturesShowcase from '@/components/NewFeaturesShowcase';
import GitSyncShowcase from '@/components/GitSyncShowcase';
import HowItWorks from '@/components/HowItWorks';
import SecurityPrivacy from '@/components/SecurityPrivacy';
import Download from '@/components/Download';
import Testimonials from '@/components/Testimonials';
import Footer from '@/components/Footer';
import ScrollToTop from '@/components/ScrollToTop';
import Documentation from '@/pages/Documentation';
import License from '@/pages/License';
import PrivacyPolicy from '@/pages/PrivacyPolicy';
import TermsOfService from '@/pages/TermsOfService';
import InviteOnboardingPage from '@/pages/InviteOnboardingPage';

function HomePage() {
    return (
        <>
            <Hero />
            <Features />
            <NewFeaturesShowcase />
            <GitSyncShowcase />
            <HowItWorks />
            <SecurityPrivacy />
            <Download />
            <Testimonials />
        </>
    );
}

export default function App() {
    return (
        <Router>
            <ScrollToTop />
            <div className="min-h-screen bg-gray-950 overflow-x-hidden">
                <Header />
                <main>
                    <Routes>
                        <Route path="/" element={<HomePage />} />
                        <Route path="/documentation" element={<Documentation />} />
                        <Route path="/license" element={<License />} />
                        <Route path="/privacy" element={<PrivacyPolicy />} />
                        <Route path="/terms" element={<TermsOfService />} />
                        <Route path="/invite/:token" element={<InviteOnboardingPage />} />
                    </Routes>
                </main>
                <Footer />
            </div>
        </Router>
    );
}
