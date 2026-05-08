import { useEffect, useRef, useState } from "react";
import { LOAN_TYPES } from "../utils/loans";

export default function SearchForm({
  address,
  setAddress,
  downPayment,
  setDownPayment,
  interestRate,
  setInterestRate,
  householdSize,
  setHouseholdSize,
  loanType,
  setLoanType,
  loading,
  onAnalyze,
}) {
  const [suggestions, setSuggestions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const justSelected = useRef(false);

  function fetchSuggestions(query) {
    fetch("/api/place-autocomplete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    })
      .then((r) => (r.ok ? r.json() : { suggestions: [] }))
      .then((data) => {
        setSuggestions(data.suggestions || []);
        setActiveIndex(-1);
      })
      .catch(() => {});
  }

  useEffect(() => {
    if (justSelected.current) {
      justSelected.current = false;
      return;
    }
    if (!address || address.trim().length < 3) {
      setSuggestions([]);
      setActiveIndex(-1);
      return;
    }
    const timer = setTimeout(() => fetchSuggestions(address), 250);
    return () => clearTimeout(timer);
  }, [address]);

  function handleFocus() {
    setShowDropdown(true);
    if (suggestions.length === 0 && address.trim().length >= 3) {
      fetchSuggestions(address);
    }
  }

  function handleSelect(s) {
    justSelected.current = true;
    setAddress(s.description);
    setSuggestions([]);
    setShowDropdown(false);
    setActiveIndex(-1);
  }

  function handleKeyDown(e) {
    const dropdownOpen = showDropdown && suggestions.length > 0;
    if (e.key === "Enter") {
      if (dropdownOpen && activeIndex >= 0) {
        e.preventDefault();
        handleSelect(suggestions[activeIndex]);
        return;
      }
      if (!loading) onAnalyze();
      return;
    }
    if (!dropdownOpen) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === "Escape") {
      setShowDropdown(false);
      setActiveIndex(-1);
    }
  }

  const dropdownVisible = showDropdown && suggestions.length > 0;

  return (
    <>
      <div className="search-wrapper">
        <div className="search-row">
          <input
            className="search-input"
            placeholder="Enter a home address (e.g. 1062 Calhoun Ave, Bronx NY 10465)"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            onFocus={handleFocus}
            onBlur={() => setShowDropdown(false)}
            onKeyDown={handleKeyDown}
            autoComplete="off"
          />
        </div>
        {dropdownVisible && (
          <ul className="search-suggestions" role="listbox">
            {suggestions.map((s, i) => (
              <li
                key={s.description}
                role="option"
                aria-selected={i === activeIndex}
                className={`search-suggestion${i === activeIndex ? " active" : ""}`}
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSelect(s);
                }}
                onMouseEnter={() => setActiveIndex(i)}
              >
                <span className="search-suggestion-main">{s.mainText}</span>
                {s.secondaryText && (
                  <span className="search-suggestion-secondary">
                    {s.secondaryText}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="params-row">
        <div className="param-field">
          <span className="param-label">Down Payment %</span>
          <input
            className="param-input"
            placeholder="20"
            value={downPayment}
            onChange={(e) => setDownPayment(e.target.value)}
          />
        </div>
        <div className="param-field">
          <span className="param-label">Interest Rate %</span>
          <input
            className="param-input"
            placeholder="7.1"
            value={interestRate}
            onChange={(e) => setInterestRate(e.target.value)}
          />
        </div>
        <div className="param-field">
          <span className="param-label">Household Size</span>
          <select
            className="param-input param-select"
            value={householdSize}
            onChange={(e) => setHouseholdSize(e.target.value)}
          >
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4</option>
            <option value="5+">5+</option>
          </select>
        </div>
        <div className="param-field">
          <span className="param-label">Loan Type</span>
          <select
            className="param-input param-select"
            value={loanType}
            onChange={(e) => setLoanType(e.target.value)}
          >
            {LOAN_TYPES.map((l) => (
              <option key={l.value} value={l.value}>
                {l.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <button
        type="button"
        className="generate-btn"
        onClick={() => onAnalyze()}
        disabled={loading || !address.trim()}
      >
        {loading ? "Generating..." : "Generate TrueCost Report"}
      </button>
    </>
  );
}
