import {createMuiTheme} from "@material-ui/core/styles";

import {grey, blue} from "@material-ui/core/colors";

const theme = createMuiTheme({
    palette: {
        primary: grey,
        secondary: blue
    },
    overrides: {
        MuiAppBar: {
            colorPrimary: {
                backgroundColor: grey[900],
                color: "#fff"
            }
        }
    }
});

export default theme;
