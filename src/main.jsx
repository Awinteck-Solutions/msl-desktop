import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { ChakraProvider, ColorModeScript } from "@chakra-ui/react";
import { chakraTheme } from "./theme/chakraTheme";
import { ThemeProvider } from "./Context/ThemeContext";
import { ChakraThemeSync } from "./Context/ChakraThemeSync";
import { initCopyProtection } from "./utils/copyProtection";

initCopyProtection();

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ChakraProvider theme={chakraTheme}>
      <ColorModeScript initialColorMode={chakraTheme.config.initialColorMode} />
      <ThemeProvider>
        <ChakraThemeSync>
          <App />
        </ChakraThemeSync>
      </ThemeProvider>
    </ChakraProvider>
  </StrictMode>
);
