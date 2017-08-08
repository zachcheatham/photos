// @flow

import { create } from 'jss';
import preset from 'jss-preset-default';
import { SheetsRegistry } from 'react-jss';
import createPalette from 'material-ui/styles/palette';
import createMuiTheme from 'material-ui/styles/theme';
import {amber, blue} from 'material-ui/colors';
import createGenerateClassName from 'material-ui/styles/createGenerateClassName';

const theme = createMuiTheme({
    palette: createPalette({
        primary: amber,
        accent: blue
    }),
    overrides: {
        MuiAppBar: {
            colorPrimary: {
                backgroundColor: amber["A100"]
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
