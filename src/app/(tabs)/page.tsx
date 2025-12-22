import { redirect } from "next/navigation";

/**
 * Home page - redirects to the Practice page
 */
const HomePage = () => {
  redirect("/practice");
};

export default HomePage;
