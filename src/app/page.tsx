"use client";

import { redirect } from "next/navigation";

const Home: React.FC = () => {
  redirect("/review");
};

export default Home;
