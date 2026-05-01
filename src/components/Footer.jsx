export default function Footer() {
  return (
    <footer className="ft-footer">
      <div className="ft-footer__inner">
        <span>© {new Date().getFullYear()} Flight Tracker</span>
        <span className="ft-footer__credits">
          Built by Jonathan Torres, Jasdeep Singh & Saleh Al-Dharhani
        </span>
      </div>
    </footer>
  );
}
