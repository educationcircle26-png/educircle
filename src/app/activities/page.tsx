import { createClient } from "@/lib/supabase/server";
import { SiteNav } from "@/components/SiteNav";
import { ComingSoon } from "@/components/ComingSoon";

export const metadata = { title: "Activities · EduCircle" };

export default async function ActivitiesPage() {
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
          title="Activities"
          summary="Sports clubs, tutoring, summer camps and after-school classes — recommended by the parents whose children actually go."
          planned={[
            "Activity listings with the area and age range they serve",
            "Parent reviews, with the same anonymity rules as questions",
            "Filters by area, age and activity type",
            "Nothing paid or sponsored — same promise as the school directory",
          ]}
        />
      </main>
    </>
  );
}
