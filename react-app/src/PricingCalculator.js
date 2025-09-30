import React from 'react';

const PricingCalculator= () => {
  return (
    <div className="calculator-container">
      <h2>Construction Cost Calculator</h2>
      <p>Use the UltraTech  calculator below to estimate your project costs.</p>
      
      {/* UltraTech Calculator */}
      <h3>UltraTech Cost Calculator</h3>
      <iframe
        src="https://www.ultratechcement.com/for-homebuilders/homebuilding-explained/home-planning-tools/cost-calculator"
        title="UltraTech Cost Calculator"
        width="100%"
        height="600px"
        style={{ border: 'none' }}
        allowFullScreen
      ></iframe>

    </div>
  );
};

export default PricingCalculator;
