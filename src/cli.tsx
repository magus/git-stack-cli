#!/usr/bin/env node

import React from "react";

import { render } from "ink";

import { App } from "./app/App.js";
import { command } from "./command.js";

import type { Instance as InkInstance } from "ink";

const argv = await command();

const ink = {} as InkInstance;
const app = render(<App argv={argv} ink={ink} />);
Object.assign(ink, app);
