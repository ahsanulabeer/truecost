import { useState } from "react";
import HowItWorksModal from "./HowItWorksModal";

export default function Header({ onHome }) {
  const [showHow, setShowHow] = useState(false);

  return (
    <>
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

        <button
          type="button"
          className="header-link"
          onClick={() => setShowHow(true)}
        >
          How it works
        </button>
      </header>
      {showHow && <HowItWorksModal onClose={() => setShowHow(false)} />}
    </>
  );
}
