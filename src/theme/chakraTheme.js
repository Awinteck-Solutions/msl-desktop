import { extendTheme } from "@chakra-ui/react";

const primary = "#201895";

export const chakraTheme = extendTheme({
  config: {
    initialColorMode: "light",
    useSystemColorMode: false,
  },
  fonts: {
    heading: `"Space Grotesk", system-ui, sans-serif`,
    body: `Inter, system-ui, sans-serif`,
  },
  colors: {
    brand: {
      50: "#eeecfa",
      100: "#d4d0f4",
      200: "#a9a1e9",
      300: "#7e72de",
      400: "#5343d3",
      500: primary,
      600: "#1a1377",
      700: "#140e59",
      800: "#0d093b",
      900: "#07041e",
    },
  },
  styles: {
    global: (props) => ({
      ".chakra-accordion__button": {
        color: props.colorMode === "dark" ? "#f1f0f8" : undefined,
        background: "transparent",
      },
      ".chakra-accordion__icon": {
        color: props.colorMode === "dark" ? "rgba(225, 223, 240, 0.68)" : undefined,
      },
    }),
  },
  components: {
    Button: {
      defaultProps: {
        colorScheme: "brand",
      },
    },
    Progress: {
      defaultProps: {
        colorScheme: "brand",
      },
    },
  },
});
