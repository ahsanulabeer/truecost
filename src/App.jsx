import { useState, useEffect, useRef } from "react";
import "./App.css";
import Header from "./components/Header";
import SearchForm from "./components/SearchForm";
import LoadingState, { LOADING_STEP_COUNT } from "./components/LoadingState";
import ResultView from "./components/ResultView";
import NearbyListings from "./components/NearbyListings";
import { formatThousands } from "./utils/format";
import { getLoanType } from "./utils/loans";
import { useNearbyListings } from "./hooks/useNearbyListings";

async function fetchRentCastData(address) {
  try {
    const resp = await fetch("/api/rentcast", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address }),
    });
    if (!resp.ok) return null;
    return await resp.json();
  } catch (_) {
    return null;
  }
}

async function fetchPropertyImage(address) {
  try {
    const resp = await fetch("/api/property-image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address }),
    });
    if (!resp.ok) return null;
    return await resp.json();
  } catch (_) {
    return null;
  }
}

export default function TrueCostAI() {
  const [address, setAddress] = useState("");
  const [listingPrice, setListingPrice] = useState("");
  const [downPayment, setDownPayment] = useState("20");
  const [interestRate, setInterestRate] = useState("7.1");
  const [householdSize, setHouseholdSize] = useState("2");
  const [loanType, setLoanType] = useState("30yr-fixed");
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [result, setResult] = useState(null);
  const [propertyData, setPropertyData] = useState(null);
  const [propertyImage, setPropertyImage] = useState(null);
  const [error, setError] = useState(null);
  const [nearbyKey, setNearbyKey] = useState(0);
  const rightPanelRef = useRef(null);

  const nearby = useNearbyListings({ refreshSignal: nearbyKey });

  useEffect(() => {
    let interval;
    if (loading) {
      setLoadingStep(0);
      interval = setInterval(() => {
        setLoadingStep((s) => Math.min(s + 1, LOADING_STEP_COUNT - 1));
      }, 600);
    }
    return () => clearInterval(interval);
  }, [loading]);

  useEffect(() => {
    if (loading || result || error) {
      rightPanelRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, [loading, result, error]);

  function goHome() {
    setAddress("");
    setListingPrice("");
    setResult(null);
    setPropertyData(null);
    setPropertyImage(null);
    setError(null);
    setLoading(false);
    setLoadingStep(0);
    setNearbyKey((k) => k + 1);
  }

  async function analyze(addressOverride) {
    const overrideAddr =
      typeof addressOverride === "string" ? addressOverride : null;
    const target = (overrideAddr ?? address).trim();
    if (!target) return;
    if (overrideAddr) {
      setAddress(overrideAddr);
    }
    setLoading(true);
    setResult(null);
    setPropertyData(null);
    setPropertyImage(null);
    setError(null);
    setListingPrice("");

    const down = parseFloat(downPayment) || 20;
    const rate = parseFloat(interestRate) || 7.1;

    try {
      const imgData = await fetchPropertyImage(target);
      if (!imgData?.addressValid) {
        throw new Error(
          "That doesn't look like a complete address. Please include a street number, street name, city, and state — for example, \"123 Main St, Brooklyn, NY 11201\"."
        );
      }

      const rcData = await fetchRentCastData(
        imgData.formattedAddress || target
      );

      setPropertyData(rcData);
      setPropertyImage(imgData);

      if (rcData?.price) {
        setListingPrice(formatThousands(rcData.price));
      }

      const hasRealData = rcData !== null;
      const price = rcData?.price || null;

      const resolvedAddress =
        rcData?.address || imgData?.formattedAddress || target;

      let propertyContext;
      if (hasRealData) {
        const monthlyTaxFromRecords = rcData.annualTax
          ? Math.round(rcData.annualTax / 12)
          : null;
        const taxLine = rcData.annualTax
          ? `Annual Property Tax (verified public records${rcData.taxYear ? `, ${rcData.taxYear}` : ""}): $${rcData.annualTax.toLocaleString()} — use exactly $${monthlyTaxFromRecords.toLocaleString()}/mo for the propertyTax.amount, and split it across the County/School/Municipal/Special District breakdown to sum to that monthly figure.`
          : null;
        const details = [
          `Address: ${resolvedAddress}`,
          price && `Listing/Estimated Price: $${price.toLocaleString()} (${rcData.source === "listing" ? "active MLS listing" : "AVM estimate"})`,
          rcData.propertyType && `Property Type: ${rcData.propertyType}`,
          rcData.beds && `Bedrooms: ${rcData.beds}`,
          rcData.baths && `Bathrooms: ${rcData.baths}`,
          rcData.sqft && `Square Footage: ${rcData.sqft.toLocaleString()}`,
          rcData.yearBuilt && `Year Built: ${rcData.yearBuilt}`,
          rcData.lotSize && `Lot Size: ${rcData.lotSize.toLocaleString()} sqft`,
          taxLine,
        ].filter(Boolean).join("\n");
        propertyContext = `VERIFIED PROPERTY DATA (from RentCast API — use these exact values):\n${details}`;
      } else {
        propertyContext = `Address: ${resolvedAddress}\nNote: No property data was found via the data API. Interpret the address flexibly and estimate all values based on the neighborhood/area.`;
      }

      const loan = getLoanType(loanType);
      const armNote = loan.isArm
        ? " This is an adjustable-rate mortgage — flag the rate-reset risk in red flags (payment can change substantially after the initial fixed period if rates move)."
        : "";

      let mortgageContext = "";
      if (price) {
        const loanAmount = price * (1 - down / 100);
        const mr = rate / 100 / 12;
        const n = loan.termMonths;
        const mortgage = Math.round(
          (loanAmount * (mr * Math.pow(1 + mr, n))) /
            (Math.pow(1 + mr, n) - 1)
        );
        mortgageContext = `\nPre-calculated mortgage P+I (${loan.promptDescription} at ${rate}%, ${down}% down, loan $${loanAmount.toLocaleString()}): $${mortgage.toLocaleString()}/mo — use this exact figure for the mortgage amount.${armNote}`;
      } else {
        mortgageContext = `\nDown Payment: ${down}%\nMortgage Rate: ${rate}%\nLoan: ${loan.promptDescription}\nEstimate a realistic market value for the area and calculate mortgage accordingly.${armNote}`;
      }

      const householdContext = `\nHousehold: ${householdSize} occupant${householdSize === "1" ? "" : "s"}. Factor this into utilities (water, electricity, gas scale near-linearly with occupants — a 4-person household runs roughly 2x the utility cost of a 1-person household at the same property) and modestly into maintenance (heavier occupancy accelerates appliance turnover and wear, ~10-15% higher than baseline).`;

      const prompt = `A user wants to understand the TRUE monthly cost of owning a home.

${propertyContext}
${mortgageContext}
${householdContext}

Return ONLY a valid JSON object (no markdown, no text outside the JSON):

{
  "property": {
    "address": "formatted full address",
    "city": "city name",
    "state": "state abbreviation",
    "estimatedListingPrice": number,
    "beds": number or null,
    "baths": number or null,
    "sqft": number or null,
    "yearBuilt": number or null,
    "propertyType": "Single Family / Condo / Townhouse / etc"
  },
  "monthlyCosts": {
    "mortgage": {
      "amount": number,
      "note": "principal+interest at given rate/term",
      "breakdown": [{ "label": "Principal", "amount": number }, { "label": "Interest", "amount": number }]
    },
    "propertyTax": {
      "amount": number,
      "note": "estimated based on local county tax rate",
      "breakdown": [{ "label": "County", "amount": number }, { "label": "School District", "amount": number }, { "label": "Municipal", "amount": number }, { "label": "Special Districts", "amount": number }]
    },
    "homeInsurance": {
      "amount": number,
      "note": "estimated based on region, home value, weather risk",
      "breakdown": [{ "label": "Dwelling", "amount": number }, { "label": "Personal Property", "amount": number }, { "label": "Liability", "amount": number }, { "label": "Loss of Use", "amount": number }]
    },
    "utilities": {
      "amount": number,
      "note": "electric, gas, water based on local climate and avg sqft usage",
      "breakdown": [{ "label": "Electricity", "amount": number }, { "label": "Gas/Heating", "amount": number }, { "label": "Water/Sewer", "amount": number }, { "label": "Trash", "amount": number }]
    },
    "maintenance": {
      "amount": number,
      "note": "1% rule adjusted for age, climate, property type",
      "breakdown": [{ "label": "HVAC", "amount": number }, { "label": "Roof", "amount": number }, { "label": "Plumbing", "amount": number }, { "label": "Exterior", "amount": number }, { "label": "Interior", "amount": number }, { "label": "Landscaping", "amount": number }]
    },
    "hoa": {
      "amount": number,
      "note": "estimated or 0 if unlikely for this property type and area",
      "breakdown": [{ "label": "Reserves", "amount": number }, { "label": "Amenities", "amount": number }, { "label": "Maintenance", "amount": number }, { "label": "Management", "amount": number }]
    }
  },
  "confidence": "high" or "medium" or "low",
  "analysis": "2-3 sentence narrative on what drives cost in this specific area. Be specific — mention local tax rates, climate risks, insurance costs, utility environment.",
  "redFlags": ["array of 0-3 specific cost warnings for this property/region"],
  "marketContext": "1 sentence on local real estate market context"
}

Use the verified property data above when available. For cost estimates, use your knowledge of US real estate, county tax rates, regional utility costs, and insurance risk factors.

For each monthlyCosts entry, the breakdown sub-component amounts MUST sum to the line's total amount. Use realistic categorical splits based on US norms. Round each sub-component to the nearest whole dollar; if rounding creates a small mismatch with the total, adjust the largest sub-component to make them sum exactly. If a category does not apply (e.g., HOA is 0, or a property has no separate amenities), you may omit that breakdown entry — the array can be 1-6 items.`;

      const resp = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 2500,
          system:
            "You are a real estate financial analyst. Always respond with valid JSON only. No markdown fences, no explanation, no text outside the JSON object.",
          messages: [{ role: "user", content: prompt }],
        }),
      });

      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({}));
        throw new Error(
          errData.error?.message || `API error: ${resp.status} ${resp.statusText}`
        );
      }

      const data = await resp.json();
      if (data.error) throw new Error(data.error.message);

      const text = data.content?.map((b) => b.text || "").join("") || "";
      const clean = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);

      if (rcData) {
        parsed.property = {
          ...parsed.property,
          address:
            rcData.address ||
            imgData?.formattedAddress ||
            parsed.property?.address,
          city: rcData.city || parsed.property?.city,
          state: rcData.state || parsed.property?.state,
          estimatedListingPrice: rcData.price || parsed.property?.estimatedListingPrice,
          beds: rcData.beds ?? parsed.property?.beds,
          baths: rcData.baths ?? parsed.property?.baths,
          sqft: rcData.sqft ?? parsed.property?.sqft,
          yearBuilt: rcData.yearBuilt ?? parsed.property?.yearBuilt,
          propertyType: rcData.propertyType || parsed.property?.propertyType,
        };
      }

      if (rcData?.annualTax && parsed.monthlyCosts?.propertyTax) {
        const monthlyTax = Math.round(rcData.annualTax / 12);
        const oldTax = parsed.monthlyCosts.propertyTax.amount || monthlyTax;
        parsed.monthlyCosts.propertyTax.amount = monthlyTax;
        parsed.monthlyCosts.propertyTax.source = "public-records";
        parsed.monthlyCosts.propertyTax.taxYear = rcData.taxYear || null;
        if (Array.isArray(parsed.monthlyCosts.propertyTax.breakdown)) {
          const ratio = monthlyTax / oldTax;
          parsed.monthlyCosts.propertyTax.breakdown =
            parsed.monthlyCosts.propertyTax.breakdown.map((b) => ({
              ...b,
              amount: Math.round((b.amount || 0) * ratio),
            }));
        }
      }

      if (!listingPrice && parsed.property?.estimatedListingPrice) {
        setListingPrice(formatThousands(parsed.property.estimatedListingPrice));
      }

      setResult(parsed);
    } catch (err) {
      if (err instanceof SyntaxError) {
        setError("Received an incomplete response. Please try again.");
      } else {
        setError(err.message || "Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  const activeDown = parseFloat(downPayment) || 20;
  const activeRate = parseFloat(interestRate) || 7.1;
  const activePriceNum =
    parseFloat(listingPrice.replace(/[^0-9.]/g, "")) || null;

  const activeLoan = getLoanType(loanType);

  const computedMortgage = (() => {
    if (activePriceNum) {
      const loanAmt = activePriceNum * (1 - activeDown / 100);
      const mr = activeRate / 100 / 12;
      const n = activeLoan.termMonths;
      return Math.round(
        (loanAmt * (mr * Math.pow(1 + mr, n))) / (Math.pow(1 + mr, n) - 1)
      );
    }
    return result?.monthlyCosts?.mortgage?.amount || 0;
  })();

  const computedMortgageBreakdown = (() => {
    if (!activePriceNum) return null;
    const loanAmt = activePriceNum * (1 - activeDown / 100);
    const mr = activeRate / 100 / 12;
    const interest = Math.round(loanAmt * mr);
    const principal = Math.max(0, computedMortgage - interest);
    return [
      { label: "Principal", amount: principal },
      { label: "Interest", amount: interest },
    ];
  })();

  const nonMortgageCosts = result
    ? (result.monthlyCosts?.propertyTax?.amount || 0) +
      (result.monthlyCosts?.homeInsurance?.amount || 0) +
      (result.monthlyCosts?.utilities?.amount || 0) +
      (result.monthlyCosts?.maintenance?.amount || 0) +
      (result.monthlyCosts?.hoa?.amount || 0)
    : 0;

  const trueMonthlyCost = result ? computedMortgage + nonMortgageCosts : 0;
  const trueAnnualCost = trueMonthlyCost * 12;
  const costToListingRatio = activePriceNum
    ? trueAnnualCost / activePriceNum
    : null;

  return (
    <div className="app">
      <Header onHome={goHome} />

      <main className="main">
        <section className="left-panel">
          <h1 className="headline">
            What does it <span>really</span> cost
            <br />
            to own your home?
          </h1>
          <p className="subhead">
            Beyond the listing price — mortgage, taxes, insurance, utilities,
            maintenance, and HOA. The full picture, powered by real data.
          </p>

          <SearchForm
            address={address}
            setAddress={setAddress}
            downPayment={downPayment}
            setDownPayment={setDownPayment}
            interestRate={interestRate}
            setInterestRate={setInterestRate}
            householdSize={householdSize}
            setHouseholdSize={setHouseholdSize}
            loanType={loanType}
            setLoanType={setLoanType}
            loading={loading}
            onAnalyze={analyze}
          />
        </section>

        <section className="right-panel" ref={rightPanelRef}>
          {loading ? (
            <LoadingState loadingStep={loadingStep} />
          ) : error ? (
            <div className="error-box">{error}</div>
          ) : result ? (
            <ResultView
              result={result}
              propertyData={propertyData}
              propertyImage={propertyImage}
              listingPrice={listingPrice}
              setListingPrice={setListingPrice}
              computedMortgage={computedMortgage}
              computedMortgageBreakdown={computedMortgageBreakdown}
              trueMonthlyCost={trueMonthlyCost}
              trueAnnualCost={trueAnnualCost}
              costToListingRatio={costToListingRatio}
              nearbyListings={nearby.listings}
              nearbyRefreshing={nearby.refreshing}
              onRefreshNearby={nearby.refresh}
              onSelectListing={(addr) => analyze(addr)}
            />
          ) : (
            <NearbyListings
              listings={nearby.listings}
              refreshing={nearby.refreshing}
              fallbackName={nearby.fallbackName}
              onRefresh={nearby.refresh}
              onSelectListing={(addr) => analyze(addr)}
            />
          )}
        </section>
      </main>
    </div>
  );
}
