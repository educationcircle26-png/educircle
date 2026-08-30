// Seeds demo parents, children, memberships, chat groups and content.
//
// Every row it creates is tagged so it can be found and removed again:
//   - demo accounts use @demo.educircle.test email addresses
//   - demo chat groups and posts are prefixed with [TEST]
//
// Run:  node scripts/seed-demo.mjs
//       node scripts/seed-demo.mjs --clean     (removes everything it made)
//
// Needs the service_role key, which is NOT stored in the repo. Pass it
// for one command only:
//   SUPABASE_SERVICE_ROLE_KEY=... node scripts/seed-demo.mjs

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

const DEMO_EMAIL_DOMAIN = "demo.educircle.test";
const DEMO_PASSWORD = "demo-educircle-2026";
const TAG = "[TEST]";

// Reads both values from .env.local, the same file the app uses, so the key
// only has to be stored once. An environment variable still wins, for CI or
// a one-off run against another project.
function loadEnv() {
  const fromFile = {};
  try {
    for (const line of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const k = trimmed.slice(0, eq).trim();
      // Strip surrounding quotes if the value was written with them.
      const v = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
      if (v) fromFile[k] = v;
    }
  } catch {}

  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL || fromFile.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    fromFile.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) throw new Error("NEXT_PUBLIC_SUPABASE_URL not found in .env.local");
  if (!key) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY not found.\n" +
        "Add it to .env.local as:  SUPABASE_SERVICE_ROLE_KEY=<key>\n" +
        "Find the key in Supabase > Project Settings > API > service_role.\n" +
        "Run this from the project root (D:\\edu-app), where .env.local lives.",
    );
  }
  return { url, key };
}

const { url, key } = loadEnv();
const db = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Demo parents are all ordinary parents. Site admin belongs on a real
// account, not one that `--clean` deletes — promote yours with:
//   node scripts/seed-demo.mjs --make-admin you@example.com
//
// first_name, display_name, is_admin, school index, year, class
const PARENTS = [
  ["Heba", "Heba M.", false, 0, "Year 3", "3A"],
  ["Ahmed", "Ahmed K.", false, 0, "Year 3", "3A"],
  ["Mona", "Mona S.", false, 0, "Year 3", "3B"],
  ["Tarek", "Tarek A.", false, 0, "Year 5", "5A"],
  ["Nour", "Nour H.", false, 1, "Year 2", "2A"],
  ["Yasmin", "Yasmin R.", false, 1, "Year 2", "2A"],
  ["Khaled", "Khaled F.", false, 1, "Year 6", "6B"],
  ["Dina", "Dina Z.", false, 2, "Year 4", "4A"],
  ["Omar", "Omar N.", false, 2, "Year 4", "4A"],
  ["Salma", "Salma E.", false, 0, "Year 3", "3A"],
];

const CHILDREN = [
  "Youssef", "Malak", "Adam", "Jana", "Ali",
  "Farida", "Hamza", "Layla", "Zeyad", "Retaj",
];

const GROUP_MESSAGES = [
  "Good morning everyone — does anyone know if tomorrow's trip is still on?",
  "Yes, the office confirmed this morning. Bus leaves at 7:30.",
  "Thanks! Do they need packed lunch or is it provided?",
  "Packed lunch. My daughter's teacher sent a note yesterday.",
  "Perfect, thank you both.",
];

// title, body, topic — the topic is what the home page ranks trending
// topics from, so demo questions carry one just like real ones will.
const SCHOOL_POSTS = [
  ["How is the homework load in Year 3?", "Trying to plan ahead for next year — how much did it actually change?", "curriculum"],
  ["Anyone using the school bus from Rehab?", "Considering switching from private transport. How reliable is the timing?", "transport"],
];

