import { useEffect } from "react";
import { useColorMode } from "@chakra-ui/react";
import { useTheme } from "./ThemeContext";

/** Keeps Chakra color mode aligned with Tailwind `html.dark` / ThemeContext. */
export function ChakraThemeSync({ children }) {
  const { theme } = useTheme();
  const { setColorMode } = useColorMode();

  useEffect(() => {
    setColorMode(theme);
  }, [theme, setColorMode]);

  return children;
}
