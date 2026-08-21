import { PageHeader } from "@/components/design-system/PageHeader";
import { dailyMoodSchema, interestCategorySchema, presentationFamilySchema } from "@/features/learning-session/shared/schemas";
import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";
import { localDateAt, validateTimeZone } from "@/lib/time/local-date";
import { PracticeSetupForm } from "./PracticeSetupForm";

export const dynamic = "force-dynamic";

export default async function StudentPracticePage() {
  const current = await requireRole("student");
  const db = await createClient();
  const settings = await db.from("hub_user_settings").select("presentation_family,interest_category,timezone").eq("user_id", current.user.id).maybeSingle();
  const timezone = validateTimeZone(settings.data?.timezone);
  const moodResult = await db.from("hub_daily_moods").select("mood").eq("user_id", current.user.id).eq("local_date", localDateAt(new Date(), timezone)).maybeSingle();
  const mood = dailyMoodSchema.nullable().catch(null).parse(moodResult.data?.mood ?? null);
  return <main className="shell practice-page"><PageHeader eyebrow="自主チャレンジ" title="今日のGAMEを作ろう" description="好きな世界と問題数を選んで、1問ずつ進めます。" /><PracticeSetupForm initialPresentation={presentationFamilySchema.catch("illustration").parse(settings.data?.presentation_family)} initialInterest={interestCategorySchema.catch("adventure").parse(settings.data?.interest_category)} mood={mood} /></main>;
}
