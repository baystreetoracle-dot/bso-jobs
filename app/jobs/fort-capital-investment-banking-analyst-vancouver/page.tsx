import type { Metadata } from "next";
import Link from "next/link";
import "../anson-funds-investment-analyst/anson-role.css";

export const metadata: Metadata = {
  title: "Investment Banking Analyst at Fort Capital | BSO Jobs",
  description: "Vancouver Investment Banking Analyst opportunity at Fort Capital. Review the role, compensation and application instructions.",
  robots: { index: false, follow: false },
};

const PDF_PATH = "/job-postings/fort-capital-investment-banking-analyst-vancouver-2026.pdf";
const EMAIL_PATH = "mailto:careers.vancouver@fortcapital.ca?subject=Fort%20Capital%20Investment%20Banking%20Analyst";

export default function FortCapitalInvestmentBankingAnalystPage() {
  return <main className="anson-role-page">
    <nav className="anson-role-nav"><Link href="/jobs">BSO Jobs</Link><span>Exclusive opportunity</span></nav>
    <header className="anson-role-hero">
      <p className="anson-exclusive">BSO Exclusive</p>
      <p className="anson-company">Fort Capital</p>
      <h1>Investment Banking Analyst</h1>
      <div className="anson-facts"><span>Vancouver, BC</span><span>Hybrid</span><span>Analyst</span><span>Investment Banking</span><span>$100,000 CAD / year</span></div>
      <p className="anson-intro">A full-time Vancouver role working directly with senior bankers across live transactions, financial analysis, research and client materials.</p>
      <div className="anson-actions"><a className="primary" href={EMAIL_PATH}>Apply by email</a><a href={PDF_PATH} target="_blank" rel="noreferrer">View employer PDF</a></div>
    </header>

    <div className="anson-role-layout">
      <article>
        <section><h2>The role</h2><p>Fort Capital is adding an Investment Banking Analyst to its Vancouver office. The analyst will work alongside senior bankers in an entrepreneurial environment with exposure to active mandates and clients.</p></section>
        <section><h2>What you would work on</h2><ul><li>Financial models and analyses of financial statements and capital-markets information.</li><li>Industry and company research supporting transaction teams.</li><li>Client presentations and transaction materials.</li><li>Information databases and other resources used throughout deal execution.</li><li>Live transaction execution across Fort Capital&apos;s advisory practice.</li></ul></section>
        <section><h2>Experience and qualifications</h2><ul><li>Bachelor&apos;s degree with strong academic achievement.</li><li>Strong analytical, communication and interpersonal skills.</li><li>Self-motivated approach and the ability to manage competing deadlines.</li><li>Previous M&amp;A advisory, private equity or corporate-development experience is favourable but not required.</li><li>CPA, CFA or CBV progress is considered an asset.</li></ul></section>
        <section><h2>Compensation and benefits</h2><p>The employer lists a CAD 100,000 annual base salary plus a discretionary bonus. Benefits include extended health coverage, four weeks of paid vacation, work-from-home Fridays and work-from-anywhere periods around major holidays.</p></section>
      </article>
      <aside>
        <p className="anson-aside-label">How to apply</p>
        <h2>Email one complete application.</h2>
        <p>Send your résumé, cover letter and latest academic transcript directly to Fort Capital. Use “Fort Capital Investment Banking Analyst” as the email subject.</p>
        <a className="anson-email" href={EMAIL_PATH}>careers.vancouver@fortcapital.ca</a>
        <a className="anson-pdf" href={PDF_PATH} target="_blank" rel="noreferrer">Open the complete employer PDF</a>
        <p className="anson-source-note">This opportunity was supplied directly to BSO. The employer PDF is preserved without changes. Applications remain open until the position is filled.</p>
      </aside>
    </div>
  </main>;
}
