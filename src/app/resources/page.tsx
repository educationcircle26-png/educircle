import { currentUser } from "@/lib/currentUser";
import { PageShell } from "@/components/PageShell";
import { ComingSoon } from "@/components/ComingSoon";

export const metadata = { title: "Resources · EduCircle" };

export default async function ResourcesPage() {
  const { user, isAdmin } = await currentUser();

  return (
    <PageShell signedIn={!!user} isAdmin={isAdmin} width="form">
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
    </PageShell>
  );
}
