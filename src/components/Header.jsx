export default function Header({ onHome }) {
  return (
    <header className="header">
      <button
        type="button"
        className="logo-link"
        onClick={onHome}
        aria-label="TrueCost home"
      >
        <span className="logo-mark" aria-hidden="true">
          <span className="logo-mark-bar logo-mark-bar-top" />
          <span className="logo-mark-bar logo-mark-bar-bottom" />
        </span>
        <span className="logo-stack">
          <span className="logo">TrueCost</span>
          <span className="logo-sub">The real cost of home</span>
        </span>
      </button>
    </header>
  );
}
