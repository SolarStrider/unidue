import { supabase } from "@/integrations/supabase/client";

export type BookmarkType = "note" | "deck" | "quiz" | "assignment";

export async function toggleBookmark(itemType: BookmarkType, itemId: string, label: string, subject = "") {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  const { data: existing } = await supabase
    .from("bookmarks").select("id").eq("user_id", user.id)
    .eq("item_type", itemType).eq("item_id", itemId).maybeSingle();
  if (existing) {
    await supabase.from("bookmarks").delete().eq("id", existing.id);
    return false;
  }
  await supabase.from("bookmarks").insert({ user_id: user.id, item_type: itemType, item_id: itemId, label, subject });
  return true;
}

export async function isBookmarked(itemType: BookmarkType, itemId: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  const { data } = await supabase.from("bookmarks").select("id").eq("user_id", user.id)
    .eq("item_type", itemType).eq("item_id", itemId).maybeSingle();
  return !!data;
}