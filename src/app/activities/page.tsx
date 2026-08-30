import { currentUser } from "@/lib/currentUser";
import { PageShell } from "@/components/PageShell";
import { ComingSoon } from "@/components/ComingSoon";

export const metadata = { title: "Activities · EduCircle" };

export default async function ActivitiesPage() {
  const { user, isAdmin } = await currentUser();

  return (
    <PageShell signedIn={!!user} isAdmin={isAdmin} width="form">
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
    </PageShell>
  );
}
