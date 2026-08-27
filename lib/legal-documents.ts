export type LegalSection = { heading: string; paragraphs?: string[]; items?: string[] };

export type LegalDocument = {
  slug: string;
  shortTitle: string;
  title: string;
  summary: string;
  sections: LegalSection[];
};

export const legalDocuments: LegalDocument[] = [
  {
    slug: "terms-of-service",
    shortTitle: "Terms of Service",
    title: "Nexora Rank Terms of Service",
    summary: "The agreement for workspaces that use Nexora Rank, its dashboard, Discord bot, identity linking, and future paid services.",
    sections: [
      { heading: "1. Pre-launch status", paragraphs: ["Nexora Rank is currently a private beta. These terms are a pre-launch draft and become binding only when the service is publicly offered and an operator is identified. Paid plans are not available today."] },
      { heading: "2. Who may use the service", paragraphs: ["You must be at least 13 and old enough to use Discord and Roblox in your location. If you are under the age of legal majority, a parent or guardian must approve your use and any future purchase. A workspace owner must have authority to act for the community they connect."] },
      { heading: "3. Accounts and integrations", paragraphs: ["You are responsible for your connected accounts, workspace membership, and accurate configuration. Nexora uses official authorization flows and will never ask for a Discord user token or a Roblox .ROBLOSECURITY cookie."], items: ["Follow Discord, Roblox, and applicable community rules.", "Grant only permissions you are authorized to grant.", "Keep recovery methods and administrator access secure.", "Tell us promptly about suspected unauthorized access."] },
      { heading: "4. Workspace operations", paragraphs: ["Rank changes, role sync, applications, activity records, and automations may affect real communities. Workspace owners decide who can approve and execute actions and are responsible for reviewing permissions, rank paths, and automation rules before enabling them."] },
      { heading: "5. Beta availability", paragraphs: ["Features may change, pause, or be removed during beta. We may limit operations to protect users, third-party platforms, or service reliability. Preview and simulated dashboard data must not be treated as a completed production integration."] },
      { heading: "6. Future paid plans", paragraphs: ["If paid plans launch, price, renewal interval, taxes, cancellation controls, and the applicable checkout provider terms will be shown before purchase. No fee can be charged through the current private-beta site."] },
      { heading: "7. Suspension and termination", paragraphs: ["We may restrict or end access for abuse, security risk, unlawful use, non-payment after paid plans launch, or violations of these terms or third-party platform rules. Workspace owners may stop using Nexora and request deletion subject to legal, security, and backup retention needs."] },
      { heading: "8. Intellectual property", paragraphs: ["Nexora Rank, its interface, code, original graphics, and brand assets are protected by applicable intellectual-property law. You keep ownership of content you submit and give Nexora only the permission needed to host, process, and display it to operate the service."] },
      { heading: "9. Disclaimers and liability", paragraphs: ["The beta is provided on an as-available basis. To the maximum extent permitted by law, Nexora does not guarantee uninterrupted service or that third-party platforms will accept every operation. Nothing in these terms removes consumer rights or liability that cannot legally be excluded. Final liability limits and governing-law terms require operator review before public launch."] },
      { heading: "10. Contact and changes", paragraphs: ["Material changes will be dated and, when appropriate, announced in the dashboard or Discord support community. A dedicated legal contact and operator identity will be published before public registration or billing begins."] },
    ],
  },
  {
    slug: "terms-of-use",
    shortTitle: "Terms of Use",
    title: "Website & Bot Terms of Use",
    summary: "Rules for the public website, documentation, downloadable brand assets, demo dashboard, and Discord command surfaces.",
    sections: [
      { heading: "1. Accepting these terms", paragraphs: ["By browsing or using Nexora public surfaces after launch, you agree to these website and bot terms. Workspace services are additionally governed by the Terms of Service."] },
      { heading: "2. Permitted use", items: ["Evaluate Nexora for a community you own or are authorized to manage.", "Download provided bot assets for accurate Nexora listings and documentation.", "Share links to Nexora pages without suggesting an endorsement or partnership.", "Use commands only in servers where you have permission."] },
      { heading: "3. Prohibited use", items: ["Probe, scrape, overload, or bypass security and access controls.", "Impersonate Nexora or misrepresent affiliation.", "Copy the interface or brand assets to create a confusingly similar service.", "Use demos or command responses to deceive users about completed actions.", "Upload malware, unlawful content, or credentials belonging to another person."] },
      { heading: "4. Third-party services", paragraphs: ["Discord and Roblox are independent platforms with their own terms and privacy practices. Nexora is not endorsed by or affiliated with Discord Inc. or Roblox Corporation unless explicitly stated."] },
      { heading: "5. Feedback and availability", paragraphs: ["If you submit feedback, you allow Nexora to use it without restriction or payment, without identifying you publicly. Public pages may change or be unavailable while the private beta is developed."] },
    ],
  },
  {
    slug: "privacy",
    shortTitle: "Privacy Policy",
    title: "Nexora Rank Privacy Policy",
    summary: "What data Nexora expects to process, why it is needed, who receives it, and the controls available to users.",
    sections: [
      { heading: "1. Pre-launch notice", paragraphs: ["The current site is a private preview and real account connections remain disabled until the dedicated Nexora backend is connected. This policy documents the intended production data flow and will be finalized with the operator identity and contact details before launch."] },
      { heading: "2. Data we process", items: ["Discord account ID, username, avatar, server ID, roles, and authorized workspace membership.", "Roblox account ID, username, display name, group membership, rank, and authorized Open Cloud results.", "Workspace configuration, applications, activity summaries, approval decisions, automation events, and audit records.", "Technical logs such as time, request status, approximate network information, device/browser data, and security events.", "Billing identifiers and plan status after payments launch; full card details stay with the checkout provider."] },
      { heading: "3. Why we process it", paragraphs: ["We process data to provide requested account linking and workspace features, secure the service, prevent abuse, maintain auditability, support users, and meet legal obligations. Where applicable, the legal basis may be contract, legitimate interests, consent, or legal obligation depending on the activity and location."] },
      { heading: "4. Children and teenagers", paragraphs: ["Nexora is not directed to children under 13. Where consent is the legal basis, users below their country’s digital-consent age require verifiable parent or guardian consent. Community owners must not use Nexora to collect unnecessary personal information from minors."] },
      { heading: "5. Sharing and processors", paragraphs: ["Data may be shared with infrastructure, authentication, monitoring, support, and future payment providers only as needed to operate Nexora. Discord and Roblox receive requests as independent platforms. We do not sell personal data or use Roblox API data to train AI models."] },
      { heading: "6. Retention", paragraphs: ["Account and workspace data is kept while needed to provide the service. Security and audit records may be retained longer to investigate abuse and preserve operational integrity. Exact production retention periods will be published before launch; deletion from backups may take additional time."] },
      { heading: "7. Your choices and rights", items: ["Disconnect authorized accounts and revoke access from Discord or Roblox.", "Ask for access, correction, deletion, restriction, objection, or portability where applicable.", "Withdraw consent without affecting earlier lawful processing.", "Complain to the relevant data-protection authority.", "Request workspace deletion, subject to necessary security and legal retention."] },
      { heading: "8. Security and international transfers", paragraphs: ["Nexora is designed around scoped OAuth, row-level access controls, encrypted transport, secret isolation, and auditable privileged operations. No internet service can promise absolute security. If data crosses borders, an appropriate transfer mechanism will be used where required."] },
      { heading: "9. Contact", paragraphs: ["A dedicated privacy email and the legal operator’s identity will be published before public registration. Until then, do not submit sensitive information through the preview."] },
    ],
  },
  {
    slug: "cookies",
    shortTitle: "Cookie Policy",
    title: "Cookie & Local Storage Policy",
    summary: "A plain-language record of browser storage Nexora uses now and may use after account connections launch.",
    sections: [
      { heading: "1. Current preview", paragraphs: ["The private preview does not use advertising cookies. Necessary browser storage may be used for security, interface state, and preview access."] },
      { heading: "2. Necessary storage", items: ["Authentication session cookies after sign-in launches.", "Security, anti-abuse, load balancing, and request-integrity values.", "Preferences needed to remember interface or consent choices."] },
      { heading: "3. Analytics", paragraphs: ["Optional analytics will remain off unless they are configured with an appropriate legal basis and, where required, consent. Nexora will not add advertising trackers silently."] },
      { heading: "4. Controls", paragraphs: ["You can clear or block storage in your browser. Blocking necessary cookies may prevent sign-in and dashboard features. A consent control will be added before any non-essential cookies are enabled."] },
    ],
  },
  {
    slug: "acceptable-use",
    shortTitle: "Acceptable Use",
    title: "Acceptable Use Policy",
    summary: "The safety and platform-integrity rules that apply to every account, bot command, workspace, and automation.",
    sections: [
      { heading: "Use Nexora responsibly", items: ["Do not harass, exploit, discriminate against, or endanger users.", "Do not automate spam, raids, mass unsolicited messages, or deceptive engagement.", "Do not evade Roblox or Discord enforcement, rate limits, or permission systems.", "Do not request, store, or share Discord user tokens, Roblox security cookies, passwords, or private keys.", "Do not falsify activity, applications, votes, identities, rank eligibility, or audit evidence.", "Do not access another workspace or account without authorization.", "Do not sell, broker, or use platform-derived personal data for profiling or AI training.", "Do not use Nexora for unlawful commerce, fraud, malware, or intellectual-property infringement."] },
      { heading: "Enforcement", paragraphs: ["Nexora may slow, block, reverse, preserve evidence of, or report abusive activity when reasonably necessary. Serious or repeated violations may result in workspace suspension or termination."] },
      { heading: "Reporting", paragraphs: ["A dedicated abuse and security reporting channel will be published before launch. Do not post secrets or personal data in a public Discord channel when reporting an issue."] },
    ],
  },
  {
    slug: "refunds",
    shortTitle: "Refund Policy",
    title: "Cancellation & Refund Policy",
    summary: "What applies today and the commitments Nexora will make before any paid plan becomes available.",
    sections: [
      { heading: "No paid checkout today", paragraphs: ["Nexora Rank is currently free in private beta. There is no active checkout and Nexora cannot charge or refund a payment through this site."] },
      { heading: "Before billing launches", paragraphs: ["The checkout will clearly show the merchant of record, total price, tax handling, billing period, renewal behavior, cancellation method, and refund eligibility before payment. The final policy will respect mandatory consumer rights in the buyer’s location."] },
      { heading: "Planned subscription controls", items: ["Cancel future renewals from the billing portal.", "Keep access through the paid billing period unless fraud or abuse requires suspension.", "Request correction of duplicate or unauthorized charges promptly.", "Receive receipts and plan status from the checkout provider."] },
      { heading: "Checkout provider", paragraphs: ["Lemon Squeezy is the planned merchant-of-record provider but is not connected yet. Its buyer terms and payment handling will also apply if selected for launch."] },
    ],
  },
  {
    slug: "subprocessors",
    shortTitle: "Subprocessors",
    title: "Infrastructure & Subprocessors",
    summary: "A transparent view of services used or planned for hosting, authentication, storage, delivery, and payments.",
    sections: [
      { heading: "Current preview", items: ["OpenAI Sites — private preview build and hosting environment.", "Cloudflare — delivery and security infrastructure used by the current Sites preview."] },
      { heading: "Planned production services", items: ["Vercel — application hosting and delivery.", "Supabase — PostgreSQL database, authentication, row-level access control, and storage.", "Lemon Squeezy — planned merchant of record for checkout, tax, billing, and refunds."] },
      { heading: "Independent platforms", paragraphs: ["Discord and Roblox are integrations and independent platforms, not simply Nexora subprocessors. Their own terms and privacy policies govern the data they process. Provider roles, locations, and transfer safeguards will be finalized before production data is accepted."] },
      { heading: "Changes", paragraphs: ["Material additions that affect production personal data will be reflected here before or promptly after they take effect, with notice where legally required."] },
    ],
  },
];

export function getLegalDocument(slug: string) {
  return legalDocuments.find((document) => document.slug === slug);
}
