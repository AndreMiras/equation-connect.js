# Equation Connect

[![Tests](https://github.com/AndreMiras/equation-connect.js/workflows/Tests/badge.svg?branch=develop)](https://github.com/AndreMiras/equation-connect.js/actions?query=workflow%3ATests)

This is a library for the reverse engineered
[Equation Connect](https://play.google.com/store/apps/details?id=com.equation.connect) API.
The Equation Connect is an app for controlling wifi radiators.

## Install
```sh
yarn add equation-connect
```

## Usage
Here's a basic example for logging and retrieving installations information.
```js
import { login, getInstallations } from "equation-connect";

const showInstallations = async (email, password) => {
  const user = await login(email, password);
  const installations = await getInstallations(user.uid);
  console.log(installations);
};
showInstallations(process.env.EMAIL, process.env.PASSWORD);
```
