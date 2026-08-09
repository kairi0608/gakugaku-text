import type {Metadata} from "next";import "./globals.css";import {Nav} from "@/components/Nav";
export const metadata:Metadata={title:"ガクガク教材Hub Local",description:"AI教材を作って学べる、ローカル専用学習アプリ"};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="ja"><body><Nav/>{children}</body></html>}
