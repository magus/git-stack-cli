#!/usr/bin/env node

import * as React from "react";

import * as Ink from "ink";

import { App } from "./app/App.js";
import { command } from "./command.js";

import type { Instance as InkInstance } from "ink";

const argv = await command();

const ink = {} as InkInstance;
const app = Ink.render(<App argv={argv} ink={ink} />);
Object.assign(ink, app);
