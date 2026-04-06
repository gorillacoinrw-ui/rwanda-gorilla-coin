import { Link } from "react-router-dom";

const Footer = () => (
  <footer className="w-full py-3 text-center text-xs text-muted-foreground border-t border-border bg-background space-y-1">
    <div className="flex items-center justify-center gap-3">
      <Link to="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link>
      <span>·</span>
      <Link to="/terms" className="hover:text-primary transition-colors">Terms & Conditions</Link>
    </div>
    <p>© Gorilla Coin Rwanda 2026</p>
  </footer>
);

export default Footer;
