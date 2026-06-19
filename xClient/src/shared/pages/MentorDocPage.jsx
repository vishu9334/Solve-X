import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const MentorDocPage = () => {
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
                        Mentor Guide & Guidelines
                    </h1>
                    <p className="text-xs md:text-sm text-neutral-400 max-w-2xl mx-auto font-raleway leading-relaxed">
                        Become a verified mentor on Solve-X. Share your knowledge, help students resolve technical issues in real-time, and earn directly. No subscription or platform registration fee.
                    </p>
                </motion.div>

                {/* Core Policy Highlight (0% Charges) */}
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className="p-8 rounded-3xl bg-gradient-to-r from-blue-950/40 via-indigo-950/30 to-blue-950/40 border border-blue-500/20 backdrop-blur-md flex flex-col md:flex-row items-center justify-between gap-6"
                >
                    <div className="space-y-2 max-w-xl">
                        <h3 className="text-xl font-bold uppercase tracking-wider font-hammersmith-one text-[#ECD7AD]">Zero Platform Charges for Mentors</h3>
                        <p className="text-xs text-neutral-300 font-raleway leading-relaxed">
                            Solve-X does not charge mentors any registration fee, commission, or bidding cost. Joining is 100% free. You keep what you earn from solving students' doubts.
                        </p>
                    </div>
                    <Link to="/register?role=mentor" className="bg-white text-black font-bold uppercase tracking-wider text-xs px-6 py-4 rounded-xl hover:bg-neutral-200 transition-colors whitespace-nowrap">
                        Become a Mentor
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
                    <h2 className="text-2xl font-hammersmith-one uppercase tracking-wider border-b border-white/10 pb-2">How to Join & Start Earning</h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <motion.div variants={itemVariants} className="glass-card p-6 rounded-2xl space-y-4">
                            <div className="w-10 h-10 rounded-full bg-blue-500/20 text-blue-400 font-bold flex items-center justify-center border border-blue-500/30 text-lg">1</div>
                            <h3 className="text-md font-bold uppercase font-hammersmith-one">1. Register Profile</h3>
                            <p className="text-xs text-neutral-400 font-raleway leading-relaxed">
                                Sign up on Solve-X and select "Mentor" as your registration role. List your technical skills, stack experience, and profile bio.
                            </p>
                        </motion.div>

                        <motion.div variants={itemVariants} className="glass-card p-6 rounded-2xl space-y-4">
                            <div className="w-10 h-10 rounded-full bg-indigo-500/20 text-[#ECD7AD] font-bold flex items-center justify-center border border-indigo-500/30 text-lg">2</div>
                            <h3 className="text-md font-bold uppercase font-hammersmith-one">2. Credentials Verification</h3>
                            <p className="text-xs text-neutral-400 font-raleway leading-relaxed">
                                Our verification team conducts a brief review of your profile credentials and portfolio. Approval is usually done within 24 hours.
                            </p>
                        </motion.div>

                        <motion.div variants={itemVariants} className="glass-card p-6 rounded-2xl space-y-4">
                            <div className="w-10 h-10 rounded-full bg-blue-500/20 text-blue-400 font-bold flex items-center justify-center border border-blue-500/30 text-lg">3</div>
                            <h3 className="text-md font-bold uppercase font-hammersmith-one">3. Custom Bidding</h3>
                            <p className="text-xs text-neutral-400 font-raleway leading-relaxed">
                                Browse active student doubts. Propose your solution and place a bid. Once the student accepts your bid, connect instantly.
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
                            <h3 className="font-bold text-white uppercase tracking-wide">Q: How do I get paid?</h3>
                            <p className="text-xs leading-relaxed text-neutral-400">
                                Once the student approves the resolved doubt inside the 1-on-1 Workspace, their pre-funded bid amount is released and transferred directly to your connected wallet/bank account.
                            </p>
                        </div>
                        <div className="space-y-2">
                            <h3 className="font-bold text-white uppercase tracking-wide">Q: What tools are available in the 1-on-1 Workspace?</h3>
                            <p className="text-xs leading-relaxed text-neutral-400">
                                Our built-in workspace includes an interactive code editor, real-time audio/video chat, a shared whiteboard, and screen sharing to help you resolve doubts efficiently.
                            </p>
                        </div>
                        <div className="space-y-2">
                            <h3 className="font-bold text-white uppercase tracking-wide">Q: Are there any monthly subscriptions or hidden fees?</h3>
                            <p className="text-xs leading-relaxed text-neutral-400">
                                No. There are zero subscriptions, zero hidden charges, and zero platform taxes for mentors. Our main goal is to reward knowledge sharing directly.
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
                    <p className="text-xs text-neutral-400 font-raleway">Ready to share your skills and support learning?</p>
                    <Link to="/register?role=mentor" className="inline-block bg-gradient-to-r from-[#3D3B93] to-[#7f7ad8] text-white font-bold uppercase tracking-wider text-xs px-8 py-4 rounded-xl hover:opacity-90 transition-opacity">
                        Apply Now as Mentor
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

export default MentorDocPage;
