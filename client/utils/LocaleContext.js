import { createContext } from "react";

export default createContext({
  locale: "en",
  setLocale: () => {},
  locales: [],
  getLocaleString: () => {},
});
