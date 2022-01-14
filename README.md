# Equation Connect

[![Tests](https://github.com/AndreMiras/equation-connect.js/workflows/Tests/badge.svg?branch=develop)](https://github.com/AndreMiras/equation-connect.js/actions/workflows/tests.yml)
[![Documentation](https://github.com/AndreMiras/equation-connect.js/workflows/Documentation/badge.svg?branch=develop)](https://github.com/AndreMiras/equation-connect.js/actions/workflows/documentation.yml)
[![npm version](https://badge.fury.io/js/equation-connect.svg)](https://badge.fury.io/js/equation-connect)

This is a library for the [Reverse Engineered](docs/ReverseEngineering.md)
Equation & Rointe Connect Firebase API.

The [Equation Connect](https://play.google.com/store/apps/details?id=com.equation.connect)
is an app for controlling wifi radiators, like the
[Emisor fluido EQUATION Adagio 1250w](https://www.leroymerlin.es/fp/83406849/emisor-fluido-equation-adagio-1250w)
from Leroy Merlin.
The library is also compatible with
[Rointe Connect](https://play.google.com/store/apps/details?id=com.droiders.android.rointeconnect)
since it uses the same infrastructure, but different connection paramters.

## Motivations
- providing an [open source web alternative](https://github.com/AndreMiras/equation-connect)
  to the proprietary mobile app
- remote backlight setup
- access to temperature sensors
- improving the interoperability (Nest, HomeAssistant...)

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
Explore the documentation for more:
<https://andremiras.github.io/equation-connect.js>
