import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from '@/components/Header';
import Hero from '@/components/Hero';
import Features from '@/components/Features';
import HowItWorks from '@/components/HowItWorks';
import Download from '@/components/Download';
import Testimonials from '@/components/Testimonials';
import Footer from '@/components/Footer';
import Documentation from '@/pages/Documentation';
import License from '@/pages/License';
import PrivacyPolicy from '@/pages/PrivacyPolicy';
import TermsOfService from '@/pages/TermsOfService';

function HomePage() {
    return (
        <>
            <Hero />
            <Features />
            <HowItWorks />
            <Download />
            <Testimonials />
        </>
    );
}

export default function App() {
    return (
        <Router>
            <div className="min-h-screen bg-gray-950 overflow-x-hidden">
                <Header />
                <main>
                    <Routes>
                        <Route path="/" element={<HomePage />} />
                        <Route path="/documentation" element={<Documentation />} />
                        <Route path="/license" element={<License />} />
                        <Route path="/privacy" element={<PrivacyPolicy />} />
                        <Route path="/terms" element={<TermsOfService />} />
                    </Routes>
                </main>
                <Footer />
            </div>
        </Router>
    );
}
