# DescribRO

Online editor for RO Crate. This is an experimental prototype that works only on Chrome, Edge, and Opera web browser.
It uses the [File System Access API](https://developer.mozilla.org/en-US/docs/Web/API/File_System_Access_API) which is still an experimental feature.

This tool can be used directly from:
https://arkisto-platform.github.io/describro

## Project Setup

```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Compile and Minify for Production

```sh
npm run build
```

### Run Unit Tests with [Vitest](https://vitest.dev/)

```sh
npm run test:unit
```

## Run with webpack

compile and dev with HMR

```sh
npm run dev:webpack
```

and go to http://localhost:9000/

Compile and minify for production
```sh 
npm run build:webpack
```

Files compiled in [dist](dist)