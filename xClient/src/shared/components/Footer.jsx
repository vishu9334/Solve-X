import { Link } from "react-router-dom";

const Footer = () => {
    return (
        <footer className="border-t border-white/10 px-4 py-4 text-[9px] tracking-[0.14em] text-[#777777] flex flex-col gap-2 bg-transparent box-border sm:flex-row sm:justify-between sm:px-8 sm:text-[10px] sm:tracking-[0.2em] items-center">
            <span>© 2026 SOLVE-X. ALL RIGHTS RESERVED.</span>
            <div className="flex gap-4">
                <Link to="/privacy" className="hover:text-white transition-colors no-underline">PRIVACY POLICY</Link>
                <span>•</span>
                <Link to="/terms" className="hover:text-white transition-colors no-underline">TERMS & CONDITIONS</Link>
            </div>
            <span>[ STATUS: SECURE ]</span>
        </footer>
    );
};

export default Footer;
