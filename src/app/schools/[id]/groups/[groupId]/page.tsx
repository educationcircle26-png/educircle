import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppHeader } from "@/components/AppHeader";
import { leaveGroup, sendMessage } from "../actions";

export default async function GroupChatPage({
  params,
}: {
  params: Promise<{ id: string; groupId: string }>;
}) {
  const { id, groupId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: group } = await supabase
    .from("chat_groups")
    .select("id, name, description, academic_year, class_name, school_id")
    .eq("id", groupId)
    .maybeSingle();

  if (!group || group.school_id !== id) notFound();

  const { data: myMembership } = await supabase
    .from("chat_group_members")
    .select("user_id")
    .eq("group_id", groupId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!myMembership) {
    redirect(`/schools/${id}/groups`);
  }

  const [{ data: messages }, { count: memberCount }] = await Promise.all([
    supabase
      .from("chat_messages_with_author")
      .select("id, body, created_at, author_id, author_display_name, status")
      .eq("group_id", groupId)
      .order("created_at", { ascending: true })
      .limit(200),
    supabase
      .from("chat_group_members")
      .select("*", { count: "exact", head: true })
      .eq("group_id", groupId),
  ]);

  const sendToGroup = sendMessage.bind(null, id, groupId);

  return (
    <>
      <AppHeader />
      <main className="mx-auto flex max-w-2xl flex-col px-6 py-8">
        <Link
          href={`/schools/${id}/groups`}
          className="text-sm font-semibold text-violet-600"
        >
          ← All groups
        </Link>

        <div className="mt-3 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="truncate text-xl font-bold text-slate-900">
              {group.name}
            </h1>
            <p className="mt-0.5 text-xs text-slate-500">
              {memberCount ?? 0}{" "}
              {memberCount === 1 ? "member" : "members"}
              {group.class_name ? ` · ${group.class_name}` : ""}
            </p>
          </div>
          <form action={leaveGroup.bind(null, id, groupId)}>
            <button
              type="submit"
              className="shrink-0 rounded-lg border border-neutral-300 px-3 py-1.5 text-xs font-medium text-slate-600 hover:border-rose-300 hover:text-rose-600"
            >
              Leave
            </button>
          </form>
        </div>

        <div className="mt-6 flex flex-col gap-3">
          {messages && messages.length > 0 ? (
            messages.map((message) => {
              const mine = message.author_id === user.id;
              return (
                <div
                  key={message.id}
                  className={`flex ${mine ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                      mine
                        ? "bg-violet-600 text-white"
                        : "bg-neutral-100 text-slate-800"
                    }`}
                  >
                    {!mine && (
                      <p className="mb-0.5 text-xs font-bold text-violet-700">
                        {message.author_display_name || "A parent"}
                      </p>
                    )}
                    <p className="text-sm whitespace-pre-wrap">
                      {message.body}
                    </p>
                    <p
                      className={`mt-1 text-[10px] ${
                        mine ? "text-violet-200" : "text-slate-400"
                      }`}
                    >
                      {new Date(message.created_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                      {message.status !== "published" &&
                        " · under review, only visible to you"}
                    </p>
                  </div>
                </div>
              );
            })
          ) : (
            <p className="rounded-2xl border border-dashed border-neutral-300 p-8 text-center text-sm text-slate-600">
              No messages yet. Say hello.
            </p>
          )}
        </div>

        <form action={sendToGroup} className="mt-6 flex gap-2">
          <input
            name="body"
            required
            autoComplete="off"
            placeholder="Write a message..."
            className="flex-1 rounded-xl border border-neutral-300 px-4 py-3 text-sm outline-none focus:border-violet-600"
          />
          <button
            type="submit"
            className="shrink-0 rounded-xl bg-violet-600 px-5 py-3 text-sm font-medium text-white hover:bg-violet-700"
          >
            Send
          </button>
        </form>
      </main>
    </>
  );
}
