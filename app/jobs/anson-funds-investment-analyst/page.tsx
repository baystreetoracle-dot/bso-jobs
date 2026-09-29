import type { Metadata } from "next";
import Link from "next/link";
import "./anson-role.css";

export const metadata: Metadata = {
  title: "Investment Analyst at Anson Funds | BSO Jobs",
  description: "Toronto-based Investment Analyst opportunity at Anson Funds. Review the role and application instructions.",
  robots: { index: false, follow: false },
};

const PDF_PATH = "/job-postings/anson-funds-investment-analyst-2026-09.pdf";
const EMAIL_PATH = "mailto:spuri@ansonfunds.com?subject=Investment%20Analyst%20Application";

export default function AnsonFundsInvestmentAnalystPage() {
  return <main className="anson-role-page">
    <nav className="anson-role-nav"><Link href="/jobs">BSO Jobs</Link><span>Exclusive opportunity</span></nav>
    <header className="anson-role-hero">
      <p className="anson-exclusive">BSO Exclusive</p>
      <p className="anson-company">Anson Funds</p>
      <h1>Investment Analyst</h1>
      <div className="anson-facts"><span>Toronto, ON</span><span>On-site, 5 days per week</span><span>Analyst</span><span>Hedge Fund</span></div>
      <p className="anson-intro">A fundamental public-markets role supporting long and short idea generation, company research, financial modelling and portfolio analysis at Anson Funds.</p>
      <div className="anson-actions"><a className="primary" href={EMAIL_PATH}>Apply by email</a><a href={PDF_PATH} target="_blank" rel="noreferrer">View employer PDF</a></div>
    </header>

    <div className="anson-role-layout">
      <article>
        <section><h2>The role</h2><p>Anson Funds is adding an Investment Analyst to its Toronto investment team. The analyst will work closely with senior investors on fundamental research, financial analysis and idea generation across public markets.</p></section>
        <section><h2>What you would work on</h2><ul><li>Fundamental research on public companies across multiple sectors.</li><li>Detailed financial models covering valuation, accounting and capital structure.</li><li>Long and short investment theses, including catalysts, risks and expected returns.</li><li>Idea sourcing through quantitative screens, thematic and event-driven research, corporate actions and news flow.</li><li>Monitoring existing positions and contributing to portfolio analysis.</li></ul></section>
        <section><h2>Experience and qualifications</h2><ul><li>Two to five years in investment banking, private equity, equity research, investment management or financial consulting.</li><li>Strong financial modelling, accounting and Excel skills.</li><li>Experience with research platforms such as Bloomberg, FactSet or Capital IQ.</li><li>Ability to form and defend independent investment views.</li><li>Undergraduate degree or higher; CFA or similar designation is an asset.</li></ul></section>
        <section><h2>Compensation</h2><p>The employer describes a competitive package with annual performance bonuses and potential additional compensation linked to fund returns. No numerical range was provided.</p></section>
      </article>
      <aside>
        <p className="anson-aside-label">How to apply</p>
        <h2>Send a résumé and cover letter.</h2>
        <p>Applications go directly to Sunny Puri, Co-Head, Investments.</p>
        <a className="anson-email" href={EMAIL_PATH}>spuri@ansonfunds.com</a>
        <a className="anson-pdf" href={PDF_PATH} target="_blank" rel="noreferrer">Open the complete employer PDF</a>
        <p className="anson-source-note">This opportunity was supplied directly to BSO. The employer PDF is preserved without changes.</p>
      </aside>
    </div>
  </main>;
}
