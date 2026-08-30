import { createClient } from "@/lib/supabase/server";
import { SiteNav } from "@/components/SiteNav";
import { ComingSoon } from "@/components/ComingSoon";

export const metadata = { title: "Resources · EduCircle" };

export default async function ResourcesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let isAdmin = false;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .single();
    isAdmin = !!profile?.is_admin;
  }

  return (
    <>
      <SiteNav isSignedIn={!!user} isAdmin={isAdmin} />
      <main className="bg-[#fbfaff]">
        <ComingSoon
          title="Resources"
          summary="The practical things parents keep re-explaining to each other — collected once, kept current, and written by parents rather than schools."
          planned={[
            "Guides on admissions, curricula and year-group transitions in Egypt",
            "Fee comparisons sourced from what parents actually report paying",
            "Term calendars and school-run checklists",
            "A glossary for parents new to the British, American and IB systems",
          ]}
        />
      </main>
    </>
  );
}
