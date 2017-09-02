import { create } from "jss";
import preset from "jss-preset-default";
import { SheetsRegistry } from "react-jss";
import createGenerateClassName from "material-ui/styles/createGenerateClassName";
import createMuiTheme from "material-ui/styles/createMuiTheme";
import createPalette from "material-ui/styles/createPalette";
import {grey, blue} from "material-ui/colors";

const theme = createMuiTheme({
    palette: createPalette({
        primary: grey,
        accent: blue
    }),
    overrides: {
        MuiAppBar: {
            colorPrimary: {
                backgroundColor: grey[900],
                color: "#fff"
            }
        }
    }
});

// Configure JSS
const jss = create(preset());
jss.options.createGenerateClassName = createGenerateClassName;

export default function createContext() {
  return {
    jss,
    theme,
    // This is needed in order to deduplicate the injection of CSS in the page.
    sheetsManager: new WeakMap(),
    // This is needed in order to inject the critical CSS.
    sheetsRegistry: new SheetsRegistry(),
  };
}
