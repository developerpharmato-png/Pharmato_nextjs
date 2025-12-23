"use client";

import Link from "next/link";
import { useEffect } from "react";
import LoginPage from "./login/page";
import Head from "next/head";

import { requestPermissionAndGetToken } from "./firebase/firebaseConfig";

export default function Home() {
  

  return (
    <>
      <Head>
        <title>HPBOSE | NEET &amp; JEE Preparation</title>
        <link rel="icon" href="/vercel.svg" />
      </Head>
      <LoginPage />
    </>
  );
}
