import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const StudentDocPage = () => {
    const containerVariants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } }
    };

    return (
        <div className="min-h-screen bg-[#0b0a2a] text-white font-mono overflow-x-hidden selection:bg-blue-500/30">
            {/* Header Navbar */}
            <header className="fixed top-6 left-1/2 -translate-x-1/2 w-[90%] max-w-7xl z-50 flex justify-between items-center py-5 border border-white/20 backdrop-blur-lg px-8 rounded-full bg-[#0b0a2a]/40 shadow-lg shadow-black/10">
                <Link to="/public" className="flex items-center space-x-3 hover:opacity-90 transition-opacity">
                    <img src="/logo.png" alt="Solve-X Logo" className="w-8 h-8 object-contain" />
                    <span className="text-md tracking-[0.2em] uppercase font-saira-stencil">SOLVE-X</span>
                </Link>
                <div className="flex items-center space-x-4">
                    <Link to="/public" className="text-xs font-semibold tracking-[0.15em] border border-white/20 px-4 py-2 rounded-lg hover:bg-white/10 transition-colors uppercase">
                        Back to Home
                    </Link>
                </div>
            </header>

            {/* Document Content */}
            <main className="max-w-4xl mx-auto pt-36 pb-24 px-6 space-y-16">
                
                {/* Intro Title */}
                <motion.div 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4 text-center"
                >
                    <span className="inline-block text-[10px] tracking-[0.2em] uppercase font-saira-stencil px-4 py-1.5 rounded-full text-[#ECD7AD] border border-white/20 bg-white/10 backdrop-blur-md">
                        📘 OFFICIAL DOCUMENTATION
                    </span>
                    <h1 className="text-3xl md:text-6xl font-hammersmith-one uppercase tracking-tight leading-none">
                        Student Guide & Guidelines
                    </h1>
                    <p className="text-xs md:text-sm text-neutral-400 max-w-2xl mx-auto font-raleway leading-relaxed">
                        Get your coding doubts solved in real-time by expert mentors. Post your doubt, choose from competitive bids starting at just ₹99, and learn through a dedicated interactive workspace.
                    </p>
                </motion.div>

                {/* Core Value Highlight */}
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className="p-8 rounded-3xl bg-gradient-to-r from-blue-950/40 via-indigo-950/30 to-blue-950/40 border border-blue-500/20 backdrop-blur-md flex flex-col md:flex-row items-center justify-between gap-6"
                >
                    <div className="space-y-2 max-w-xl">
                        <h3 className="text-xl font-bold uppercase tracking-wider font-hammersmith-one text-[#ECD7AD]">Starting at just ₹99</h3>
                        <p className="text-xs text-neutral-300 font-raleway leading-relaxed">
                            No high subscriptions or hidden monthly fees. Pay only for the doubts you need solved. Submit your budget and receive bids directly from verified tech mentors.
                        </p>
                    </div>
                    <Link to="/register?role=student" className="bg-white text-black font-bold uppercase tracking-wider text-xs px-6 py-4 rounded-xl hover:bg-neutral-200 transition-colors whitespace-nowrap">
                        Post Your Doubt
                    </Link>
                </motion.div>

                {/* Step-by-Step Join Process */}
                <motion.section 
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true }}
                    className="space-y-8"
                >
                    <h2 className="text-2xl font-hammersmith-one uppercase tracking-wider border-b border-white/10 pb-2">How It Works for Students</h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <motion.div variants={itemVariants} className="glass-card p-6 rounded-2xl space-y-4">
                            <div className="w-10 h-10 rounded-full bg-blue-500/20 text-blue-400 font-bold flex items-center justify-center border border-blue-500/30 text-lg">1</div>
                            <h3 className="text-md font-bold uppercase font-hammersmith-one">1. Post a Doubt</h3>
                            <p className="text-xs text-neutral-400 font-raleway leading-relaxed">
                                Enter your issue description, code snippet, and selected programming stack. Set your budget starting from ₹99.
                            </p>
                        </motion.div>

                        <motion.div variants={itemVariants} className="glass-card p-6 rounded-2xl space-y-4">
                            <div className="w-10 h-10 rounded-full bg-indigo-500/20 text-[#ECD7AD] font-bold flex items-center justify-center border border-indigo-500/30 text-lg">2</div>
                            <h3 className="text-md font-bold uppercase font-hammersmith-one">2. Compare & Select</h3>
                            <p className="text-xs text-neutral-400 font-raleway leading-relaxed">
                                Review custom bids from verified mentors. Check their profile rating, experience, and budget proposals to select the best match.
                            </p>
                        </motion.div>

                        <motion.div variants={itemVariants} className="glass-card p-6 rounded-2xl space-y-4">
                            <div className="w-10 h-10 rounded-full bg-blue-500/20 text-blue-400 font-bold flex items-center justify-center border border-blue-500/30 text-lg">3</div>
                            <h3 className="text-md font-bold uppercase font-hammersmith-one">3. 1-on-1 Session</h3>
                            <p className="text-xs text-neutral-400 font-raleway leading-relaxed">
                                Enter the live workspace. Collaborate using real-time audio/video calls, dynamic code editors, and whiteboard tools.
                            </p>
                        </motion.div>
                    </div>
                </motion.section>

                {/* FAQ Section */}
                <motion.section 
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    className="space-y-6"
                >
                    <h2 className="text-2xl font-hammersmith-one uppercase tracking-wider border-b border-white/10 pb-2">Frequently Asked Questions</h2>
                    
                    <div className="space-y-6 font-raleway text-sm text-neutral-300">
                        <div className="space-y-2">
                            <h3 className="font-bold text-white uppercase tracking-wide">Q: What if the mentor cannot solve my doubt?</h3>
                            <p className="text-xs leading-relaxed text-neutral-400">
                                Solve-X uses a secure escrow payment model. If the mentor is unable to solve your problem or if you are not satisfied, the payment will not be released, and a full refund will be processed.
                            </p>
                        </div>
                        <div className="space-y-2">
                            <h3 className="font-bold text-white uppercase tracking-wide">Q: How fast do mentors respond to posted doubts?</h3>
                            <p className="text-xs leading-relaxed text-neutral-400">
                                Most students receive their first mentor bid within 3 to 5 minutes of posting. We have active experts across JavaScript, Python, C++, Java, Cloud, DevOps, and more.
                            </p>
                        </div>
                        <div className="space-y-2">
                            <h3 className="font-bold text-white uppercase tracking-wide">Q: Can I request the same mentor again?</h3>
                            <p className="text-xs leading-relaxed text-neutral-400">
                                Yes. You can save mentors to your "Favorites" list and send direct private doubt requests to them whenever they are online.
                            </p>
                        </div>
                    </div>
                </motion.section>

                {/* Quick Join CTA */}
                <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center space-y-4 pt-8 border-t border-white/10"
                >
                    <p className="text-xs text-neutral-400 font-raleway">Ready to debug your code with a pro?</p>
                    <Link to="/register?role=student" className="inline-block bg-gradient-to-r from-[#3D3B93] to-[#7f7ad8] text-white font-bold uppercase tracking-wider text-xs px-8 py-4 rounded-xl hover:opacity-90 transition-opacity">
                        Get Started Now
                    </Link>
                </motion.div>

            </main>

            {/* Footer */}
            <footer className="w-full max-w-7xl mx-auto flex justify-between items-center text-[9px] tracking-[0.2em] text-neutral-400 border-t border-white/10 py-6 px-6 z-10">
                <span>© 2026 SOLVE-X. ALL RIGHTS RESERVED.</span>
                <span>[ STATUS: READY ]</span>
            </footer>
        </div>
    );
};

export default StudentDocPage;
