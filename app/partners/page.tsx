import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ExternalLink, UsersRound } from "lucide-react";
import { SiteNav } from "@/components/site-nav";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Partners",
  description: "Meet the Roblox communities building with Nexora Rank.",
};

export default async function PartnersPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("partners")
    .select(
      "id,roblox_group_id,roblox_group_name,roblox_group_logo_url,roblox_group_banner_url,roblox_member_count,roblox_owner_username,roblox_owner_display_name,discord_invite_url",
    )
    .eq("published", true)
    .order("created_at", { ascending: false });
  const partners = data ?? [];

  return (
    <main className="partners-page island-clearance">
      <SiteNav active="/partners" />
      <section className="partners-hero">
        <p className="section-kicker">Nexora network</p>
        <h1>
          Built with communities.
          <br />
          <span>Growing together.</span>
        </h1>
        <p>
          Discover the Roblox groups using Nexora to bring their staff, Discord
          operations, applications, activity, and community workflows into one
          dependable home.
        </p>
        <div>
          <span>{partners.length}</span>
          <small>
            verified {partners.length === 1 ? "partner" : "partners"}
          </small>
        </div>
      </section>

      <section className="partners-directory" aria-label="Nexora partners">
        {partners.length ? (
          partners.map((partner) => {
            const owner =
              partner.roblox_owner_display_name ||
              partner.roblox_owner_username ||
              "Roblox member";
            return (
              <article key={partner.id} className="partner-card">
                <div
                  className="partner-card-art"
                  style={partner.roblox_group_banner_url ? { backgroundImage: `linear-gradient(rgba(5,3,3,.28),rgba(5,3,3,.72)),url(${partner.roblox_group_banner_url})` } : undefined}
                >
                  {partner.roblox_group_logo_url ? (
                    <img
                      src={partner.roblox_group_logo_url}
                      alt={`${partner.roblox_group_name} logo`}
                    />
                  ) : (
                    <span>RB</span>
                  )}
                  <em>Verified partner</em>
                </div>
                <div className="partner-card-copy">
                  <p>Roblox community</p>
                  <h2>{partner.roblox_group_name}</h2>
                  <div className="partner-member-count">
                    <UsersRound />{" "}
                    {partner.roblox_member_count.toLocaleString()} members
                  </div>
                  <small>
                    Owned by <b>{owner}</b>
                    {partner.roblox_owner_username &&
                    partner.roblox_owner_display_name !==
                      partner.roblox_owner_username
                      ? ` · @${partner.roblox_owner_username}`
                      : ""}
                  </small>
                  <nav aria-label={`${partner.roblox_group_name} links`}>
                    <Link
                      href={partner.discord_invite_url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Join Discord <ExternalLink />
                    </Link>
                    <Link
                      href={`https://www.roblox.com/communities/${partner.roblox_group_id}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      View Roblox group <ArrowRight />
                    </Link>
                  </nav>
                </div>
              </article>
            );
          })
        ) : (
          <div className="partners-empty">
            <span>Partner directory</span>
            <h2>The first communities are joining.</h2>
            <p>
              Approved Nexora partners will appear here with verified Roblox
              group details and official links.
            </p>
            <Link href="/beta">
              Apply for Beta <ArrowRight />
            </Link>
          </div>
        )}
      </section>

      <section className="partners-cta">
        <div>
          <p className="section-kicker">Build with Nexora</p>
          <h2>Want your community here?</h2>
          <span>
            Join the Beta, set up your workspace, and talk with the Nexora team
            about partnership.
          </span>
        </div>
        <Link href="/beta">
          Apply for Beta <ArrowRight />
        </Link>
      </section>
    </main>
  );
}
