import React from 'react'
import Head from 'next/head'
import { ThemeProvider, createGlobalStyle } from 'styled-components'

const theme = {
  breakpoints: ['768px', '1400px'],
  colors: {
    primary: '#2ecc71',
    white: '#fcfcfc',
    black: '#202224',
    grey: '#aac',
    error: '#f33',
    border: '#deebf1',
  },
  space: [2, 4, 8, 16, 32, 64, 128, 256],
  sizes: {
    body: '800px',
  },
  fonts: {
    heading: 'Inter, system-ui, sans-serif',
    body: 'Inter, system-ui, sans-serif',
    mono: '"Source Code Pro", Courier, monospace',
  },
  fontSizes: [12, 14, 16, 20, 24, 36, 48, 60, 80, 96],
  fontWeights: {
    heading: 700,
    body: 400,
  },
  lineHeights: {
    heading: 1.2,
    body: 1.4,
  },
  radii: [2, 4, 8],
  shadows: {
    edge: '0 8px 24px 0 rgba(0, 0, 0, 0.12)',
  },
}

const GlobalStyle = createGlobalStyle(
  ({ theme: { fonts, colors, lineHeights, sizes, space } }) => `
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }
  body {
    background: ${colors.white};
  }
  #__next {
    min-height: 100vh;
    color: ${colors.black};
    font-family: ${fonts.body};
    line-height: ${lineHeights.body};
    max-width: ${sizes.body};
    margin: 0 auto;
    padding: ${space[4]}px ${space[3]}px;
  }
  a {
    text-decoration: none;
  }
`
)

const SqTracker = ({ Component, pageProps }) => {
  return (
    <>
      <Head>
        <title>sqtracker</title>
        <link rel="icon" href="favicon.png" type="image/png" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&family=Source+Code+Pro:wght@400;500;700&display=swap"
        />
      </Head>
      <ThemeProvider theme={theme}>
        <GlobalStyle />
        <Component {...pageProps} />
      </ThemeProvider>
    </>
  )
}

export default SqTracker
