import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { ChakraProvider, ColorModeScript } from "@chakra-ui/react";
import { chakraTheme } from "./theme/chakraTheme";
import { ThemeProvider } from "./Context/ThemeContext";
import { ChakraThemeSync } from "./Context/ChakraThemeSync";
import { initCopyProtection } from "./utils/copyProtection";
import apiEndpoints from "./Services/apiConfig";

initCopyProtection();

async function allowImageOrigins() {
  const allow = window.electronAPI?.allowImageOrigin;
  if (!allow) return;
  const origins = [
    apiEndpoints.bucketUrl,
    apiEndpoints.cdnUrl,
    "https://mslelearning.com",
  ];
  await Promise.all(origins.filter(Boolean).map((origin) => allow(origin)));
}

allowImageOrigins().finally(() => {
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
});
