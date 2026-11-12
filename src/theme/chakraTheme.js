import { extendTheme } from "@chakra-ui/react";

const primary = "#201895";

function pickColorMode(props, dark, light) {
  return props.colorMode === "dark" ? dark : light;
}

const mslFieldOutline = (props) =>
  pickColorMode(
    props,
    {
      bg: "#1a1d28",
      borderColor: "#35384a",
      color: "#f1f0f8",
      _placeholder: { color: "rgba(225, 223, 240, 0.45)" },
      _hover: { borderColor: "#4a4e62" },
      _focusVisible: {
        borderColor: "#7e72de",
        boxShadow: "0 0 0 1px rgba(126, 114, 222, 0.55)",
      },
    },
    {
      bg: "white",
      borderColor: "#e0e0e0",
      color: "#141414",
      _placeholder: { color: "rgba(20, 20, 20, 0.45)" },
      _hover: { borderColor: "#c4c4c4" },
      _focusVisible: {
        borderColor: primary,
        boxShadow: `0 0 0 1px ${primary}`,
      },
    }
  );

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
    FormLabel: {
      baseStyle: (props) => ({
        color: pickColorMode(props, "rgba(225, 223, 240, 0.68)", "gray.700"),
      }),
    },
    Input: {
      defaultProps: { variant: "outline" },
      variants: {
        outline: { field: mslFieldOutline },
      },
    },
    Select: {
      defaultProps: { variant: "outline" },
      variants: {
        outline: {
          field: mslFieldOutline,
          icon: {
            color: (props) =>
              pickColorMode(props, "rgba(225, 223, 240, 0.68)", "gray.500"),
          },
        },
      },
    },
    Textarea: {
      defaultProps: { variant: "outline" },
      variants: {
        outline: { field: mslFieldOutline },
      },
    },
    Modal: {
      baseStyle: (props) => ({
        dialog: pickColorMode(props, { bg: "#1a1d28", color: "#f1f0f8" }, {
          bg: "white",
          color: "#141414",
        }),
        header: {
          borderBottomWidth: "1px",
          borderColor: pickColorMode(props, "#35384a", "gray.200"),
        },
        footer: {
          borderTopWidth: "1px",
          borderColor: pickColorMode(props, "#35384a", "gray.200"),
        },
        closeButton: {
          color: pickColorMode(props, "rgba(225, 223, 240, 0.68)", "gray.500"),
          _hover: {
            color: pickColorMode(props, "#f1f0f8", "gray.800"),
          },
        },
      }),
    },
    Tabs: {
      variants: {
        line: {
          tab: (props) => ({
            color: pickColorMode(props, "rgba(225, 223, 240, 0.68)", "gray.600"),
            borderColor: "transparent",
            _selected: {
              color: pickColorMode(props, "#b8b4eb", primary),
              borderColor: pickColorMode(props, "#b8b4eb", primary),
            },
            _hover: {
              color: pickColorMode(props, "#f1f0f8", "gray.800"),
            },
          }),
        },
      },
    },
  },
});