const NETWORK_POSTS = [
  ["Which curriculum suits a child moving from a national school?", "We are relocating and my son has only studied the national curriculum so far.", "curriculum"],
  ["How early should we apply for KG1?", "Everyone tells me a different answer and I'm getting confused.", "admissions"],
  ["What should we budget for a British school in New Cairo?", "Trying to work out the real yearly total including buses and books.", "fees"],
  ["Is it worth moving schools mid-year?", "We are relocating across Cairo and unsure whether to wait for September.", "moving"],
  ["How do you choose between two schools that both look fine?", "Both have good facilities. What actually made the difference for you?", "choosing"],
];

async function findDemoUsers() {
  const found = [];
  let page = 1;
  for (;;) {
    const { data, error } = await db.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    found.push(...data.users.filter((u) => u.email?.endsWith(`@${DEMO_EMAIL_DOMAIN}`)));
    if (data.users.length < 1000) break;
    page++;
  }
  return found;
}

async function makeAdmin(email) {
  const users = [];
  let page = 1;
  for (;;) {
    const { data, error } = await db.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    users.push(...data.users);
    if (data.users.length < 1000) break;
    page++;
  }

  const user = users.find(
    (u) => u.email?.toLowerCase() === email.toLowerCase(),
  );
  if (!user) {
    throw new Error(
      `No account found for ${email}.\n` +
        `Sign in to the site once with that address first, then re-run this.`,
    );
  }

  const { error } = await db
    .from("profiles")
    .update({ is_admin: true })
    .eq("id", user.id);
  if (error) throw error;

  console.log(`${email} is now a site admin.`);
  console.log("The Admin button appears in the header next time they load a page.");
}

async function clean() {
  console.log("Removing demo data...");

  const { data: groups } = await db
    .from("chat_groups")
    .select("id")
    .like("name", `${TAG}%`);
  if (groups?.length) {
    await db.from("chat_groups").delete().in("id", groups.map((g) => g.id));
    console.log(`  removed ${groups.length} chat groups (messages cascade)`);
  }

  const users = await findDemoUsers();
  for (const u of users) await db.auth.admin.deleteUser(u.id);
  console.log(`  removed ${users.length} demo accounts (profiles/posts cascade)`);
  console.log("Done.");
}

