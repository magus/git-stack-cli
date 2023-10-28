#!/usr/bin/env node

import React from "react";

import { render } from "ink";

import { App } from "./app/App.js";
import { command } from "./command.js";

const argv = await command();

render(<App argv={argv} />);
