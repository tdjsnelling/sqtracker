import { useEffect } from "react";
import { useRouter } from "next/router";
import { useCookies } from "react-cookie";

const Logout = () => {
  const [, , removeCookie] = useCookies();

  const router = useRouter();

  useEffect(() => {
    removeCookie("token", { path: "/" });
    removeCookie("userId", { path: "/" });
    router.push("/");
  }, []);

  return null;
};

export default Logout;
