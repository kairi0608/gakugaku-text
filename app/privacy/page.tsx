import type { Metadata } from "next";
import { AppCard } from "@/components/design-system/AppCard";
import { PageHeader } from "@/components/design-system/PageHeader";
import { legalConfig } from "@/config/legal";

export const metadata: Metadata = { title: "プライバシーポリシー" };

const sections = [
  ["はじめに", `${legalConfig.appName}（以下「本サービス」）は、教材作成と学習記録のために必要な情報を取り扱います。本ページは現在の実装に合わせた運営用のひな型です。`],
  ["取得・保存する情報", "教材作成内容、問題、回答、得点、フィードバック、学習履歴、キャラクター情報・生成条件・生成画像、アップロード画像、バックアップデータを取り扱う場合があります。"],
  ["利用目的", "教材の生成・保存・表示、回答の採点、学習履歴と成長状況の表示、キャラクター生成、バックアップの提供、障害対応に利用します。"],
  ["AI機能における情報の取扱い", "OPENAI_API_KEYが設定されAI機能を利用する場合、教材生成や評価に必要な入力内容の一部をAIサービスへ送信する可能性があります。個人を特定できる情報や機密情報は入力しないでください。"],
  ["外部サービス", "本サービスはデータ保存にSupabaseを利用し、設定に応じてOpenAIのAI機能を利用します。各サービスでの取扱いには、それぞれの提供者の規約やポリシーが適用されます。"],
  ["データの保存", "教材、回答、履歴、キャラクター等はSupabaseへ保存されます。バックアップ機能を利用した場合、書き出したデータは利用者の端末にも保存されます。"],
  ["第三者提供", "法令に基づく場合を除き、保存情報を販売目的で第三者へ提供しません。サービス提供に必要な範囲で外部サービスへ送信する場合があります。"],
  ["安全管理", "アクセス権限、環境変数、サービス提供者の安全管理機能などを用いて、不正アクセスや漏えいのリスク低減に努めます。"],
  ["利用者による確認・修正・削除", "教材や学習データは本サービス上で確認できます。修正・削除の対応が必要な場合は、下記のお問い合わせ先へご連絡ください。"],
  ["未成年者の利用", "未成年の方は、必要に応じて保護者または学校の担当者と内容を確認したうえで利用してください。"],
  ["プライバシーポリシーの変更", "機能や運用の変更に応じて本ポリシーを更新することがあります。重要な変更は本サービス上で分かりやすくお知らせします。"],
  ["お問い合わせ", `運営者: ${legalConfig.operatorName}／連絡先: ${legalConfig.contactEmail}`],
] as const;

export default function PrivacyPage() {
  return <main className="shell legal-page"><PageHeader eyebrow="法的情報" title="プライバシーポリシー" description={`施行日: ${legalConfig.effectiveDate}`} /><AppCard>{sections.map(([title, body]) => <section className="legal-section" key={title}><h2>{title}</h2><p>{body}</p></section>)}</AppCard></main>;
}
