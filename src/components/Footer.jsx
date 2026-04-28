
export default function Footer() {
  return (
    <footer className="ft-footer">
      <div className="ft-footer__inner">
        <span>© {new Date().getFullYear()} Flight Tracker — Project 3</span>
        <span className="ft-footer__credits">
          Built by Jon, JASD3EP & Clonexstax
        </span>
      </div>
    </footer>
  );
}
