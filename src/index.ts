#!/usr/bin/env node
import { KEGGServer } from './server.js';

const server = new KEGGServer();
server.run().catch(console.error);
