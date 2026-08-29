export type LegalSection = {
  heading: string;
  paragraphs?: string[];
  items?: string[];
};
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
    summary:
      "The service agreement for Nexora Rank accounts, workspaces, integrations, automations, and private-beta plans.",
    sections: [
      {
        heading: "1. Status and acceptance",
        paragraphs: [
          "Effective August 28, 2026. Nexora Rank is a private-beta service. By creating an account or using the website, dashboard, bot, API, integrations, or a workspace, you agree to these Terms and the policies in the Legal Center. If you act for a community or organization, you confirm that you may bind it to these terms.",
        ],
      },
      {
        heading: "2. Eligibility and accounts",
        paragraphs: [
          "You must be at least 13, meet the minimum age for Discord and Roblox in your location, and have any parent or guardian permission required by law. Information must be accurate and sign-in methods must be protected.",
        ],
        items: [
          "Connect only Discord and Roblox accounts you may use.",
          "Workspace owners must be authorized to manage each connected server, group, community, or experience.",
          "Never share passwords, Discord user tokens, Roblox security cookies, API keys, or OAuth client secrets.",
          "Report suspected unauthorized access promptly.",
        ],
      },
      {
        heading: "3. Free-plan Roblox community requirement",
        paragraphs: [
          "When membership enforcement is enabled, the owner of every Free workspace must connect their Roblox identity and remain a member of the Nexora Roblox community with ID 596263047. Nexora verifies this automatically. Workspaces on an active paid or trial plan above Free are exempt.",
        ],
        items: [
          "A confirmed departure starts a 48-hour grace period.",
          "Rejoining during the grace period restores eligibility.",
          "If the owner remains absent after the deadline, suspension may occur on the next successful automated verification.",
          "Roblox outages and inconclusive checks do not start the timer or cause a new suspension.",
          "Rejoining, or becoming eligible for an exempt active plan, automatically restores a workspace suspended only for this rule.",
        ],
      },
      {
        heading: "4. Workspace responsibility",
        paragraphs: [
          "Rank changes, role sync, applications, activity records, API requests, and automations can affect real communities. Owners control staff access and must review permissions, rank paths, connected resources, API keys, and automation rules. A workspace ID is permanent; a 25-character API key can be replaced, immediately disabling its predecessor. Nexora may retain audit evidence needed for security and dispute handling.",
        ],
      },
      {
        heading: "5. Beta availability",
        paragraphs: [
          "Features may change, pause, or be removed during beta. Nexora does not guarantee uninterrupted service or that Discord, Roblox, Vercel, Supabase, or another platform will accept every request. The Status page reports current health where available. Operations may be limited to protect users, platforms, or reliability.",
        ],
      },
      {
        heading: "6. Plans, donations, and billing",
        paragraphs: [
          "The private beta currently offers a Free plan without active checkout. Optional support through the linked Roblox catalog item or Ko-fi is a donation, is not a subscription, and does not buy plan access, preferential enforcement, ownership, or guaranteed development. Third-party platform terms apply. Before paid plans launch, Nexora will show price, tax handling, renewal, cancellation, refund terms, provider, and material limits before purchase. A downgrade to Free may make the Roblox requirement applicable after notice and a reasonable opportunity to comply.",
        ],
      },
      {
        heading: "7. Suspension and termination",
        paragraphs: [
          "Nexora may restrict or end access for material or repeated policy violations, abuse, security risks, unlawful use, third-party platform enforcement, future non-payment, or failure to meet a plan eligibility rule. Where appropriate, Nexora will explain the reason and offer a review path. Deletion requests remain subject to necessary security, legal, dispute, audit, and backup retention.",
        ],
      },
      {
        heading: "8. Intellectual property",
        paragraphs: [
          "Nexora Rank and its original code, interface, graphics, and brand are protected by applicable law. You retain submitted content and grant Nexora a limited worldwide license to host, process, transmit, and display it only to provide, secure, and support the service. Feedback may be used without payment or public attribution.",
        ],
      },
      {
        heading: "9. Disclaimers and liability",
        paragraphs: [
          "The beta is provided on an as-available basis. To the maximum extent permitted by law, Nexora disclaims implied warranties and is not responsible for events controlled by independent platforms. Nothing excludes mandatory consumer rights or liability that cannot legally be limited. Operator identity, governing law, disputes, and final liability terms require qualified legal review before public billing.",
        ],
      },
      {
        heading: "10. Changes and contact",
        paragraphs: [
          "Material changes will be dated and announced through the dashboard or official support community when appropriate. Urgent security, legal, or platform changes may take effect sooner. The legal operator and dedicated legal, privacy, and support contacts will be published before public billing; never post secrets or personal data publicly.",
        ],
      },
      {
        heading: "11. User content and instructions",
        paragraphs: [
          "You are responsible for messages, forms, application questions, templates, branding, automation instructions, and other material submitted through a workspace. You confirm that you have the rights and permissions needed to use that material and to direct Nexora to process or send it.",
        ],
        items: [
          "Do not use Nexora to send deceptive, infringing, abusive, or unlawful content.",
          "Review recipients, channels, permissions, and automation conditions before publishing.",
          "Nexora may remove or restrict content when reasonably necessary for safety, law, platform compliance, or service integrity.",
        ],
      },
      {
        heading: "12. Third-party services and permissions",
        paragraphs: [
          "Discord, Roblox, Supabase, Vercel, and other connected services operate independently. Their availability, permissions, rate limits, policy decisions, and account enforcement can affect Nexora features. You authorize Nexora to make the specific API requests necessary for the features you choose and may revoke a connection, subject to the consequences explained in the dashboard.",
        ],
      },
      {
        heading: "13. Indemnity and responsibility",
        paragraphs: [
          "To the extent permitted by applicable law, organizations and business users agree to be responsible for claims arising from their unlawful use of Nexora, content they submit, communities they control, or instructions that violate these Terms or another person's rights. This section does not apply where prohibited by consumer law and does not excuse Nexora from responsibility imposed by law.",
        ],
      },
      {
        heading: "14. Assignment, severability, and entire agreement",
        paragraphs: [
          "You may not transfer an account or these Terms without Nexora's consent, except where applicable law provides otherwise. Nexora may transfer the service and these Terms as part of a lawful reorganization, financing, acquisition, or asset transfer with required notice. If one provision cannot be enforced, the remaining provisions continue. These Terms and the incorporated policies form the agreement for the current beta service.",
        ],
      },
    ],
  },
  {
    slug: "terms-of-use",
    shortTitle: "Terms of Use",
    title: "Website & Platform Terms of Use",
    summary:
      "Rules for Nexora’s website, dashboard, connected platform, API access, and public material.",
    sections: [
      {
        heading: "1. Scope",
        paragraphs: [
          "Effective August 28, 2026. These rules apply to Nexora’s public website, dashboard, integrations, API access, status page, and public material. Account and workspace use is also governed by the Terms of Service.",
        ],
      },
      {
        heading: "2. Permitted use",
        items: [
          "Evaluate or operate Nexora for a community you own or may manage.",
          "Use Nexora only in authorized servers, groups, experiences, and workspaces.",
          "Link to public pages without implying sponsorship or partnership.",
        ],
      },
      {
        heading: "3. Prohibited use",
        items: [
          "Probe, scrape, overload, reverse engineer, or bypass security, rate limits, or suspension controls except where law expressly permits.",
          "Impersonate anyone or misrepresent affiliation or completed actions.",
          "Create a confusingly similar service using Nexora’s interface or brand.",
          "Submit malware, unlawful content, stolen credentials, unauthorized personal data, or another person’s secrets.",
          "Manipulate identities, plan status, Roblox membership checks, eligibility, or audit evidence.",
          "Spam, raid, harass, exploit, discriminate, defraud, or evade Discord or Roblox enforcement.",
        ],
      },
      {
        heading: "4. Independent platforms",
        paragraphs: [
          "Discord and Roblox are independent platforms with their own terms, developer policies, community standards, privacy practices, permissions, and limits. Nexora is not endorsed by or affiliated with Discord Inc. or Roblox Corporation unless explicitly stated.",
        ],
      },
      {
        heading: "5. Automated controls",
        paragraphs: [
          "Nexora uses automated controls for security, quotas, plan eligibility, and the Free-plan Roblox community rule. Provider failures are inconclusive rather than non-compliant. Owners may request review of an incorrect automated result through official support.",
        ],
      },
      {
        heading: "6. Availability",
        paragraphs: [
          "Beta features and limits may change. Status history begins when measurements are stored; an unknown day is not a representation of uptime or downtime. The Status page is operational information, not a service-level agreement. Continued use after an effective update means acceptance where permitted by law.",
        ],
      },
    ],
  },
  {
    slug: "privacy",
    shortTitle: "Privacy Policy",
    title: "Nexora Rank Privacy Policy",
    summary:
      "What Nexora processes, why it is needed, how automated eligibility works, and the choices available to users.",
    sections: [
      {
        heading: "1. Scope",
        paragraphs: [
          "Effective August 28, 2026. This policy covers the Nexora private beta: website, sign-in, onboarding, dashboard, Discord bot, Roblox integration, API, status page, support, and workspaces. Nexora is not intended for children under 13. The legal operator and dedicated privacy contact will be added before public billing.",
        ],
      },
      {
        heading: "2. Data processed",
        items: [
          "Account data: Supabase user ID, contact email, name, avatar, session, and authentication metadata.",
          "Beta applicant data: name, email address, age, review status, submission dates, Discord notification result, and a one-way hash of the private status-checking code. The readable code is shown to the applicant once.",
          "Discord data: account ID, username, display name, avatar, connected server ID, authorized roles, membership, and integration status.",
          "Roblox data: account ID, username, display name, avatar, communities visible to the connected account, the community selected during onboarding, public community membership and role, and authorized results.",
          "Workspace data: permanent workspace ID, members, roles, plan, configuration, applications, activity, rank actions, automations, API key hash and prefix, API use, and audit records. The full API key is shown once and is not stored in readable form.",
          "Eligibility data: membership in Roblox community 596263047, check times, grace dates, provider errors, and membership-policy suspension status.",
          "Technical data: timestamps, request status, browser/device and approximate network information, security events, logs, and daily service-health snapshots.",
          "Future billing data: customer, plan, invoice, renewal, and payment-status identifiers; Nexora does not intend to store full card details.",
        ],
      },
      {
        heading: "3. Sources",
        paragraphs: [
          "Data comes from you, authorized workspace users, Supabase Auth, Discord OAuth and APIs, Roblox OAuth and public or authorized APIs, connected game servers, Nexora security systems, and future billing providers. Roblox’s public membership endpoint may be checked without retaining a Roblox access token for that check.",
        ],
      },
      {
        heading: "4. Purposes and legal bases",
        paragraphs: [
          "Nexora processes data to create accounts and workspaces, provide integrations and automations, enforce limits and eligibility, secure and troubleshoot the service, prevent abuse, provide support, maintain auditability, and meet legal obligations. Depending on location and activity, the basis may be contract, legitimate interests, consent, or legal obligation.",
        ],
      },
      {
        heading: "5. Automated Free-plan eligibility",
        paragraphs: [
          "When enabled, Nexora compares the linked Roblox user ID of a Free workspace owner with public membership data for community 596263047. Confirmed absence starts a 48-hour grace period; a successful check after expiry can suspend the workspace. Provider errors do not start the timer or cause new suspension. Rejoining or becoming an eligible active paid or trial workspace restores a workspace suspended only for this rule. Owners may request human review.",
        ],
      },
      {
        heading: "6. Sharing",
        paragraphs: [
          "Data is shared only as needed with infrastructure, authentication, monitoring, support, and future billing providers; with Discord or Roblox for requested functions; when legally required; or to protect users and the service. Nexora does not sell personal data or use Discord or Roblox API data to train general-purpose AI models.",
        ],
      },
      {
        heading: "7. Retention",
        paragraphs: [
          "Account and workspace data is retained while needed for service. Eligibility results and grace dates remain while the workspace exists and may remain in audit records for security or disputes. OAuth data is refreshed or deleted when no longer needed under provider rules. Security records may be kept longer where necessary; deleted data can remain temporarily in encrypted backups.",
        ],
      },
      {
        heading: "8. Rights and choices",
        items: [
          "Disconnect or revoke Discord and Roblox access, understanding required features may stop.",
          "Request access, correction, deletion, restriction, objection, or portability where applicable.",
          "Withdraw consent where it is the basis, without affecting earlier lawful processing.",
          "Request human review of an automated eligibility or suspension result.",
          "Request workspace deletion subject to necessary security, legal, audit, and backup retention.",
          "Complain to the relevant data-protection authority.",
        ],
      },
      {
        heading: "9. Security and transfers",
        paragraphs: [
          "Nexora uses scoped OAuth, encrypted transport, row-level database controls, isolated secrets, and audit records. No internet service is perfectly secure. Vercel and Supabase may process data in locations covered by their terms; appropriate transfer safeguards will be used where required.",
        ],
      },
      {
        heading: "10. Contact and changes",
        paragraphs: [
          "Use official Nexora support for beta privacy requests and avoid posting personal data publicly. A dedicated privacy contact and operator identity will be published before public billing. Material changes will be dated and communicated where required.",
        ],
      },
      {
        heading: "11. Discord support conversations",
        paragraphs: [
          "When you DM the separate Nexora Support bot, the message content, attachments, Discord account ID, display name, avatar, timestamps, and staff replies are relayed to a protected ticket channel in the private Nexora Staff server. Authorized support agents can view and answer the conversation. When a ticket closes, Nexora creates an HTML transcript in a restricted transcript archive before removing the live channel. Transcripts and limited security records are retained only as reasonably needed for support continuity, safety, disputes, and legal obligations.",
        ],
      },
      {
        heading: "12. Staff access records",
        paragraphs: [
          "Staff console access uses a one-time 25-character code generated by the Nexora bot and Discord authorization. Nexora stores only a cryptographic hash of the code, its creator, role, expiry, redemption time, and the authorized staff member's Discord ID, display name, avatar, access role, and session expiry. Codes expire quickly and cannot be reused.",
        ],
      },
      {
        heading: "13. International users",
        paragraphs: [
          "Nexora may be accessed from countries with different privacy laws. Where required, Nexora will use recognized contractual or legal transfer mechanisms and provide additional local disclosures. Users remain responsible for ensuring that their workspace use and collection of community data are lawful in their location.",
        ],
      },
      {
        heading: "14. Requests, verification, and appeals",
        paragraphs: [
          "Nexora may need to verify identity, account control, or workspace ownership before completing a privacy request. Requests may be limited or refused where the law permits, including to protect another person, preserve security, comply with legal obligations, or retain evidence of abuse. Where available, a user may appeal a refusal through official support.",
        ],
      },
    ],
  },
  {
    slug: "cookies",
    shortTitle: "Cookie Policy",
    title: "Cookie & Local Storage Policy",
    summary:
      "Authentication, security, preference, and optional analytics storage used by Nexora.",
    sections: [
      {
        heading: "1. Current use",
        paragraphs: [
          "Effective August 28, 2026. Nexora uses necessary browser storage for Supabase sessions, OAuth completion, request security, routing, and interface state. Nexora does not currently use advertising cookies.",
        ],
      },
      {
        heading: "2. Necessary storage",
        items: [
          "Authentication cookies that keep a valid session.",
          "Short-lived OAuth state and verifier values for Discord and Roblox.",
          "Security, anti-abuse, routing, and request-integrity values used by Nexora, Vercel, or Supabase.",
          "Local preferences for interface or consent choices.",
        ],
      },
      {
        heading: "3. Optional storage",
        paragraphs: [
          "Optional analytics and other non-essential storage remain off unless configured with an appropriate legal basis and consent where required. Nexora will not silently add advertising or cross-site tracking.",
        ],
      },
      {
        heading: "4. Controls",
        paragraphs: [
          "You may clear or block browser storage, but blocking necessary values may prevent sign-in, OAuth, onboarding, or dashboard use. A consent control will be added before non-essential cookies requiring consent are enabled.",
        ],
      },
    ],
  },
  {
    slug: "acceptable-use",
    shortTitle: "Acceptable Use",
    title: "Acceptable Use Policy",
    summary:
      "Safety, platform-integrity, credential, automation, and eligibility rules for every Nexora surface.",
    sections: [
      {
        heading: "Use Nexora responsibly",
        items: [
          "Do not harass, exploit, discriminate against, threaten, or endanger users.",
          "Do not automate spam, raids, deceptive engagement, or abusive rank actions.",
          "Do not evade Discord or Roblox enforcement, permissions, rate limits, or platform rules.",
          "Do not request, store, or share Discord user tokens, Roblox security cookies, passwords, keys, or another person’s OAuth secrets.",
          "Do not falsify activity, applications, votes, identities, plan status, Roblox membership, eligibility checks, or audit evidence.",
          "Do not access another workspace, account, server, group, or experience without authorization.",
          "Do not sell, broker, profile, or use platform data for general-purpose AI training.",
          "Do not use Nexora for malware, fraud, unlawful commerce, infringement, or suspension circumvention.",
        ],
      },
      {
        heading: "Enforcement",
        paragraphs: [
          "Nexora may rate-limit, block, reverse, suspend, preserve evidence of, or report abuse. Serious or repeated violations may end access. The Free-plan membership process has its own 48-hour rejoin period and does not limit urgent security, abuse, or legal action.",
        ],
      },
      {
        heading: "Reporting and review",
        paragraphs: [
          "Use official Nexora support to report abuse, security issues, or an incorrect eligibility result. Never post secrets or personal data publicly. Nexora may request information reasonably needed to verify ownership and investigate.",
        ],
      },
    ],
  },
  {
    slug: "refunds",
    shortTitle: "Refund Policy",
    title: "Cancellation & Refund Policy",
    summary:
      "What applies in the free private beta and what must be published before checkout launches.",
    sections: [
      {
        heading: "No paid checkout today",
        paragraphs: [
          "Effective August 28, 2026. Nexora is free in private beta. There is no active checkout, so Nexora cannot charge, cancel, or refund a payment through this site today.",
        ],
      },
      {
        heading: "Before billing launches",
        paragraphs: [
          "Future checkout will identify the seller or merchant of record, total price, taxes, billing period, renewal, cancellation, refund eligibility, and provider terms before payment. Mandatory consumer rights apply regardless of this policy.",
        ],
      },
      {
        heading: "Planned controls",
        items: [
          "Cancel future renewal through a billing portal.",
          "Keep access through the paid period unless security, abuse, law, or payment failure requires restriction.",
          "Request review of duplicate, incorrect, or unauthorized charges.",
          "Receive receipts and visible plan status.",
          "Receive practical notice before a downgrade makes Free-plan eligibility applicable.",
        ],
      },
      {
        heading: "Payment provider",
        paragraphs: [
          "Lemon Squeezy is under consideration as merchant of record but is not connected. This page will be updated if a provider is selected.",
        ],
      },
    ],
  },
  {
    slug: "subprocessors",
    shortTitle: "Subprocessors",
    title: "Infrastructure & Subprocessors",
    summary:
      "Services used for hosting, authentication, database operations, and independent platform integrations.",
    sections: [
      {
        heading: "Current infrastructure",
        items: [
          "Vercel — hosting, server functions, deployment, delivery, and scheduled membership-check triggers.",
          "Supabase — authentication, PostgreSQL database, row-level access control, OAuth provider connection, and backend services.",
        ],
      },
      {
        heading: "Independent platforms",
        paragraphs: [
          "Discord and Roblox are integrations and independent platforms, not ordinary Nexora subprocessors. Their terms and privacy policies govern their processing. Nexora contacts them only for sign-in, authorized functions, service health, and the Free-plan membership check.",
        ],
      },
      {
        heading: "Future provider",
        items: [
          "Lemon Squeezy — under consideration for merchant-of-record checkout, taxes, billing, and refunds; not connected.",
        ],
      },
      {
        heading: "Transfers and changes",
        paragraphs: [
          "Provider access is limited to its service. Provider terms govern locations, retention, and security; Nexora will use required transfer safeguards. Material additions will be listed before or promptly after they begin, with notice where required.",
        ],
      },
    ],
  },
  {
    slug: "beta-privacy",
    shortTitle: "Beta Privacy",
    title: "Nexora Beta Privacy Notice",
    summary:
      "A focused explanation of the applicant details collected, the private Discord notification, review, retention, and applicant choices.",
    sections: [
      {
        heading: "1. Information collected",
        paragraphs: [
          "Effective August 29, 2026. A Beta application asks for your full name, email address, and age. Nexora also records submission dates, review status, whether the private Discord notification was delivered, and a one-way hash of the private status code shown after submission.",
        ],
      },
      {
        heading: "2. Private Discord notification",
        paragraphs: [
          "When you submit, the Nexora bot sends your name, email address, and age in a black embed to a private Staff Discord channel used for Beta review. This allows the Nexora team to review applications and contact selected applicants. The notification is not posted publicly and is not sent to community workspaces.",
        ],
      },
      {
        heading: "3. Why the data is used",
        items: [
          "Review whether the applicant is a suitable Beta participant.",
          "Contact selected or waitlisted applicants.",
          "Prevent duplicate applications and allow private status checks.",
          "Protect the application process from abuse and diagnose delivery failures.",
        ],
      },
      {
        heading: "4. Age and minors",
        paragraphs: [
          "Applicants must be at least 13 and must meet any higher minimum age or parental-consent rule that applies where they live. Nexora does not knowingly accept applications from children under 13. Age is used for eligibility review and is not displayed publicly.",
        ],
      },
      {
        heading: "5. Retention and deletion",
        paragraphs: [
          "Applications are retained while the Beta selection process remains active and for a reasonable period afterward for contact, fairness, security, and recordkeeping. Applicants may ask official Nexora Support to correct or delete an application, subject to lawful security, dispute, and backup retention.",
        ],
      },
      {
        heading: "6. Your choices",
        items: [
          "Do not apply if you do not want the three application fields sent to the private Staff channel.",
          "Use the private confirmation code to check status without a public account page.",
          "Ask Nexora Support for access, correction, deletion, restriction, or another applicable privacy right.",
        ],
      },
    ],
  },
  {
    slug: "beta-participation",
    shortTitle: "Beta Participation",
    title: "Nexora Beta Participation Policy",
    summary:
      "Eligibility, selection, feedback, confidentiality, conduct, availability, and removal rules for Beta participants.",
    sections: [
      {
        heading: "1. Application and selection",
        paragraphs: [
          "Applying does not guarantee selection, access, a response by a particular date, or continued participation. Nexora may select participants in stages based on capacity, community fit, testing needs, safety, and the usefulness of expected feedback.",
        ],
      },
      {
        heading: "2. Participant expectations",
        items: [
          "Use accurate application information and protect any private access details.",
          "Test Nexora only in communities you are authorized to manage.",
          "Report problems clearly and avoid knowingly exploiting a defect.",
          "Follow the Terms of Service, Acceptable Use Policy, Discord rules, and Roblox rules.",
        ],
      },
      {
        heading: "3. Feedback and previews",
        paragraphs: [
          "Feedback is voluntary unless a separate written arrangement says otherwise. You permit Nexora to use feedback to improve the product without payment or public attribution. Do not publish another person's private information, security details that create immediate risk, or confidential material Nexora clearly marks as non-public.",
        ],
      },
      {
        heading: "4. Beta changes and availability",
        paragraphs: [
          "Beta features may be incomplete, changed, limited, reset, paused, or removed. Data exports and uninterrupted availability are not guaranteed. Nexora will take reasonable care but participants should not rely on the Beta as the sole record for critical community operations.",
        ],
      },
      {
        heading: "5. Removal from the Beta",
        paragraphs: [
          "Nexora may waitlist, decline, pause, or remove a participant for capacity, inactivity, safety, abuse, platform enforcement, policy violations, or product changes. Where practical, Nexora will explain a conduct-based removal and provide a support path.",
        ],
      },
      {
        heading: "6. No payment or employment",
        paragraphs: [
          "Current Beta participation is free. It does not create employment, partnership, agency, investment rights, ownership, compensation, or a promise of future paid access. Any future paid plan will have separate disclosed terms before purchase.",
        ],
      },
    ],
  },
];

export function getLegalDocument(slug: string) {
  return legalDocuments.find((document) => document.slug === slug);
}