async function seed() {
  const { data: schools, error: schoolErr } = await db
    .from("schools")
    .select("id, name")
    .order("name")
    .limit(3);
  if (schoolErr) throw schoolErr;
  if (!schools || schools.length < 3) {
    throw new Error("Need at least 3 schools seeded first (migration 0004).");
  }
  console.log(`Using schools: ${schools.map((s) => s.name).join(", ")}\n`);

  const created = [];

  for (let i = 0; i < PARENTS.length; i++) {
    const [firstName, displayName, isAdmin, schoolIdx, year, className] = PARENTS[i];
    const email = `${firstName.toLowerCase()}@${DEMO_EMAIL_DOMAIN}`;

    const { data: authData, error: authErr } = await db.auth.admin.createUser({
      email,
      password: DEMO_PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: displayName },
    });
    if (authErr) {
      console.log(`  ! ${email}: ${authErr.message}`);
      continue;
    }
    const userId = authData.user.id;
    const school = schools[schoolIdx];

    await db
      .from("profiles")
      .update({
        display_name: displayName,
        full_name: displayName,
        is_admin: isAdmin,
        bio: `${TAG} demo account for testing.`,
        location: "Cairo, Egypt",
      })
      .eq("id", userId);

    await db.from("children").insert({
      parent_id: userId,
      first_name: CHILDREN[i],
      school_id: school.id,
      academic_year: year,
      class_name: className,
    });

    await db.from("school_memberships").insert({
      user_id: userId,
      school_id: school.id,
      role: i === 0 ? "moderator" : "verified_parent",
      status: "approved",
      verification_method: "moderator_review",
      verified_at: new Date().toISOString(),
    });

    created.push({ userId, email, displayName, school, year, className, isAdmin });
    console.log(`  + ${displayName} (${email}) — ${school.name}, ${year} ${className}${isAdmin ? " [ADMIN]" : ""}`);
  }

  if (created.length === 0) throw new Error("No demo users created.");

  // One class group per distinct school+class, plus a school-wide group.
  console.log("\nCreating chat groups...");
  const groupsByKey = new Map();
  for (const p of created) {
    for (const [key, name, className] of [
      [`${p.school.id}|all`, `${TAG} ${p.school.name} — All Parents`, null],
      [`${p.school.id}|${p.className}`, `${TAG} ${p.school.name} — ${p.className}`, p.className],
    ]) {
      if (!groupsByKey.has(key)) {
        const { data: group, error } = await db
          .from("chat_groups")
          .insert({
            school_id: p.school.id,
            name,
            description: `${TAG} Demo group for testing.`,
            academic_year: className ? p.year : null,
            class_name: className,
            created_by: p.userId,
          })
          .select("id, name")
          .single();
        if (error) {
          console.log(`  ! ${name}: ${error.message}`);
          continue;
        }
        groupsByKey.set(key, group);
        console.log(`  + ${group.name}`);
      }
      const group = groupsByKey.get(key);
      if (group) {
        await db.from("chat_group_members").insert({
          group_id: group.id,
          user_id: p.userId,
          role: p.isAdmin ? "admin" : "member",
        });
      }
    }
  }

  console.log("\nPosting demo messages...");
  let msgCount = 0;
  for (const group of groupsByKey.values()) {
    const { data: members } = await db
      .from("chat_group_members")
      .select("user_id")
      .eq("group_id", group.id);
    if (!members?.length) continue;
    for (let i = 0; i < GROUP_MESSAGES.length; i++) {
      const author = members[i % members.length];
      await db.from("chat_messages").insert({
        group_id: group.id,
        author_id: author.user_id,
        body: GROUP_MESSAGES[i],
        created_at: new Date(Date.now() - (GROUP_MESSAGES.length - i) * 3600_000).toISOString(),
      });
      msgCount++;
    }
  }
  console.log(`  + ${msgCount} messages`);

  console.log("\nPosting demo questions...");
  for (let i = 0; i < NETWORK_POSTS.length; i++) {
    const [title, body, topic] = NETWORK_POSTS[i];
    await db.from("posts").insert({
      author_id: created[i % created.length].userId,
      school_id: null,
      type: "question",
      title: `${TAG} ${title}`,
      body,
      tags: topic ? [topic] : [],
      status: "published",
    });
  }
  for (let i = 0; i < SCHOOL_POSTS.length; i++) {
    const [title, body, topic] = SCHOOL_POSTS[i];
    const p = created[i % created.length];
    await db.from("posts").insert({
      author_id: p.userId,
      school_id: p.school.id,
      type: "question",
      title: `${TAG} ${title}`,
      body,
      tags: topic ? [topic] : [],
      status: "published",
    });
  }
  // One held post so the admin moderation queue has something in it.
  await db.from("posts").insert({
    author_id: created[0].userId,
    school_id: null,
    type: "question",
    title: `${TAG} A post awaiting moderation`,
    body: "This demo post is held at pending_review so the admin queue is not empty.",
    status: "pending_review",
  });
  console.log(`  + ${NETWORK_POSTS.length + SCHOOL_POSTS.length} published, 1 pending review`);

  console.log("\n─────────────────────────────────────────");
  console.log("Demo accounts are ready. Password for all:");
  console.log(`  ${DEMO_PASSWORD}`);
  console.log("\nThese are all ordinary parents. To reach the admin dashboard,");
  console.log("promote your own real account:");
  console.log("  node scripts/seed-demo.mjs --make-admin you@example.com");
  console.log("\nRemove the demo data again with:");
  console.log("  node scripts/seed-demo.mjs --clean");
  console.log("─────────────────────────────────────────");
}

const adminFlag = process.argv.indexOf("--make-admin");
if (adminFlag !== -1) {
  const email = process.argv[adminFlag + 1];
  if (!email) throw new Error("Usage: --make-admin you@example.com");
  await makeAdmin(email);
} else if (process.argv.includes("--clean")) {
  await clean();
} else {
  await seed();
}
