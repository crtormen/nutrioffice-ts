import { createGlobalStyle } from "styled-components";

export const GlobalStyles = createGlobalStyle`

    html, body, div, span, applet, object, iframe,
    h1, h2, h3, h4, h5, h6, p, blockquote, pre,
    a, abbr, acronym, address, big, cite, code,
    del, dfn, em, img, ins, kbd, q, s, samp,
    small, strike, strong, sub, sup, tt, var,
    b, u, i, center,
    dl, dt, dd, ol, ul, li,
    fieldset, form, label, legend,
    table, caption, tbody, tfoot, thead, tr, th, td,
    article, aside, canvas, details, embed, 
    figure, figcaption, footer, header, hgroup, 
    menu, nav, output, ruby, section, summary,
    time, mark, audio, video {
        margin: 0;
        padding: 0;
        border: 0;
        font-size: 100%;
        font: inherit;
        vertical-align: baseline;
        color: white;
    }
    /* HTML5 display-role reset for older browsers */
    article, aside, details, figcaption, figure, 
    footer, header, hgroup, menu, nav, section {
        display: block;
    }
    html {
    scroll-behavior: smooth;
    height: 100%;
    }
    body {
    min-height: 100%;
        line-height: 1;
    }
    ol, ul {
        list-style: none;
    }
    blockquote, q {
        quotes: none;
    }
    blockquote:before, blockquote:after,
    q:before, q:after {
        content: '';
        content: none;
    }
    table {
        border-collapse: collapse;
        border-spacing: 0;
    }
    * {
        box-sizing: border-box;
    }
    body {
        background: #16202c;
        line-height: 1;
        font-size: 100%;
        font-family: "Roboto", sans-serif;
    }
    img {
        display: block;
        width: 100%;
        height: auto;
    }

    a.button {
        display: block;
    }

    button, a.button {
        display: inline-block;
        text-align: center;
        text-decoration: none;
        font-family: "Lato";
        font-size: 14px;
        font-weight: bolder;
        letter-spacing: 1px;
        margin: 4px 4px;
        padding: 1rem 2rem;
        border-radius: 8px;
        cursor: pointer;
        text-transform: uppercase;
        box-shadow: 0 10px 1rem rgba(var(--darkBlueRGB), 0.3);
    }

    @media (max-width: 768px){
        button, a.button {
        font-size: 12px;
        padding: 1rem;
        }
    }

    button.primary, a.button.primary {
        background-color: var(--blue);
        border: none;
        color: var(--white);
    }

    button.primary:hover, a.button.primary:hover {
        background-color: var(--mediumBlue);
        transition-duration: 0.3s;
    }

    button.secondary, a.button.secondary {
        background-color: transparent;
        border: 1px solid var(--mediumBlue);
        color: var(--mediumBlue);
    }


    button.secondary:hover, a.button.secondary:hover {
        border-color: var(--highlight);
        color: var(--highlight);
        transition-duration: 0.3s;
    }

    button:focus, a.button:focus {
        transform: scale(1.05) ease-in-out;
    }


    body.dark {
        --borders: #38444d;
        --texts: #8899a6;
        --postColor: #fff;
        --highlight: #0162ff;
        --mediumBackground: #192734;
        --background: #16202c;
        --white: #fff;
        --black: #222;
        --coffee: #9f6243;
        --orange: #DF6e05
        --lightblue: #8fcbe6;
        --mediumBlue: #5ba1c1;
        --classicBlue: #01627f;
        --darkBlue: #003c57;

    }
    body.light {
        --borders: #dedede;
        --postColor: #111;
        --grayTexts: #555555;
        --texts: #807077;
        --blue: #69c8c9;
        --lightBlue: #e7fcfc;
        --darkBlue: #26494A;
        --mediumBlue: #4E9596;
        --highlight: #FF94C2;
        --darkPink: #804A61;
        --anotherPink: #bb2465;
        --mediumPink: #c65585;
        --instagramPink: #dd2a7b;
        --lightPink: #fceff5  ;
        --lightPinkBackground: #fff5fa;
        --mediumBackground: #fafafa;
        --background: #fff;
        --white: #fff;
        --black: #222;
        --green: #39B51A;
        --lightGreen: #b4eba7;
        --mediumGreen: #3f8a2c;
        --gold: #F9BA06;
        --yellow: #FFE42E;
        --lightTrueBlue: #95CCF9;
        --mediumTrueBlue: #2397F7;
        --classicBlue: #0728A0;
        --darkTrueBlue: #07287C;
        --darkGrey: #444;
        --lightGrey: #666;
        --lightPinkRGB: 255,224,238;
        --highlightRGB: 255, 148, 194;
        --mediumPinkRGB: 223, 53, 143;
        --darkBlueRGB: 26, 49, 74;
        --darkGreenRGB: 44, 104, 74;
        --darkPinkRGB: 80, 74, 61;
        --lightBlueRGB: 173, 210, 210;
        --postColorRGB: 1, 1, 1;
        --lightGoldRGB: 250, 223, 150;
        --whiteRGB: 255, 255, 255;
        --menuBackground: rgba(255,255,255,0);
        --menuText: var(--postColor);
    }

`;
