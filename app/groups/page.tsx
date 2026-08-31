import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ExternalLink, ShieldCheck, UsersRound } from "lucide-react";
import { SiteNav } from "@/components/site-nav";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Groups using Nexora",
  description: "Verified Roblox communities operating with Nexora Rank.",
};

export default async function GroupsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("nexora_groups")
    .select("id,roblox_group_id,roblox_group_name,roblox_group_logo_url,roblox_group_banner_url,roblox_member_count,roblox_owner_username,roblox_owner_display_name,discord_invite_url")
    .eq("published", true)
    .order("created_at", { ascending: false });
  const groups = data ?? [];
  return (
    <main className="partners-page island-clearance">
      <SiteNav active="/groups" />
      <section className="partners-hero">
        <p className="section-kicker">Live community directory</p>
        <h1>Groups using Nexora.<br /><span>Real communities, real operations.</span></h1>
        <p>Explore Roblox communities that use Nexora for Discord operations, applications, activity, staff workflows, and accountable rank requests.</p>
        <div><span>{groups.length}</span><small>verified {groups.length === 1 ? "group" : "groups"}</small></div>
      </section>
      <section className="partners-directory" aria-label="Groups using Nexora">
        {groups.length ? groups.map((group) => {
          const owner = group.roblox_owner_display_name || group.roblox_owner_username || "Roblox member";
          return <article key={group.id} className="partner-card">
            <div className="partner-card-art" style={group.roblox_group_banner_url ? { backgroundImage: `linear-gradient(rgba(5,3,3,.28),rgba(5,3,3,.72)),url(${group.roblox_group_banner_url})` } : undefined}>
              {group.roblox_group_logo_url ? <img src={group.roblox_group_logo_url} alt={`${group.roblox_group_name} logo`} /> : <span>RB</span>}
              <em><ShieldCheck /> Uses Nexora</em>
            </div>
            <div className="partner-card-copy">
              <p>Verified workspace community</p><h2>{group.roblox_group_name}</h2>
              <div className="partner-member-count"><UsersRound /> {group.roblox_member_count.toLocaleString()} members</div>
              <small>Owned by <b>{owner}</b>{group.roblox_owner_username && group.roblox_owner_display_name !== group.roblox_owner_username ? ` · @${group.roblox_owner_username}` : ""}</small>
              <nav aria-label={`${group.roblox_group_name} links`}>
                {group.discord_invite_url ? <Link href={group.discord_invite_url} target="_blank" rel="noreferrer">Join Discord <ExternalLink /></Link> : null}
                <Link href={`https://www.roblox.com/communities/${group.roblox_group_id}`} target="_blank" rel="noreferrer">View Roblox group <ArrowRight /></Link>
              </nav>
            </div>
          </article>;
        }) : <div className="partners-empty"><span>Community directory</span><h2>The first selected groups will appear here.</h2><p>Nexora Staff verifies every listing before it becomes public.</p><Link href="/beta">Apply for Beta <ArrowRight /></Link></div>}
      </section>
    </main>
  );
}
