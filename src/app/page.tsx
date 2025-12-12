import Link from "next/link";
import LoginPage from "./login/page";
import Head from "next/head";


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
